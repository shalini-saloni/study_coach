"""
Diagnosis Service for LearnScope.ai
This module provides rule-based diagnosis of student performance factors.
"""

def get_student_diagnosis(student_data, risk_level, predicted_score=None):
    """
    Expert-level academic diagnosis for LearnScope.ai.
    Analyzes student data to provide a detailed, prioritized academic diagnosis.
    """
    # Priority: Failures (10) > Absences (8) > StudyTime (5) > Health/GoOut (3)
    weakness_map = [
        ("failures", student_data.get('failures', 0) >= 1, "past academic failures", 10),
        ("absences", student_data.get('absences', 0) > 10, "high absenteeism", 8),
        ("studytime", student_data.get('studytime', 2) <= 1, "low weekly study engagement", 5),
        ("health", student_data.get('health', 3) <= 2, "physical or mental health barriers", 3),
        ("goout", student_data.get('goout', 3) >= 4, "excessive social distractions", 3)
    ]
    
    found_weaknesses = sorted([w for w in weakness_map if w[1]], key=lambda x: x[3], reverse=True)
    top_weaknesses = [w[2] for w in found_weaknesses[:3]]
    
    strength_map = [
        (student_data.get('failures', 0) == 0, "excellent academic history"),
        (student_data.get('absences', 0) < 5, "consistent school attendance"),
        (student_data.get('studytime', 2) >= 3, "strong self-study discipline"),
        (student_data.get('higher') == "yes", "clear long-term academic ambition"),
        (student_data.get('famsup') == "yes", "reliable family support network")
    ]
    all_strengths = [s[1] for s in strength_map if s[0]]
    top_strengths = all_strengths[:3]

    reason = ""
    if risk_level == "At-risk":
        if top_weaknesses:
            primary = top_weaknesses[0]
            secondary = f" compounded by {top_weaknesses[1]}" if len(top_weaknesses) > 1 else ""
            reason = f"The student is currently at risk due to {primary}{secondary}, which significantly hinders learning stability."
        else:
            reason = "Overall performance metrics suggest a downward trend requiring immediate academic monitoring."

    elif risk_level == "Average":
        weakness = top_weaknesses[0] if top_weaknesses else "slight inconsistency in habits"
        strength = top_strengths[0] if top_strengths else "general subject competence"
        reason = f"Academic growth is being slowed by {weakness}, yet the student's {strength} provides a solid base for recovery."

    else:  # High-performing
        if top_strengths:
            lead = top_strengths[0]
            support = f" supported by {top_strengths[1]}" if len(top_strengths) > 1 else ""
            reason = f"Performance is exceptionally high, driven by {lead}{support} and sustained academic focus."
        else:
            reason = "The student maintains a highly stable and efficient learning routine with no major risks detected."

    profile = "Standard Profile"
    f_val = student_data.get('failures', 0)
    a_val = student_data.get('absences', 0)
    s_val = student_data.get('studytime', 2)
    g_val = student_data.get('goout', 3)

    if f_val >= 1 and a_val > 10:
        profile = "Academically At-Risk"
    elif s_val >= 3 and f_val == 0:
        profile = "Disciplined Achiever"
    elif s_val <= 1 and g_val >= 4:
        profile = "Distracted Learner"
    elif student_data.get('health', 3) <= 2:
        profile = "Vulnerable Student"
    elif student_data.get('higher') == "yes" and s_val >= 2:
        profile = "Goal-Oriented Student"

    return {
        "weaknesses": top_weaknesses,
        "strengths": top_strengths,
        "reason": reason,
        "profile": profile
    }
