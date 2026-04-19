import os
import json
import hashlib
from typing import Optional, List, Dict

def _load_registry() -> Dict:
    registry_path = os.path.join('data', 'resources.json')
    try:
        if os.path.exists(registry_path):
            with open(registry_path, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"AI_COACH: Error loading registry: {e}")
    return {"categories": {}}

REGISTRY = _load_registry()

def _get_curated_resources(subject: str, weaknesses: list) -> list:
    pool = []
    cats = REGISTRY.get("categories", {})
    found_any = False
    for w in weaknesses:
        w_l = w.lower()
        if "absent" in w_l: pool.extend(cats.get("absences", [])); found_any = True
        if "study" in w_l: pool.extend(cats.get("studytime", [])); found_any = True
        if "failure" in w_l: pool.extend(cats.get("failures", [])); found_any = True
    pool.extend(cats.get(subject.lower(), []))
    if not found_any: pool.extend(cats.get("advanced", []))
    unique = {}
    for item in pool:
        if item['url'] not in unique or item.get('priority', 0) > unique[item['url']].get('priority', 0):
            unique[item['url']] = item
    return sorted(unique.values(), key=lambda x: x.get('priority', 0), reverse=True)[:4]

def _infer_goal_horizon(goal: str) -> str:
    goal_text = (goal or "").lower()
    short_markers = ["exam", "test", "quiz", "deadline", "soon", "this week", "next week", "pass", "grade"]
    return "short-term" if any(marker in goal_text for marker in short_markers) else "long-term"

def _build_weekly_goals(student_data: dict, diagnosis: dict, risk_level: str, goal: str) -> list:
    weaknesses = diagnosis.get("weaknesses", [])[:3]
    strengths = diagnosis.get("strengths", [])[:2]
    horizon = _infer_goal_horizon(goal)

    if risk_level == "At-risk":
        template = [
            ("Week 1", "stabilize the learning routine", "Restore a dependable study rhythm and remove the biggest barrier."),
            ("Week 2", "address the top weakness", "Build understanding in the weakest area with short, focused practice."),
            ("Week 3", "practice with support", "Apply the repaired skill through guided review and correction."),
            ("Week 4", "check progress and adjust", "Measure improvement and decide what still needs reinforcement."),
        ]
    elif risk_level == "High-performing":
        template = [
            ("Week 1", "choose a stretch target", "Select one advanced topic or challenge aligned to the student goal."),
            ("Week 2", "increase depth", "Solve harder problems and explain reasoning without notes."),
            ("Week 3", "demonstrate mastery", "Teach, summarize, or apply the concept in a new context."),
            ("Week 4", "test high-level readiness", "Complete a timed challenge or enrichment checkpoint."),
        ]
    else:
        template = [
            ("Week 1", "identify priority topics", "Pinpoint the most important weak areas and set a simple revision rhythm."),
            ("Week 2", "build recall habit", "Use active recall and short quizzes to strengthen understanding."),
            ("Week 3", "add timed practice", "Work under time pressure to improve accuracy and pacing."),
            ("Week 4", "verify improvement", "Retest the same topics and compare results against Week 1."),
        ]

    weeks = template[:3] if horizon == "short-term" else template
    weekly_goals = []
    for idx, (label, focus, objective) in enumerate(weeks):
        linked_weaknesses = []
        if weaknesses:
            linked_weaknesses = [weaknesses[min(idx, len(weaknesses) - 1)]]
        elif risk_level == "High-performing":
            linked_weaknesses = ["stretch performance"]

        tasks = [
            f"Complete one focused study block on {focus}.",
            f"Track one clear success signal for {label.lower()}.",
        ]
        if linked_weaknesses:
            tasks.insert(0, f"Work directly on {', '.join(linked_weaknesses)}.")
        if strengths:
            tasks.append(f"Use {strengths[0]} to support the week.")

        weekly_goals.append({
            "week_label": label,
            "focus": focus,
            "goal": objective,
            "tasks": tasks[:4],
            "success_criteria": "The student completes the planned tasks and can show one clear improvement signal.",
            "linked_weaknesses": linked_weaknesses,
            "linked_strengths": strengths,
        })

    return weekly_goals

