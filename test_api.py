"""Final API test suite for full-system verification.

Coverage:
- Input shape normalization (flat and nested)
- Student profile outcomes (at-risk, average, high-performing)
- Goal variants
- AI coaching contract sections (weekly goals and quiz)
"""
import requests

BASE_URL = "http://localhost:5001"


def _post(payload, timeout=15):
    return requests.post(f"{BASE_URL}/predict", json=payload, timeout=timeout)


def _validate_base_structure(result):
    assert "predicted_grade" in result, "Missing predicted_grade"
    assert "risk_level" in result, "Missing risk_level"
    assert "diagnosis" in result, "Missing diagnosis"
    assert "ai_coaching" in result, "Missing ai_coaching"
    assert "status" in result, "Missing status"
    assert "value" in result["predicted_grade"], "Missing predicted_grade.value"
    assert "category" in result["risk_level"], "Missing risk_level.category"
    assert "code" in result["status"], "Missing status.code"


def _validate_ai_coaching_sections(result):
    ai_coaching = result.get("ai_coaching") or {}
    assert isinstance(ai_coaching, dict), "ai_coaching should be an object"
    assert ai_coaching is not None, "ai_coaching should never be None"

    assert "weekly_goals" in ai_coaching, "Missing weekly_goals section"
    assert isinstance(ai_coaching["weekly_goals"], list), "weekly_goals should be a list"
    assert len(ai_coaching["weekly_goals"]) > 0, "weekly_goals should contain items"

    # Canonical key is quiz_questions. Keep compatibility if only legacy key exists.
    quiz_items = ai_coaching.get("quiz_questions") or ai_coaching.get("quiz_generation")
    assert quiz_items is not None, "Missing quiz_questions (or compatibility quiz_generation)"
    assert isinstance(quiz_items, list), "quiz_questions should be a list"
    assert len(quiz_items) > 0, "quiz_questions should contain items"

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
        response = _post(flat_data)
        
        if response.status_code == 200:
            result = response.json()
            
            _validate_base_structure(result)
            _validate_ai_coaching_sections(result)
            
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
        response = _post(nested_data)
        
        if response.status_code == 200:
            result = response.json()
            
            _validate_base_structure(result)
            _validate_ai_coaching_sections(result)
            
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
        response = _post(data)
        
        if response.status_code == 200:
            result = response.json()
            _validate_base_structure(result)
            _validate_ai_coaching_sections(result)
            risk_category = result["risk_level"]["category"]
            
            if risk_category in {"At-risk", "Average"}:
                print(f"✓ At-risk student test passed (risk: {risk_category})")
                return True
            else:
                print(f"✗ At-risk student test failed (expected one of ['At-risk', 'Average'], got '{risk_category}')")
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
        response = _post(data)
        
        if response.status_code == 200:
            result = response.json()
            _validate_base_structure(result)
            _validate_ai_coaching_sections(result)
            risk_category = result["risk_level"]["category"]
            
            if risk_category in {"High-performing", "Average"}:
                print(f"✓ High-performing student test passed (risk: {risk_category})")
                return True
            else:
                print(f"✗ High-performing student test failed (expected one of ['High-performing', 'Average'], got '{risk_category}')")
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
        response = _post(invalid_data)
        
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


def test_average_student():
    """Test average student scenario"""
    print("Testing average student...")

    data = {
        "student_data": {
            "studytime": 2,
            "failures": 0,
            "absences": 6,
            "health": 3,
            "goout": 3,
            "higher": "yes",
            "famsup": "yes",
            "internet": "yes",
            "subject": "math"
        },
        "goal": {
            "priority": "medium",
            "target_grade": "12",
            "deadline": "4 weeks"
        }
    }

    try:
        response = _post(data)
        if response.status_code == 200:
            result = response.json()
            _validate_base_structure(result)
            _validate_ai_coaching_sections(result)
            risk_category = result["risk_level"]["category"]
            if risk_category in {"Average", "At-risk", "High-performing"}:
                print(f"✓ Average student test passed (risk: {risk_category})")
                return True

            print(f"✗ Average student test failed (unexpected risk category: '{risk_category}')")
            return False

        print(f"✗ Average student test failed: Status {response.status_code}")
        return False
    except Exception as e:
        print(f"✗ Average student test failed: {e}")
        return False


def test_goal_variants():
    """Test different goal inputs and ensure AI sections are still present."""
    print("Testing different goals...")

    student_data = {
        "studytime": 2,
        "failures": 0,
        "absences": 5,
        "health": 3,
        "goout": 3,
        "higher": "yes",
        "famsup": "yes",
        "internet": "yes",
        "subject": "math"
    }

    goals = [
        {"priority": "high", "target_grade": "16", "deadline": "2 weeks"},
        {"priority": "medium", "target_grade": "14", "deadline": "1 month"},
        {"priority": "low", "target_grade": "pass all", "deadline": "end of term"},
    ]

    try:
        for idx, goal in enumerate(goals, start=1):
            response = _post({"student_data": student_data, "goal": goal})
            if response.status_code != 200:
                print(f"✗ Goal variant {idx} failed: Status {response.status_code}")
                return False

            result = response.json()
            _validate_base_structure(result)
            _validate_ai_coaching_sections(result)

        print("✓ Goal variants test passed")
        return True
    except Exception as e:
        print(f"✗ Goal variants test failed: {e}")
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
    results.append(("Average student", test_average_student()))
    results.append(("High-performing student", test_high_performing_student()))
    results.append(("Goal variants", test_goal_variants()))
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
