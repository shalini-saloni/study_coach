"""
AI Study Coach — LLM Integration Module for LearnScope.ai
===========================================================
Member 2 Deliverable: The "brain" of the AI Study Coach.

This module takes the structured diagnosis from Member 1's ML pipeline
and transforms it into rich, personalized AI coaching output via Groq LLM.

Output Sections:
  1. diagnosis_explanation — Why the student is at this level
  2. study_plan           — Weekly day-by-day study schedule
  3. resources            — Curated learning resources
  4. next_steps           — Immediate actionable items
"""

import os
import json
import hashlib
from typing import Optional

# ── LLM Client Setup ──────────────────────────────────────────────────────────

_client = None
_cache = {}  # Simple in-memory cache: hash(input) → response

GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")


def _get_client():
    """Lazy-initialize the Groq client. Returns None if no API key is set."""
    global _client
    if _client is not None:
        return _client

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key or api_key == "your_groq_api_key_here":
        print("AI_COACH: No GROQ_API_KEY set — will use fallback recommendations.")
        return None

    try:
        from groq import Groq
        _client = Groq(api_key=api_key)
        print(f"AI_COACH: Groq client initialized (model: {GROQ_MODEL})")
        return _client
    except Exception as e:
        print(f"AI_COACH: Failed to initialize Groq client: {e}")
        return None


# ── Prompt Engineering ─────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are LearnScope.ai — an expert educational psychologist and academic coach specializing in secondary school students.

Your role: Analyze a student's academic profile (ML-predicted risk level, diagnosed weaknesses, strengths, and learner profile) and deliver a deeply personalized, empathetic, and actionable coaching response.

IMPORTANT RULES:
1. Be warm, encouraging, and specific — never generic or preachy.
2. Reference the student's EXACT data points (study hours, absences, failures) in your advice.
3. Adapt your tone to the risk level: urgent but hopeful for At-risk, motivating for Average, celebratory but growth-focused for High-performing.
4. Every resource you suggest must be REAL and currently available.
5. The study plan must be realistic for a secondary school student (not university-level).