def _build_milestone_goals(student_data: dict, diagnosis: dict, risk_level: str, goal: str) -> list:
    weaknesses = diagnosis.get("weaknesses", [])
    strengths = diagnosis.get("strengths", [])[:2]
    horizon = _infer_goal_horizon(goal)
    primary_weakness = weaknesses[0] if weaknesses else "core study habits"

    milestone_frames = [
        ("Foundation checkpoint", "stabilize the main weakness", "By the middle of the plan" if horizon == "long-term" else "By the end of the first half of the plan"),
        ("Consistency checkpoint", "sustain a repeatable routine", "By the end of the plan"),
        ("Outcome checkpoint", "connect effort to the student goal", "Before the next major assessment or review cycle"),
    ]

    milestones = []
    for idx, (name, target, timeframe) in enumerate(milestone_frames):
        linked_weeks = [f"Week {idx + 1}"]
        if horizon == "long-term" and idx == 2:
            linked_weeks = ["Week 3", "Week 4"]
        milestones.append({
            "milestone_name": name,
            "target": target,
            "timeframe": timeframe,
            "linked_weeks": linked_weeks,
            "completion_check": f"The student can show progress on {primary_weakness} and explain what changed.",
            "linked_weaknesses": weaknesses[:2],
            "linked_strengths": strengths,
        })

    return milestones

def _quiz_topic_for(student_data: dict, diagnosis: dict) -> str:
    subject = (student_data.get("subject") or "general").lower()
    weakness_text = " ".join(diagnosis.get("weaknesses", [])).lower()
    if subject in ["math", "mathematics"]:
        return "math"
    if subject in ["portuguese", "language", "english"]:
        return "language"
    if "fail" in weakness_text or "study" in weakness_text or "attendance" in weakness_text:
        return "study habits"
    return subject

