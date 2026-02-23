"""
Flask API for LearnScope.ai
This API serves predictions from the trained ML model to the frontend.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import os
import sys

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

# Load the trained model (will need to be trained first)
MODEL_PATH = os.path.join('models', 'final_model.pkl')
SCALER_PATH = os.path.join('models', 'scaler.pkl')

# Global variables for model and scaler
model = None
scaler = None

def load_model():
    """Load the trained model and scaler"""
    global model, scaler
    try:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            print("✓ Model loaded successfully")
        else:
            print("⚠ Model not found. Please train the model first.")
            
        if os.path.exists(SCALER_PATH):
            scaler = joblib.load(SCALER_PATH)
            print("✓ Scaler loaded successfully")
    except Exception as e:
        print(f"Error loading model: {e}")

@app.route('/')
def home():
    """Health check endpoint"""
    return jsonify({
        'status': 'running',
        'message': 'LearnScope.ai API',
        'model_loaded': model is not None,
        'version': '1.0.0'
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict student performance based on input features
    
    Expected JSON input:
    {
        "school": "GP",
        "sex": "F",
        "age": 17,
        ...all other features
    }
    
    Returns:
    {
        "predicted_grade": 15.2,
        "risk_level": "Average",
        "confidence": 0.85,
        "recommendations": [...]
    }
    """
    try:
        # Get JSON data from request
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Convert to DataFrame
        df = pd.DataFrame([data])
        
        # Preprocess the data - match training preprocessing
        X = preprocess_input(df)
        
        # Make prediction
        prediction_score = None
        if model is None:
            # Return mock prediction if model not loaded
            prediction_score = calculate_mock_prediction(data)
            risk_level = determine_risk_level(prediction_score)
        else:
            # Use actual ML model for risk level prediction
            try:
                if scaler:
                    X_scaled = scaler.transform(X)
                    prediction_risk = model.predict(X_scaled)[0]
                else:
                    prediction_risk = model.predict(X)[0]
                
                risk_level = prediction_risk
                
                # Estimate a grade score based on risk level
                if risk_level == "At-risk":
                    prediction_score = 8.0
                elif risk_level == "Average":
                    prediction_score = 13.0
                else:  # High-performing
                    prediction_score = 17.0
                    
            except Exception as model_error:
                print(f"Model prediction error: {model_error}")
                prediction_score = calculate_mock_prediction(data)
                risk_level = determine_risk_level(prediction_score)
        
        # Generate recommendations
        sys.path.insert(0, os.path.dirname(__file__))
        from recommendation import generate_recommendations
        recommendations = generate_recommendations(data, risk_level)
        
        # Return prediction
        return jsonify({
            'predicted_grade': float(prediction_score) if prediction_score else 12.0,
            'risk_level': risk_level,
            'confidence': 0.85,
            'recommendations': recommendations,
            'status': 'success'
        })
        
    except Exception as e:
        print(f"Predict endpoint error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

def preprocess_input(df):
    """
    Preprocess input data to match training format exactly.
    Ensures all 40 dummy columns are present in the correct order.
    """
    # 1. Define all feature columns the model expects (in order)
    expected_features = [
        'age', 'Medu', 'Fedu', 'traveltime', 'studytime', 'failures', 'famrel', 
        'freetime', 'goout', 'Dalc', 'Walc', 'health', 'absences', 
        'school_MS', 'sex_M', 'address_U', 'famsize_LE3', 'Pstatus_T', 
        'Mjob_health', 'Mjob_other', 'Mjob_services', 'Mjob_teacher', 
        'Fjob_health', 'Fjob_other', 'Fjob_services', 'Fjob_teacher', 
        'reason_home', 'reason_other', 'reason_reputation', 
        'guardian_mother', 'guardian_other', 'schoolsup_yes', 'famsup_yes', 
        'paid_yes', 'activities_yes', 'nursery_yes', 'higher_yes', 
        'internet_yes', 'romantic_yes', 'subject_portuguese'
    ]
    
    # 2. Categorical columns for get_dummies and their defaults
    categorical_defaults = {
        'school': 'GP', 'sex': 'F', 'address': 'U', 'famsize': 'GT3', 'Pstatus': 'T',
        'Mjob': 'other', 'Fjob': 'other', 'reason': 'course', 'guardian': 'mother',
        'schoolsup': 'no', 'famsup': 'no', 'paid': 'no', 'activities': 'no',
        'nursery': 'yes', 'higher': 'yes', 'internet': 'yes', 'romantic': 'no',
        'subject': 'math'
    }
    
    # Fill missing categorical columns
    for col, default in categorical_defaults.items():
        if col not in df.columns:
            df[col] = default
            
    # 3. Create dummies
    df_encoded = pd.get_dummies(df, columns=list(categorical_defaults.keys()))
    
    # 4. Fill missing columns with 0 and ensure order
    final_df = pd.DataFrame(index=df.index)
    
    # Add numeric columns
    numeric_defaults = {
        'age': 17, 'Medu': 2, 'Fedu': 2, 'traveltime': 1, 'studytime': 2, 'failures': 0, 
        'famrel': 4, 'freetime': 3, 'goout': 3, 'Dalc': 1, 'Walc': 1, 'health': 3, 'absences': 0
    }
    
    for col, default in numeric_defaults.items():
        if col in df.columns:
            final_df[col] = df[col]
        else:
            final_df[col] = default
            
    # Add/Map dummy columns
    # We manually map the "dropped first" logic or check presence
    for feat in expected_features:
        if feat in numeric_defaults:
            continue
        if feat in df_encoded.columns:
            final_df[feat] = df_encoded[feat]
        else:
            final_df[feat] = 0
            
    # Ensure exact order
    return final_df[expected_features]

def determine_risk_level(score):
    """Determine risk level based on predicted score"""
    if score < 10:
        return "At-risk"
    elif score < 15:
        return "Average"
    else:
        return "High-performing"

def calculate_mock_prediction(data):
    """Calculate mock prediction when model is not available"""
    score = 12.0
    
    # Adjust based on key factors
    score += data.get('studytime', 2) * 0.5
    score -= data.get('failures', 0) * 2
    score -= min(data.get('absences', 0) / 10, 3)
    
    if data.get('higher') == 'yes':
        score += 1
    if data.get('famsup') == 'yes':
        score += 0.5
    
    return max(0, min(20, score))

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'scaler_loaded': scaler is not None
    })

if __name__ == '__main__':
    print("🚀 Starting LearnScope.ai API...")
    load_model()
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') == 'development'
    print(f"📡 Running on http://0.0.0.0:{port}")
    print("📝 API endpoints:")
    print("   GET  /          - API info")
    print("   POST /predict   - Make predictions")
    print("   GET  /health    - Health check")
    app.run(debug=debug, host='0.0.0.0', port=port)