You MUST respond with ONLY valid JSON in this exact structure (no markdown, no extra text):
{
  "diagnosis_explanation": "A 3-5 sentence paragraph explaining WHY the student is at their current level. Reference specific data points. Be empathetic and insightful.",
  "study_plan": {
    "overview": "One sentence describing the weekly strategy.",
    "days": [
      {"day": "Monday", "focus": "Subject/topic focus", "tasks": ["Specific task 1", "Specific task 2"], "duration": "1.5 hours"},
      {"day": "Tuesday", "focus": "...", "tasks": ["..."], "duration": "..."},
      {"day": "Wednesday", "focus": "...", "tasks": ["..."], "duration": "..."},
      {"day": "Thursday", "focus": "...", "tasks": ["..."], "duration": "..."},
      {"day": "Friday", "focus": "...", "tasks": ["..."], "duration": "..."},
      {"day": "Saturday", "focus": "...", "tasks": ["..."], "duration": "..."},
      {"day": "Sunday", "focus": "Rest & light review", "tasks": ["..."], "duration": "..."}
    ]
  },
  "resources": [
    {"name": "Resource Name", "type": "website|app|youtube|technique", "url": "https://...", "why": "Why this helps this specific student"},
    {"name": "...", "type": "...", "url": "...", "why": "..."}
  ],
  "next_steps": [
    "Immediate action 1 — be very specific",
    "Immediate action 2",
    "Immediate action 3",
    "Immediate action 4",
    "Immediate action 5"
  ]
}"""


def _build_user_prompt(student_data: dict, diagnosis: dict, risk_level: str, predicted_grade: float) -> str:
    """Build a rich context prompt from Member 1's outputs + student data."""

    # Decode study time for human readability
    study_labels = {1: "less than 2 hours/week", 2: "2-5 hours/week", 3: "5-10 hours/week", 4: "more than 10 hours/week"}
    study_desc = study_labels.get(student_data.get("studytime", 2), "unknown")

    subject = "Mathematics" if student_data.get("subject", "math") == "math" else "Portuguese"

    prompt = f"""STUDENT ACADEMIC PROFILE:
━━━━━━━━━━━━━━━━━━━━━━━━━
• Subject: {subject}
• Age: {student_data.get('age', 'unknown')}
• Gender: {"Female" if student_data.get('sex') == 'F' else "Male"}
• School: {"Gabriel Pereira" if student_data.get('school') == 'GP' else "Mousinho da Silveira"}

ML PREDICTION RESULTS:
━━━━━━━━━━━━━━━━━━━━━
• Predicted Final Grade: {predicted_grade}/20
• Risk Classification: {risk_level}

DIAGNOSIS FROM ML PIPELINE:
━━━━━━━━━━━━━━━━━━━━━━━━━━
• Learner Profile: {diagnosis.get('profile', 'Standard')}
• Identified Weaknesses: {', '.join(diagnosis.get('weaknesses', [])) if diagnosis.get('weaknesses') else 'None identified'}
• Identified Strengths: {', '.join(diagnosis.get('strengths', [])) if diagnosis.get('strengths') else 'None identified'}
• Diagnosis Reason: {diagnosis.get('reason', 'No specific reason provided')}

KEY ACADEMIC FACTORS:
━━━━━━━━━━━━━━━━━━━━
• Weekly Study Time: {study_desc} (rating: {student_data.get('studytime', 2)}/4)
• Past Failures: {student_data.get('failures', 0)}
• School Absences: {student_data.get('absences', 0)} days
• Health Status: {student_data.get('health', 3)}/5
• Going Out Frequency: {student_data.get('goout', 3)}/5
• Workday Alcohol: {student_data.get('Dalc', 1)}/5
• Weekend Alcohol: {student_data.get('Walc', 1)}/5
• Family Relationship: {student_data.get('famrel', 4)}/5

SUPPORT SYSTEM:
━━━━━━━━━━━━━━
• Family Support: {"Yes" if student_data.get('famsup') == 'yes' else "No"}
• School Support: {"Yes" if student_data.get('schoolsup') == 'yes' else "No"}
• Paid Tutoring: {"Yes" if student_data.get('paid') == 'yes' else "No"}
• Internet at Home: {"Yes" if student_data.get('internet') == 'yes' else "No"}
• Wants Higher Education: {"Yes" if student_data.get('higher') == 'yes' else "No"}
• In Romantic Relationship: {"Yes" if student_data.get('romantic') == 'yes' else "No"}
• Extracurricular Activities: {"Yes" if student_data.get('activities') == 'yes' else "No"}

PARENT EDUCATION:
━━━━━━━━━━━━━━━━
• Mother's Education: {student_data.get('Medu', 2)}/4
• Father's Education: {student_data.get('Fedu', 2)}/4

Generate a deeply personalized AI coaching response for this student. Make every recommendation feel like it was written specifically for THEM based on their exact profile."""

    return prompt


# ── Cache Helpers ──────────────────────────────────────────────────────────────

def _cache_key(student_data: dict, diagnosis: dict, risk_level: str) -> str:
    """Generate a deterministic cache key from the input data."""
    key_data = json.dumps({
        "student": {k: student_data.get(k) for k in sorted(student_data.keys()) if k in [
            'studytime', 'failures', 'absences', 'health', 'goout', 'higher',
            'famsup', 'internet', 'subject', 'sex', 'age'
        ]},
        "risk": risk_level,
        "profile": diagnosis.get("profile", "")
    }, sort_keys=True)
    return hashlib.md5(key_data.encode()).hexdigest()


# ── Fallback (Rule-Based) ─────────────────────────────────────────────────────