def _build_quiz_generation(student_data: dict, diagnosis: dict, risk_level: str) -> list:
    topic = _quiz_topic_for(student_data, diagnosis)
    question_count = 3 if risk_level == "At-risk" else 5 if risk_level == "High-performing" else 4

    quiz_templates = {
        "math": {
            "At-risk": [
                {
                    "question": "What is 6 + 4?",
                    "type": "multiple-choice",
                    "choices": ["8", "9", "10", "12"],
                    "answer": "10",
                    "explanation": "This checks basic arithmetic accuracy before moving to harder work."
                },
                {
                    "question": "Solve: 12 - 5 = ?",
                    "type": "short-answer",
                    "answer": "7",
                    "explanation": "Basic subtraction builds confidence for more complex operations."
                },
                {
                    "question": "Which is larger: 3/4 or 1/2?",
                    "type": "multiple-choice",
                    "choices": ["1/2", "3/4", "They are equal", "Cannot tell"],
                    "answer": "3/4",
                    "explanation": "Comparing simple fractions helps verify foundational number sense."
                },
            ],
            "Average": [
                {
                    "question": "Solve: 3x + 5 = 14. What is x?",
                    "type": "short-answer",
                    "answer": "3",
                    "explanation": "This checks linear equation solving with one step of reasoning."
                },
                {
                    "question": "What is the next number in the pattern 2, 4, 8, 16, ?",
                    "type": "short-answer",
                    "answer": "32",
                    "explanation": "Recognizing patterns supports faster problem solving."
                },
                {
                    "question": "A rectangle has length 6 and width 3. What is its area?",
                    "type": "multiple-choice",
                    "choices": ["9", "18", "24", "36"],
                    "answer": "18",
                    "explanation": "Area problems connect formulas to practical calculation."
                },
                {
                    "question": "If a class starts at 8:30 and lasts 45 minutes, when does it end?",
                    "type": "short-answer",
                    "answer": "9:15",
                    "explanation": "Time calculations strengthen applied arithmetic and attention to detail."
                },
            ],
            "High-performing": [
                {
                    "question": "Factor the expression x² - 9.",
                    "type": "short-answer",
                    "answer": "(x - 3)(x + 3)",
                    "explanation": "This checks algebraic structure and symbolic fluency."
                },
                {
                    "question": "If f(x) = 2x + 1, what is f(4)?",
                    "type": "short-answer",
                    "answer": "9",
                    "explanation": "Function evaluation is a core readiness skill for advanced study."
                },
                {
                    "question": "A student scores 12, 15, and 18 on three tests. What is the average score?",
                    "type": "short-answer",
                    "answer": "15",
                    "explanation": "Averages and data reasoning support higher-level quantitative work."
                },
                {
                    "question": "Explain why the sum of two odd numbers is always even.",
                    "type": "open-response",
                    "answer": "Odd numbers can be written as 2n + 1 and 2m + 1; their sum is 2(n + m + 1), which is even.",
                    "explanation": "This moves beyond computation into proof-style reasoning."
                },
                {
                    "question": "Find the slope of the line through (2, 3) and (6, 11).",
                    "type": "short-answer",
                    "answer": "2",
                    "explanation": "Slope questions test algebraic fluency and problem decomposition."
                },
            ],
        },
        "language": {
            "At-risk": [
                {
                    "question": "Choose the correct sentence: 'She ___ to school every day.'",
                    "type": "multiple-choice",
                    "choices": ["go", "goes", "going", "gone"],
                    "answer": "goes",
                    "explanation": "This checks basic grammar agreement with a simple sentence."
                },
                {
                    "question": "What is the main idea of a short paragraph?",
                    "type": "multiple-choice",
                    "choices": ["The longest sentence", "The most important point", "A random detail", "The title only"],
                    "answer": "The most important point",
                    "explanation": "Identifying the main idea builds reading comprehension."
                },
                {
                    "question": "Rewrite the word 'quickly' in a sentence using a different adverb meaning.",
                    "type": "open-response",
                    "answer": "Possible answers include 'fast' or 'rapidly', depending on the sentence.",
                    "explanation": "Vocabulary substitution helps students practice language precision."
                },
            ],
            "Average": [
                {
                    "question": "Which sentence is punctuated correctly?",
                    "type": "multiple-choice",
                    "choices": ["Lets eat grandma.", "Let's eat, grandma.", "Lets eat, grandma.", "Let's eat grandma"],
                    "answer": "Let's eat, grandma.",
                    "explanation": "Punctuation changes meaning and is important for clear writing."
                },
                {
                    "question": "Identify the verb in the sentence: 'The students finished their work quietly.'",
                    "type": "short-answer",
                    "answer": "finished",
                    "explanation": "Parts of speech help with sentence analysis and writing accuracy."
                },
                {
                    "question": "What is one inference you can make from a character who studies late every night?",
                    "type": "open-response",
                    "answer": "The character is likely hardworking or preparing carefully.",
                    "explanation": "Inference questions measure deeper reading comprehension."
                },
                {
                    "question": "Choose the best summary of a passage about school routines.",
                    "type": "multiple-choice",
                    "choices": ["A list of every detail", "The central idea in fewer words", "The longest sentence", "A random opinion"],
                    "answer": "The central idea in fewer words",
                    "explanation": "Summarizing tests comprehension and synthesis."
                },
            ],
            "High-performing": [
                {
                    "question": "Analyze how tone shifts in a persuasive paragraph when the writer moves from calm facts to urgent language.",
                    "type": "open-response",
                    "answer": "The tone becomes more forceful and persuasive, increasing emotional pressure on the reader.",
                    "explanation": "This pushes analytical reading beyond surface-level comprehension."
                },
                {
                    "question": "Which revision best improves the clarity of this sentence: 'The reason was because the team was late.'",
                    "type": "multiple-choice",
                    "choices": ["The reason was because the team was late.", "The team was late.", "Because the reason was late.", "The lateness was the reason because."],
                    "answer": "The team was late.",
                    "explanation": "Revision skills matter for high-level writing precision."
                },
                {
                    "question": "Compare two characters who respond differently to the same challenge.",
                    "type": "open-response",
                    "answer": "A strong response names a similarity and a difference using evidence from the text.",
                    "explanation": "Comparison questions require evidence-based analysis."
                },
                {
                    "question": "Identify the rhetorical strategy used when a writer repeats a phrase for emphasis.",
                    "type": "short-answer",
                    "answer": "Repetition or anaphora",
                    "explanation": "Rhetorical awareness supports advanced reading and writing performance."
                },
                {
                    "question": "Write a one-sentence thesis for an essay arguing that school routines improve achievement.",
                    "type": "open-response",
                    "answer": "A strong thesis clearly states a claim and gives a direction for the essay.",
                    "explanation": "Thesis writing tests structured argumentation and synthesis."
                },
            ],
        },
        "study habits": {
            "At-risk": [
                {
                    "question": "Which action best helps you start a study session?",
                    "type": "multiple-choice",
                    "choices": ["Open 10 tabs", "Set a 25-minute timer", "Check messages first", "Skip the first 10 minutes"],
                    "answer": "Set a 25-minute timer",
                    "explanation": "Basic routine design supports students who need stability."
                },
                {
                    "question": "What should you do first when you miss a class?",
                    "type": "short-answer",
                    "answer": "Get the notes and identify the missed topic.",
                    "explanation": "This keeps catch-up tasks specific and manageable."
                },
                {
                    "question": "Name one way to reduce distractions while studying.",
                    "type": "open-response",
                    "answer": "Examples include silencing the phone, moving to a quiet place, or removing notifications.",
                    "explanation": "Simple habits help rebuild consistency." 
                },
            ],
            "Average": [
                {
                    "question": "What is the purpose of active recall?",
                    "type": "short-answer",
                    "answer": "To test memory by retrieving information without looking.",
                    "explanation": "Active recall improves retention more than passive rereading."
                },
                {
                    "question": "Why is spaced repetition useful?",
                    "type": "open-response",
                    "answer": "It helps move knowledge into long-term memory through repeated review at intervals.",
                    "explanation": "This supports steady improvement over time."
                },
                {
                    "question": "Which study plan is most balanced: 2 hours once a week or 20 minutes daily?",
                    "type": "multiple-choice",
                    "choices": ["2 hours once a week", "20 minutes daily", "Neither", "Only before exams"],
                    "answer": "20 minutes daily",
                    "explanation": "Daily consistency is easier to sustain and more effective."
                },
                {
                    "question": "What should you review after a practice quiz?",
                    "type": "short-answer",
                    "answer": "The mistakes and the reason for each mistake.",
                    "explanation": "Error analysis turns practice into learning."
                },
            ],
            "High-performing": [
                {
                    "question": "Design a 3-step review loop for a hard topic.",
                    "type": "open-response",
                    "answer": "A strong answer includes learn, test, and refine or similar structured steps.",
                    "explanation": "Advanced students should build efficient self-monitoring systems."
                },
                {
                    "question": "Which strategy best prevents overconfidence before an exam?",
                    "type": "multiple-choice",
                    "choices": ["Skip practice tests", "Use timed mixed review", "Only read summaries", "Study only easy topics"],
                    "answer": "Use timed mixed review",
                    "explanation": "High-performing students still need challenge and calibration."
                },
                {
                    "question": "Why is teaching a concept to someone else a strong learning strategy?",
                    "type": "short-answer",
                    "answer": "It reveals gaps and strengthens understanding through explanation.",
                    "explanation": "Teaching forces deeper processing and mastery."
                },
                {
                    "question": "What is one indicator that your study routine is becoming too easy?",
                    "type": "open-response",
                    "answer": "Examples include no mistakes, no challenge, or no growth over time.",
                    "explanation": "Advanced study should continue to stretch the student."
                },
                {
                    "question": "Which metric is most useful for tracking improvement in a tough subject?",
                    "type": "multiple-choice",
                    "choices": ["Time spent only", "Number of correct answers and error types", "Color of notes", "How long the textbook is"],
                    "answer": "Number of correct answers and error types",
                    "explanation": "Better tracking creates better feedback loops for advanced learners."
                },
            ],
        },
    }

    topic_pool = quiz_templates.get(topic, quiz_templates["study habits"])
    selected_pool = topic_pool.get(risk_level, topic_pool["Average"])
    return selected_pool[:question_count]

