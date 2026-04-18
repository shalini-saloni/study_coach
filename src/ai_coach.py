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

def _audit_and_repair(raw_json: Dict, curated_res: List[Dict]) -> Dict:
    required = ["learning_diagnosis", "study_plan", "resources", "next_steps"]
    for k in required:
        if k not in raw_json: return None
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
    return {
        "learning_diagnosis": f"Your {strategy.lower()} plan for '{goal}' is ready. You are currently in the {risk_level} category.",
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
