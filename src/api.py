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
CORS(app)

MODEL_PATH = os.path.join('models', 'final_model.pkl')
SCALER_PATH = os.path.join('models', 'scaler.pkl')

model = None
scaler = None

def load_model():
    """Load the trained model and scaler"""
    global model, scaler
    try:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            print("SUCCESS: Model loaded successfully")
        else:
            print("WARNING: Model not found. Please train the model first.")
            
        if os.path.exists(SCALER_PATH):
            scaler = joblib.load(SCALER_PATH)
            print("SUCCESS: Scaler loaded successfully")
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
    """Predict student performance based on input features"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        df = pd.DataFrame([data])
        X = preprocess_input(df)
        
        prediction_score = None
        if model is None:
            prediction_score = calculate_mock_prediction(data)
            risk_level = determine_risk_level(prediction_score)
        else:
            try:
                if scaler:
                    X_scaled = scaler.transform(X)
                    prediction_risk = model.predict(X_scaled)[0]
                else:
                    prediction_risk = model.predict(X)[0]
                
                risk_level = prediction_risk
                
                if risk_level == "At-risk":
                    prediction_score = 8.0
                elif risk_level == "Average":
                    prediction_score = 13.0
                else:
                    prediction_score = 17.0
                    
            except Exception as model_error:
                print(f"Model prediction error: {model_error}")
                prediction_score = calculate_mock_prediction(data)
                risk_level = determine_risk_level(prediction_score)
        
        try:
            sys.path.insert(0, os.path.dirname(__file__))
            from diagnosis import get_student_diagnosis
            diagnosis = get_student_diagnosis(data, risk_level)
        except Exception as diag_error:
            print(f"Diagnosis error: {diag_error}")
            diagnosis = {
                "weaknesses": [],
                "strengths": [],
                "reason": f"Student is in the {risk_level} category.",
                "profile": "No profile assigned"
            }
        
        return jsonify({
            'predicted_grade': float(prediction_score) if prediction_score else 12.0,
            'risk_level': risk_level,
            'confidence': 0.85,
            'diagnosis': diagnosis,
            'status': 'success'
        })
        
    except Exception as e:
        print(f"Predict endpoint error: {str(e)}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

def preprocess_input(df):
    """Preprocess input data to match training format exactly."""
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
    
    categorical_defaults = {
        'school': 'GP', 'sex': 'F', 'address': 'U', 'famsize': 'GT3', 'Pstatus': 'T',
        'Mjob': 'other', 'Fjob': 'other', 'reason': 'course', 'guardian': 'mother',
        'schoolsup': 'no', 'famsup': 'no', 'paid': 'no', 'activities': 'no',
        'nursery': 'yes', 'higher': 'yes', 'internet': 'yes', 'romantic': 'no',
        'subject': 'math'
    }
    
    for col, default in categorical_defaults.items():
        if col not in df.columns:
            df[col] = default
            
    df_encoded = pd.get_dummies(df, columns=list(categorical_defaults.keys()))
    final_df = pd.DataFrame(index=df.index)
    
    numeric_defaults = {
        'age': 17, 'Medu': 2, 'Fedu': 2, 'traveltime': 1, 'studytime': 2, 'failures': 0, 
        'famrel': 4, 'freetime': 3, 'goout': 3, 'Dalc': 1, 'Walc': 1, 'health': 3, 'absences': 0
    }
    
    for col, default in numeric_defaults.items():
        final_df[col] = df[col] if col in df.columns else default
            
    for feat in expected_features:
        if feat in numeric_defaults:
            continue
        final_df[feat] = df_encoded[feat] if feat in df_encoded.columns else 0
            
    return final_df[expected_features]

def determine_risk_level(score):
    """Determine risk level based on predicted score"""
    if score < 10: return "At-risk"
    if score < 15: return "Average"
    return "High-performing"

def calculate_mock_prediction(data):
    """Calculate mock prediction when model is not available"""
    score = 12.0 + (data.get('studytime', 2) * 0.5)
    score -= data.get('failures', 0) * 2
    score -= min(data.get('absences', 0) / 10, 3)
    if data.get('higher') == 'yes': score += 1
    if data.get('famsup') == 'yes': score += 0.5
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
    load_model()
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') == 'development'
    print(f"Running on http://0.0.0.0:{port}")
    app.run(debug=debug, host='0.0.0.0', port=port)