def _generate_fallback(student_data: dict, diagnosis: dict, risk_level: str, predicted_grade: float) -> dict:
    """Generate structured coaching output WITHOUT an LLM — enhanced rule-based fallback."""

    subject = "Mathematics" if student_data.get("subject", "math") == "math" else "Portuguese"
    weaknesses = diagnosis.get("weaknesses", [])
    strengths = diagnosis.get("strengths", [])
    profile = diagnosis.get("profile", "Standard Profile")

    # Diagnosis explanation
    if risk_level == "At-risk":
        diag = f"Based on our analysis, you are currently in the At-risk category with a predicted grade of {predicted_grade}/20. "
        if weaknesses:
            diag += f"The primary concerns are: {', '.join(weaknesses)}. "
        diag += "This means immediate action is needed, but with the right strategy, significant improvement is absolutely possible."
    elif risk_level == "Average":
        diag = f"You're performing at an Average level with a predicted grade of {predicted_grade}/20. "
        if strengths:
            diag += f"Your strengths include {strengths[0]}, which is a great foundation. "
        if weaknesses:
            diag += f"However, {weaknesses[0]} is holding you back from reaching your full potential. "
        diag += "With targeted effort, you can move into the High-performing category."
    else:
        diag = f"Excellent work! You're classified as High-performing with a predicted grade of {predicted_grade}/20. "
        if strengths:
            diag += f"Your {strengths[0]} is clearly paying off. "
        diag += "Let's focus on maintaining this level and exploring advanced challenges."

    # Study plan
    study_time = student_data.get("studytime", 2)
    if risk_level == "At-risk":
        daily_dur = "2 hours"
        focus_strategy = "foundation rebuilding"
    elif risk_level == "Average":
        daily_dur = "1.5 hours"
        focus_strategy = "targeted improvement"
    else:
        daily_dur = "1-1.5 hours"
        focus_strategy = "advanced exploration"

    days = [
        {"day": "Monday", "focus": f"{subject} — Core concepts review", "tasks": [f"Review {subject.lower()} fundamentals for 45 min", "Solve 10 practice problems", "Note down doubts for teacher"], "duration": daily_dur},
        {"day": "Tuesday", "focus": "Weak area deep-dive", "tasks": [f"Focus on weakest {subject.lower()} topic", "Watch an explanatory video", "Practice 5 related problems"], "duration": daily_dur},
        {"day": "Wednesday", "focus": f"{subject} — Problem solving", "tasks": ["Attempt a past exam paper (timed)", "Review incorrect answers", "Redo mistakes without looking at solutions"], "duration": daily_dur},
        {"day": "Thursday", "focus": "Mixed practice & revision", "tasks": ["Revise notes from Monday-Wednesday", "Create summary flashcards", "Quiz yourself on key formulas/concepts"], "duration": daily_dur},
        {"day": "Friday", "focus": f"{subject} — Application & analysis", "tasks": ["Solve word problems / applied questions", "Explain a concept to someone (or write it)", "Plan weekend review topics"], "duration": daily_dur},
        {"day": "Saturday", "focus": "Full practice session", "tasks": ["Complete a full mock test under timed conditions", "Grade yourself honestly", "List topics needing more work"], "duration": daily_dur},
        {"day": "Sunday", "focus": "Rest & light review", "tasks": ["Light revision of flashcards only (30 min)", "Plan next week's focus areas", "Get proper rest for Monday"], "duration": "30 minutes"},
    ]

    # Resources
    resources = []
    if student_data.get("internet") == "yes":
        if subject == "Mathematics":
            resources = [
                {"name": "Khan Academy — Math", "type": "website", "url": "https://www.khanacademy.org/math", "why": "Free structured math courses from basics to advanced"},
                {"name": "3Blue1Brown", "type": "youtube", "url": "https://www.youtube.com/c/3blue1brown", "why": "Visual explanations that make abstract math concepts intuitive"},
                {"name": "Photomath", "type": "app", "url": "https://photomath.com", "why": "Scan problems and see step-by-step solutions to learn the method"},
                {"name": "Desmos Graphing Calculator", "type": "website", "url": "https://www.desmos.com/calculator", "why": "Visualize equations and graphs interactively"},
            ]
        else:
            resources = [
                {"name": "Khan Academy — Reading & Writing", "type": "website", "url": "https://www.khanacademy.org/humanities", "why": "Structured reading comprehension and writing practice"},
                {"name": "Quizlet", "type": "app", "url": "https://quizlet.com", "why": "Create vocabulary flashcards and practice with spaced repetition"},
                {"name": "Grammarly", "type": "app", "url": "https://www.grammarly.com", "why": "Improve your writing quality with real-time feedback"},
                {"name": "CrashCourse Literature", "type": "youtube", "url": "https://www.youtube.com/playlist?list=PL8dPuuaLjXtOeEc9ME62zTfqc0h6Pe8vb", "why": "Engaging analysis of literary works and themes"},
            ]
    else:
        resources = [
            {"name": "School Library Resources", "type": "technique", "url": "#", "why": "Ask your librarian for subject-specific workbooks and past papers"},
            {"name": "Study Group Formation", "type": "technique", "url": "#", "why": "Form a group of 3-4 students to share notes and quiz each other"},
            {"name": "Teacher Office Hours", "type": "technique", "url": "#", "why": "Visit after class for personalized help on challenging topics"},
        ]

    # Add study technique resources
    resources.append({"name": "Pomodoro Technique", "type": "technique", "url": "https://pomofocus.io", "why": "25-min focused sessions with breaks — proven to improve concentration"})

    # Next steps
    next_steps = []
    if student_data.get("failures", 0) > 0:
        next_steps.append(f"This week: Visit your {subject.lower()} teacher's office hours to review the topics from your past {student_data['failures']} failure(s).")
    if student_data.get("absences", 0) > 10:
        next_steps.append(f"Starting tomorrow: Commit to attending every class this week — you've missed {student_data['absences']} days, and each one creates gaps.")
    if student_data.get("studytime", 2) <= 1:
        next_steps.append("Tonight: Set a recurring phone alarm for a 1-hour 'no distractions' study block every evening at 7 PM.")
    if student_data.get("higher") == "yes":
        next_steps.append("This weekend: Research the grade requirements for your desired university/program to set a clear target score.")
    next_steps.append(f"Now: Download or bookmark your top resource and complete the first lesson today.")
    if len(next_steps) < 4:
        next_steps.append("This week: Create a dedicated study space with minimal distractions — even a corner of a room works.")
    if len(next_steps) < 5:
        next_steps.append("Daily: Write down 3 things you learned today before bed — this simple habit boosts retention by 40%.")

    return {
        "diagnosis_explanation": diag,
        "study_plan": {
            "overview": f"A balanced {focus_strategy} plan designed for your current level, building up step by step across the week.",
            "days": days
        },
        "resources": resources,
        "next_steps": next_steps[:5],
        "ai_generated": False
    }


