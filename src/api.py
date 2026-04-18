"""
Flask API for LearnScope.ai
This API serves predictions from the trained ML model to the frontend.
Includes AI Coach integration (Member 2) for LLM-powered coaching.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import sys
import os
import logging
import uuid
from datetime import datetime, timezone
sys.path.insert(0, os.path.dirname(__file__))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from ai_coach import generate_ai_coaching, is_ai_available

app = Flask(__name__)
allowed_origins = os.environ.get('ALLOWED_ORIGINS', '*').split(',')
CORS(app, resources={r"/*": {"origins": allowed_origins}})

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
            logger.info("SUCCESS: Model loaded successfully")
        else:
            logger.warning("WARNING: Model not found. Please train the model first.")
            
        if os.path.exists(SCALER_PATH):
            scaler = joblib.load(SCALER_PATH)
            logger.info("SUCCESS: Scaler loaded successfully")
    except Exception as e:
        logger.error(f"Error loading model: {e}")

@app.route('/')
def home():
    """Health check endpoint"""
    return jsonify({
        'status': 'running',
        'message': 'LearnScope.ai API',
        'model_loaded': model is not None,
        'version': '1.0.0'
    })

def detect_input_format(data):
    """Detect if input is in flat or nested format"""
    if not data:
        return "none"
    if 'student_data' in data and 'goal' in data:
        return "nested"
    if 'studytime' in data or 'failures' in data:
        return "flat"
    return "unknown"

def normalize_input(data):
    """Normalize flat input format to nested format"""
    input_format = detect_input_format(data)
    
    if input_format == "nested":
        return data, False
    
    if input_format == "flat":
        logger.info("Detected flat input format, normalizing to nested format")
        
        # Extract student data fields
        student_data = {}
        goal = {}
        
        # Known student data fields
        student_fields = [
            'age', 'Medu', 'Fedu', 'traveltime', 'studytime', 'failures',
            'famrel', 'freetime', 'goout', 'Dalc', 'Walc', 'health', 'absences',
            'school', 'sex', 'address', 'famsize', 'Pstatus', 'Mjob', 'Fjob',
            'reason', 'guardian', 'schoolsup', 'famsup', 'paid', 'activities',
            'nursery', 'higher', 'internet', 'romantic', 'subject'
        ]
        
        for field in student_fields:
            if field in data:
                student_data[field] = data[field]
        
        # Handle goal field
        if 'goal' in data:
            if isinstance(data['goal'], str):
                goal = {'priority': data['goal']}
            else:
                goal = data['goal']
        else:
            goal = {'priority': 'medium'}
        
        return {'student_data': student_data, 'goal': goal}, True
    
    # Unknown format, return as-is
    return data, False

def validate_input(data):
    """Validate input data structure and required fields"""
    errors = []
    
    # Check if data exists
    if not data:
        return False, "No data provided"
    
    # Check student_data
    if 'student_data' not in data:
        errors.append("Missing required field: student_data")
    else:
        student_data = data['student_data']
        required_student_fields = ['studytime', 'failures']
        for field in required_student_fields:
            if field not in student_data:
                errors.append(f"Missing required field in student_data: {field}")
            else:
                # Type validation
                if field in ['studytime', 'failures', 'age', 'absences', 'health', 'goout']:
                    if not isinstance(student_data[field], (int, float)):
                        errors.append(f"Field {field} must be a number")
                # Range validation
                if field == 'studytime' and student_data[field] is not None:
                    if not (1 <= student_data[field] <= 4):
                        errors.append("studytime must be between 1 and 4")
                if field == 'failures' and student_data[field] is not None:
                    if not (0 <= student_data[field] <= 3):
                        errors.append("failures must be between 0 and 3")
    
    # Check goal
    if 'goal' not in data:
        errors.append("Missing required field: goal")
    else:
        goal = data['goal']
        if 'priority' not in goal:
            errors.append("Missing required field in goal: priority")
        else:
            if goal['priority'] not in ['high', 'medium', 'low']:
                errors.append("priority must be one of: high, medium, low")
    
    if errors:
        return False, "; ".join(errors)
    return True, None

def validate_response(response):
    """Validate response structure before returning"""
    required_keys = ['predicted_grade', 'risk_level', 'diagnosis', 'ai_coaching', 'status']
    for key in required_keys:
        if key not in response:
            return False, f"Missing required field: {key}"
    
    # Validate nested structure
    if 'value' not in response['predicted_grade']:
        return False, "predicted_grade missing 'value' field"
    if 'category' not in response['risk_level']:
        return False, "risk_level missing 'category' field"
    if 'code' not in response['status']:
        return False, "status missing 'code' field"
    
    return True, None

def get_default_ai_coaching():
    """Return default AI coaching structure when AI fails"""
    return {
        "learning_diagnosis": "AI coaching unavailable. Using rule-based recommendations.",
        "study_plan": {
            "overview": "Standard study plan based on your academic profile",
            "days": []
        },
        "resources": [],
        "next_steps": [
            "Review today's learning outcomes in your study journal.",
            "Set your goals for tomorrow to stay organized.",
            "Complete a 25-minute focused study block tonight.",
            "Organize your study space for maximum productivity.",
            "Tell someone what you learned today to boost retention."
        ],
        "ai_generated": False
    }

@app.route('/predict', methods=['POST'])
def predict():
    """Predict student performance based on input features"""
    request_id = str(uuid.uuid4())
    logger.info(f"[{request_id}] Request received")
    
    try:
        data = request.json
        if not data:
            logger.error(f"[{request_id}] No data provided")
            return jsonify({
                'status': {
                    'code': 'error',
                    'message': 'No data provided',
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'request_id': request_id
                }
            }), 400
        
        # Normalize input format (support both flat and nested)
        data, was_normalized = normalize_input(data)
        if was_normalized:
            logger.info(f"[{request_id}] Input normalized from flat to nested format")
        
        # Input validation
        is_valid, error_msg = validate_input(data)
        if not is_valid:
            logger.error(f"[{request_id}] Validation failed: {error_msg}")
            return jsonify({
                'status': {
                    'code': 'error',
                    'message': f'Validation failed: {error_msg}',
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'request_id': request_id
                },
                'error_details': {'issue': error_msg}
            }), 400
        
        df = pd.DataFrame([data.get('student_data', {})])
        X = preprocess_input(df)
        
        prediction_score = None
        if model is None:
            logger.warning(f"[{request_id}] Model not loaded, using mock prediction")
            prediction_score = calculate_mock_prediction(data.get('student_data', data))
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
                logger.error(f"[{request_id}] Model prediction error: {model_error}")
                prediction_score = calculate_mock_prediction(data.get('student_data', data))
                risk_level = determine_risk_level(prediction_score)
        
        try:
            from diagnosis import get_student_diagnosis
            diagnosis = get_student_diagnosis(data.get('student_data', data), risk_level)
        except Exception as diag_error:
            logger.error(f"[{request_id}] Diagnosis error: {diag_error}")
            diagnosis = {
                "weaknesses": [],
                "strengths": [],
                "patterns": [],
                "recommendations": [],
                "reason": f"Student is in the {risk_level} category.",
                "profile": "No profile assigned"
            }
        
        final_grade = float(prediction_score) if prediction_score else 12.0
        goal = data.get('goal', {}).get('target_grade', 'Improve overall academic performance')
        if isinstance(goal, dict):
            goal = goal.get('target_grade', 'Improve overall academic performance')
        
        try:
            ai_coaching = generate_ai_coaching(
                student_data=data.get('student_data', data),
                diagnosis=diagnosis,
                risk_level=risk_level,
                predicted_grade=final_grade,
                goal=str(goal)
            )
        except Exception as ai_error:
            logger.error(f"[{request_id}] AI Coach error: {ai_error}")
            ai_coaching = get_default_ai_coaching()
        
        # Ensure ai_coaching is never None
        if ai_coaching is None:
            ai_coaching = get_default_ai_coaching()
        
        # Calculate risk score
        risk_score = 0
        if risk_level == "At-risk":
            risk_score = 75
        elif risk_level == "Average":
            risk_score = 50
        else:
            risk_score = 25
        
        # Extract factors from diagnosis
        risk_factors = diagnosis.get('weaknesses', [])
        
        response_data = {
            'predicted_grade': {
                'value': final_grade,
                'confidence': 0.85,
                'subject': data.get('student_data', {}).get('subject', 'general')
            },
            'risk_level': {
                'category': risk_level,
                'score': risk_score,
                'factors': risk_factors
            },
            'diagnosis': {
                'strengths': diagnosis.get('strengths', []),
                'weaknesses': diagnosis.get('weaknesses', []),
                'patterns': diagnosis.get('patterns', []),
                'recommendations': diagnosis.get('recommendations', [])
            },
            'ai_coaching': ai_coaching,
            'status': {
                'code': 'success',
                'message': 'Prediction completed successfully',
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'request_id': request_id
            }
        }
        
        # Validate response before returning
        is_valid, validation_error = validate_response(response_data)
        if not is_valid:
            logger.error(f"[{request_id}] Response validation failed: {validation_error}")
            # Return safe default response
            response_data['status']['code'] = 'error'
            response_data['status']['message'] = 'Internal error occurred'
        
        logger.info(f"[{request_id}] Request completed successfully")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"[{request_id}] Predict endpoint error: {str(e)}")
        return jsonify({
            'predicted_grade': {'value': 12.0, 'confidence': 0.0, 'subject': 'unknown'},
            'risk_level': {'category': 'Average', 'score': 50, 'factors': []},
            'diagnosis': {'strengths': [], 'weaknesses': [], 'patterns': [], 'recommendations': []},
            'ai_coaching': get_default_ai_coaching(),
            'status': {
                'code': 'error',
                'message': 'Internal server error',
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'request_id': request_id
            }
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

@app.route('/ai-status', methods=['GET'])
def ai_status():
    """Check if AI Coach (LLM) is configured and available"""
    return jsonify({
        'ai_available': is_ai_available(),
        'model': os.environ.get('GROQ_MODEL', 'llama-3.3-70b-versatile'),
        'provider': 'Groq'
    })

if __name__ == '__main__':
    load_model()
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') == 'development'
    print(f"Running on http://0.0.0.0:{port}")
    app.run(debug=debug, host='0.0.0.0', port=port)