def _audit_and_repair(raw_json: Dict, curated_res: List[Dict]) -> Dict:
    # Backward compatibility: accept legacy quiz_generation and normalize to quiz_questions.
    if "quiz_questions" not in raw_json and "quiz_generation" in raw_json:
        raw_json["quiz_questions"] = raw_json.get("quiz_generation", [])

    required = ["learning_diagnosis", "study_plan", "resources", "next_steps", "weekly_goals", "quiz_questions"]
    for k in required:
        if k not in raw_json:
            return None
    curated_urls = {r['url'] for r in curated_res}
    clean_res = [r for r in raw_json['resources'] if r.get('url') in curated_urls]
    if not clean_res:
        raw_json['resources'] = curated_res[:4]
    else:
        raw_json['resources'] = clean_res
    steps = raw_json['next_steps']
    if not isinstance(steps, list): steps = []
    default_steps = [
        "Review today's learning outcomes in your study journal.",
        "Set your goals for tomorrow to stay organized.",
        "Complete a 25-minute focused study block tonight.",
        "Organize your study space for maximum productivity.",
        "Tell someone what you learned today to boost retention."
    ]
    if len(steps) < 5: steps.extend(default_steps[:(5 - len(steps))])
    raw_json['next_steps'] = steps[:5]
    return raw_json

_client = None
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

def _get_client():
    global _client
    if _client is not None: return _client
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key or api_key == "your_groq_api_key_here": return None
    try:
        from groq import Groq
        _client = Groq(api_key=api_key)
        return _client
    except Exception: return None