# ── Main Entry Point ──────────────────────────────────────────────────────────

def generate_ai_coaching(
    student_data: dict,
    diagnosis: dict,
    risk_level: str,
    predicted_grade: float
) -> dict:
    """
    Generate comprehensive AI coaching output.

    Takes Member 1's structured diagnosis and enriches it via LLM.
    Falls back gracefully to rule-based output if LLM is unavailable.

    Returns:
        dict with keys: diagnosis_explanation, study_plan, resources, next_steps, ai_generated
    """

    # Check cache first
    cache_k = _cache_key(student_data, diagnosis, risk_level)
    if cache_k in _cache:
        print("AI_COACH: Returning cached response")
        return _cache[cache_k]

    # Try LLM
    client = _get_client()
    if client is None:
        result = _generate_fallback(student_data, diagnosis, risk_level, predicted_grade)
        _cache[cache_k] = result
        return result

    try:
        user_prompt = _build_user_prompt(student_data, diagnosis, risk_level, predicted_grade)

        print("AI_COACH: Calling Groq LLM...")
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            model=GROQ_MODEL,
            temperature=0.7,
            max_tokens=2000,
            top_p=0.9,
        )

        response_text = chat_completion.choices[0].message.content.strip()
        print(f"AI_COACH: LLM response received ({len(response_text)} chars)")

        # Parse JSON — handle potential markdown wrapping
        if response_text.startswith("```"):
            # Strip markdown code fences
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

        result = json.loads(response_text)
        result["ai_generated"] = True

        # Validate required keys
        required_keys = ["diagnosis_explanation", "study_plan", "resources", "next_steps"]
        for key in required_keys:
            if key not in result:
                print(f"AI_COACH: Missing key '{key}' in LLM response — falling back")
                result = _generate_fallback(student_data, diagnosis, risk_level, predicted_grade)
                break

        _cache[cache_k] = result
        return result

    except json.JSONDecodeError as e:
        print(f"AI_COACH: JSON parse error — {e}")
        print(f"AI_COACH: Raw response was: {response_text[:200]}...")
        result = _generate_fallback(student_data, diagnosis, risk_level, predicted_grade)
        _cache[cache_k] = result
        return result

    except Exception as e:
        print(f"AI_COACH: LLM call failed — {e}")
        result = _generate_fallback(student_data, diagnosis, risk_level, predicted_grade)
        _cache[cache_k] = result
        return result


def is_ai_available() -> bool:
    """Check whether the AI coach LLM is configured and available."""
    api_key = os.environ.get("GROQ_API_KEY", "")
    return bool(api_key) and api_key != "your_groq_api_key_here"
