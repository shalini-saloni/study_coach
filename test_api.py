"""
Test script to validate the Flask API changes
Tests input format normalization and response structure
"""
import requests
import json

BASE_URL = "http://localhost:5001"

def test_flat_format():
    """Test that flat input format is normalized correctly"""
    print("Testing flat input format...")
    
    flat_data = {
        "studytime": 2,
        "failures": 0,
        "absences": 5,
        "health": 3,
        "goout": 2,
        "higher": "yes",
        "famsup": "yes",
        "internet": "yes",
        "subject": "math"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/predict", json=flat_data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            
            # Validate response structure
            assert "predicted_grade" in result, "Missing predicted_grade"
            assert "risk_level" in result, "Missing risk_level"
            assert "diagnosis" in result, "Missing diagnosis"
            assert "ai_coaching" in result, "Missing ai_coaching"
            assert "status" in result, "Missing status"
            
            # Validate nested structure
            assert "value" in result["predicted_grade"], "Missing predicted_grade.value"
            assert "category" in result["risk_level"], "Missing risk_level.category"
            assert "code" in result["status"], "Missing status.code"
            
            # Validate ai_coaching is never missing
            assert result["ai_coaching"] is not None, "ai_coaching should never be None"
            
            print("✓ Flat format test passed")
            return True
        else:
            print(f"✗ Flat format test failed: Status {response.status_code}")
            print(f"  Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to backend. Is it running?")
        return False
    except Exception as e:
        print(f"✗ Flat format test failed: {e}")
        return False

def test_nested_format():
    """Test that nested input format works correctly"""
    print("Testing nested input format...")
    
    nested_data = {
        "student_data": {
            "studytime": 3,
            "failures": 0,
            "absences": 2,
            "health": 4,
            "goout": 2,
            "higher": "yes",
            "famsup": "yes",
            "internet": "yes",
            "subject": "math"
        },
        "goal": {
            "priority": "high",
            "target_grade": "Improve performance"
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/predict", json=nested_data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            
            # Validate response structure
            assert "predicted_grade" in result, "Missing predicted_grade"
            assert "risk_level" in result, "Missing risk_level"
            assert "diagnosis" in result, "Missing diagnosis"
            assert "ai_coaching" in result, "Missing ai_coaching"
            assert "status" in result, "Missing status"
            
            print("✓ Nested format test passed")
            return True
        else:
            print(f"✗ Nested format test failed: Status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to backend. Is it running?")
        return False
    except Exception as e:
        print(f"✗ Nested format test failed: {e}")
        return False

def test_at_risk_student():
    """Test at-risk student scenario"""
    print("Testing at-risk student...")
    
    data = {
        "student_data": {
            "studytime": 1,
            "failures": 2,
            "absences": 15,
            "health": 2,
            "goout": 4
        },
        "goal": {
            "priority": "high"
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/predict", json=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            risk_category = result["risk_level"]["category"]
            
            if risk_category == "At-risk":
                print(f"✓ At-risk student test passed (risk: {risk_category})")
                return True
            else:
                print(f"✗ At-risk student test failed (expected 'At-risk', got '{risk_category}')")
                return False
        else:
            print(f"✗ At-risk student test failed: Status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ At-risk student test failed: {e}")
        return False

def test_high_performing_student():
    """Test high-performing student scenario"""
    print("Testing high-performing student...")
    
    data = {
        "student_data": {
            "studytime": 4,
            "failures": 0,
            "absences": 2,
            "health": 5,
            "goout": 2
        },
        "goal": {
            "priority": "medium"
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/predict", json=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            risk_category = result["risk_level"]["category"]
            
            if risk_category == "High-performing":
                print(f"✓ High-performing student test passed (risk: {risk_category})")
                return True
            else:
                print(f"✗ High-performing student test failed (expected 'High-performing', got '{risk_category}')")
                return False
        else:
            print(f"✗ High-performing student test failed: Status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ High-performing student test failed: {e}")
        return False

def test_validation():
    """Test input validation"""
    print("Testing input validation...")
    
    # Test missing required field
    invalid_data = {
        "student_data": {
            "studytime": 2
            # Missing failures
        },
        "goal": {
            "priority": "high"
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/predict", json=invalid_data, timeout=10)
        
        if response.status_code == 400:
            result = response.json()
            assert "status" in result, "Missing status in error response"
            assert result["status"]["code"] == "error", "Error status code incorrect"
            print("✓ Validation test passed")
            return True
        else:
            print(f"✗ Validation test failed: Expected 400, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Validation test failed: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Flask API Test Suite")
    print("=" * 60)
    print()
    
    results = []
    results.append(("Flat format", test_flat_format()))
    results.append(("Nested format", test_nested_format()))
    results.append(("At-risk student", test_at_risk_student()))
    results.append(("High-performing student", test_high_performing_student()))
    results.append(("Validation", test_validation()))
    
    print()
    print("=" * 60)
    print("Test Results Summary")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "PASS" if passed else "FAIL"
        print(f"{test_name}: {status}")
    
    total = len(results)
    passed = sum(1 for _, p in results if p)
    print()
    print(f"Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("✓ All tests passed!")
    else:
        print("✗ Some tests failed")