SYSTEM_PROMPT = """You are LearnScope.ai expert academic coach. 
Output ONLY valid JSON. 100% compliance with 'APPROVED_CONTEXT_RESOURCES' is mandatory.
JSON STRUCTURE:
{
  "learning_diagnosis": "Summary citation specific data.",
    "weekly_goals": [{"week_label": "Week 1", "focus": "...", "goal": "...", "tasks": [], "success_criteria": "...", "linked_weaknesses": [], "linked_strengths": []}],
        "quiz_questions": [{"question": "...", "type": "multiple-choice|short-answer|open-response", "difficulty": "basic|intermediate|advanced", "topic": "...", "choices": [], "answer": "...", "explanation": "..."}],
  "study_plan": {
    "overview": "Strategy name.",
    "days": [{"day": "...", "focus": "...", "tasks": [], "duration": "..."}]
  },
  "resources": [{"name": "...", "url": "...", "why": "..."}],
  "next_steps": ["Verb-led action", "..."]
}
RULES: 5 next_steps. No fabricated URLs."""

def _generate_fallback(student_data: dict, diagnosis: dict, risk_level: str, predicted_grade: float, goal: str, curated: list) -> dict:
    is_short = any(k in goal.lower() for k in ["exam", "test", "days", "soon"])
    strategy = "SHORT_TERM" if is_short else "LONG_TERM"
    quiz_items = _build_quiz_generation(student_data, diagnosis, risk_level)
    quiz_questions = [
        dict(
            item,
            difficulty=("basic" if risk_level == "At-risk" else "advanced" if risk_level == "High-performing" else "intermediate"),
            topic=_quiz_topic_for(student_data, diagnosis)
        )
        for item in quiz_items
    ]
    return {
        "learning_diagnosis": f"Your {strategy.lower()} plan for '{goal}' is ready. You are currently in the {risk_level} category.",
        "weekly_goals": _build_weekly_goals(student_data, diagnosis, risk_level, goal),
        "milestone_goals": _build_milestone_goals(student_data, diagnosis, risk_level, goal),
        "quiz_questions": quiz_questions,
        "quiz_generation": quiz_questions,
        "study_plan": {"overview": f"{strategy} strategy guided by your academic risk level ({risk_level}).", "days": []},
        "resources": curated[:4],
        "next_steps": [
            "Review your weakest topics for 30 minutes tonight.",
            "Use the provided resources to close knowledge gaps.",
            "Solve 5 practice problems individually.",
            "Attend your next scheduled class with a list of 3 questions.",
            "Reflect on today's progress before sleeping."
        ],
        "ai_generated": False
    }

def generate_ai_coaching(student_data: dict, diagnosis: dict, risk_level: str, predicted_grade: float, goal: str = "Improve performance") -> dict:
    subject = student_data.get("subject", "math")
    curated = _get_curated_resources(subject, diagnosis.get("weaknesses", []))
    client = _get_client()
    if not client:
        return _generate_fallback(student_data, diagnosis, risk_level, predicted_grade, goal, curated)
    try:
        res_text = "\n".join([f"• {r['name']}: {r['url']}" for r in curated])
        user_prompt = f"Goal: {goal}\nWeakness: {', '.join(diagnosis.get('weaknesses', []))}\nRESOURCES:\n{res_text}"
        chat = client.chat.completions.create(
            messages=[{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": user_prompt}],
            model=GROQ_MODEL, temperature=0.4, response_format={"type": "json_object"}
        )
        raw_result = json.loads(chat.choices[0].message.content)
        if "weekly_goals" not in raw_result:
            raw_result["weekly_goals"] = _build_weekly_goals(student_data, diagnosis, risk_level, goal)
        if "milestone_goals" not in raw_result:
            raw_result["milestone_goals"] = _build_milestone_goals(student_data, diagnosis, risk_level, goal)
        if "quiz_questions" not in raw_result and "quiz_generation" in raw_result:
            raw_result["quiz_questions"] = raw_result.get("quiz_generation", [])
        if "quiz_questions" not in raw_result:
            raw_result["quiz_questions"] = [
                dict(
                    item,
                    difficulty=("basic" if risk_level == "At-risk" else "advanced" if risk_level == "High-performing" else "intermediate"),
                    topic=_quiz_topic_for(student_data, diagnosis)
                )
                for item in _build_quiz_generation(student_data, diagnosis, risk_level)
            ]
        final_result = _audit_and_repair(raw_result, curated)
        if not final_result:
            return _generate_fallback(student_data, diagnosis, risk_level, predicted_grade, goal, curated)
        final_result["ai_generated"] = True
        return final_result
    except Exception as e:
        print(f"AI_COACH: Logic Error: {e}")
        return _generate_fallback(student_data, diagnosis, risk_level, predicted_grade, goal, curated)

def is_ai_available() -> bool:
    key = os.environ.get("GROQ_API_KEY", "")
    return bool(key) and key != "your_groq_api_key_here"
