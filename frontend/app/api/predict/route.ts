import { NextResponse } from 'next/server';

// ── Types for AI Coaching response ───────────────────────────────────────────
interface StudyDay {
  day: string;
  focus: string;
  tasks: string[];
  duration: string;
}

interface Resource {
  name: string;
  type: string;
  url: string;
  why: string;
}

interface AICoaching {
  diagnosis_explanation: string;
  weekly_goals: Array<{
    week_label: string;
    focus: string;
    goal: string;
    tasks: string[];
    success_criteria: string;
    linked_weaknesses: string[];
    linked_strengths: string[];
  }>;
  milestone_goals: Array<{
    milestone_name: string;
    target: string;
    timeframe: string;
    linked_weeks: string[];
    completion_check: string;
    linked_weaknesses: string[];
    linked_strengths: string[];
  }>;
  quiz_questions: Array<{
    question: string;
    type: "multiple-choice" | "short-answer" | "open-response";
    difficulty: "basic" | "intermediate" | "advanced";
    topic: string;
    choices: string[];
    answer: string;
    explanation: string;
  }>;
  quiz_generation: Array<{
    question: string;
    type: "multiple-choice" | "short-answer" | "open-response";
    difficulty: "basic" | "intermediate" | "advanced";
    topic: string;
    choices: string[];
    answer: string;
    explanation: string;
  }>;
  study_plan: {
    overview: string;
    days: StudyDay[];
  };
  resources: Resource[];
  next_steps: string[];
  ai_generated: boolean;
}

interface Diagnosis {
  weaknesses: string[];
  strengths: string[];
  reason: string;
  profile: string;
  patterns?: string[];
  recommendations?: string[];
}

interface PredictResponse {
  predictedGrade: number;
  riskLevel: string;
  confidence: number;
  diagnosis: {
    weaknesses: string[];
    strengths: string[];
    reason: string;
    profile: string;
  };
  recommendations: string[];
  aiCoaching: AICoaching | null;
  fromModel: boolean;
}

function getSubject(studentData: Record<string, any>): string {
  return String(studentData.subject || "general").toLowerCase();
}

function buildFallbackDiagnosis(studentData: Record<string, any>, riskLevel: string): Diagnosis {
  const studytime = Number(studentData.studytime ?? 2);
  const absences = Number(studentData.absences ?? 0);
  const failures = Number(studentData.failures ?? 0);

  if (riskLevel === "At-risk") {
    return {
      weaknesses: [
        studytime <= 1 ? "inconsistent study routine" : "uneven study habit",
        absences > 10 ? "frequent absences" : "attendance gaps",
        failures > 0 ? "past performance gaps" : "low confidence in core topics",
      ],
      strengths: ["can improve quickly with structure"],
      reason: "The profile indicates immediate attention is needed on study structure, attendance, and core topic review.",
      profile: "At-risk Profile",
      patterns: ["needs routine", "benefits from short practice blocks"],
      recommendations: ["Use short daily study blocks", "Review missed content immediately", "Track progress every week"],
    };
  }

  if (riskLevel === "High-performing") {
    return {
      weaknesses: ["needs harder challenges", "should keep momentum consistent"],
      strengths: ["strong study habits", "good academic readiness"],
      reason: "The profile shows strong readiness, so the plan should push for stretch goals and advanced work.",
      profile: "High-performing Profile",
      patterns: ["responds well to challenge", "ready for enrichment"],
      recommendations: ["Use advanced problems", "Teach peers", "Track stretch goals"],
    };
  }

  return {
    weaknesses: [studytime < 2 ? "study time could be more consistent" : "one or two weak topics need reinforcement", absences > 5 ? "attendance should improve" : "pacing needs refinement"],
    strengths: ["has a workable base", "can improve with targeted practice"],
    reason: "The profile is balanced, so the plan should focus on targeted practice and steady improvement.",
    profile: "Average Profile",
    patterns: ["benefits from repetition", "responds to clear goals"],
    recommendations: ["Practice weak topics weekly", "Use timed mock tests", "Review mistakes after each quiz"],
  };
}

function buildFallbackQuiz(studentData: Record<string, any>, riskLevel: string) {
  const subject = getSubject(studentData);
  const difficulty = riskLevel === "At-risk" ? "basic" : riskLevel === "High-performing" ? "advanced" : "intermediate";
  if (subject === "math") {
    return [
      {
        question: "What is 7 + 5?",
        type: "multiple-choice",
        difficulty,
        topic: "math",
        choices: ["10", "11", "12", "13"],
        answer: "12",
        explanation: "This checks basic arithmetic fluency.",
      },
      {
        question: "Solve 4x = 20.",
        type: "short-answer",
        difficulty,
        topic: "math",
        choices: [],
        answer: "5",
        explanation: "This checks simple algebraic reasoning.",
      },
      {
        question: "What is the area of a rectangle with length 4 and width 3?",
        type: "multiple-choice",
        difficulty,
        topic: "math",
        choices: ["7", "12", "14", "16"],
        answer: "12",
        explanation: "This checks formula use and calculation accuracy.",
      },
    ];
  }

  return [
    {
      question: "What is the main idea of a short passage?",
      type: "multiple-choice",
      difficulty,
      topic: subject || "study habits",
      choices: ["The longest sentence", "The most important point", "A random detail", "The title only"],
      answer: "The most important point",
      explanation: "This checks reading comprehension at a basic level.",
    },
    {
      question: "Name one way to improve your study routine.",
      type: "short-answer",
      difficulty,
      topic: "study habits",
      choices: [],
      answer: "Use a daily revision schedule or active recall.",
      explanation: "This checks whether the student can apply study strategies.",
    },
    {
      question: "Why is reviewing mistakes after practice important?",
      type: "open-response",
      difficulty,
      topic: "study habits",
      choices: [],
      answer: "It helps identify gaps and prevents repeating the same errors.",
      explanation: "This checks learning reflection and self-correction.",
    },
  ];
}

function normalizeActionSteps(nextSteps: string[] | undefined, fallbackSteps: string[]): string[] {
  const verbs = ["Review", "Plan", "Practice", "Check", "Ask"];
  const items = Array.isArray(nextSteps) ? nextSteps.filter(Boolean).slice(0, 5) : [];
  while (items.length < 5) {
    items.push(fallbackSteps[items.length]);
  }
  return items.slice(0, 5).map((item, index) => {
    const text = String(item || fallbackSteps[index]).trim();
    return text.toLowerCase().startsWith(verbs[index].toLowerCase()) ? text : `${verbs[index]} ${text}`.trim();
  });
}

function buildFallbackAICoaching(studentData: Record<string, any>, riskLevel: string, diagnosis: Diagnosis) {
  const subject = getSubject(studentData);
  const studytime = Number(studentData.studytime ?? 2);
  const baseResource = subject === "math"
    ? { name: "Khan Academy Math", type: "website", url: "https://www.khanacademy.org/math", why: "Free explanations and practice for core math topics." }
    : { name: "BBC Bitesize", type: "website", url: "https://www.bbc.co.uk/bitesize", why: "Clear revision guides and quizzes for core subjects." };

  const weeklyGoals = [
    {
      week_label: "Week 1",
      focus: riskLevel === "At-risk" ? "stabilize the routine" : "identify priority topics",
      goal: riskLevel === "High-performing" ? "Set a stretch challenge and track advanced progress." : "Build a consistent revision habit and focus on the weakest topic.",
      tasks: [
        "Review the main weakness for 20 minutes.",
        "Complete one focused practice block each day.",
        "Write one question to ask a teacher or peer.",
      ],
      success_criteria: "The student completes the planned tasks and can explain what changed.",
      linked_weaknesses: diagnosis.weaknesses.slice(0, 2),
      linked_strengths: diagnosis.strengths.slice(0, 2),
    },
    {
      week_label: "Week 2",
      focus: riskLevel === "High-performing" ? "increase difficulty" : "build recall habit",
      goal: "Use active recall and short quizzes to reinforce learning.",
      tasks: ["Test memory without notes.", "Review mistakes immediately.", "Repeat one weak topic."],
      success_criteria: "The student shows better recall and fewer repeat mistakes.",
      linked_weaknesses: diagnosis.weaknesses.slice(0, 2),
      linked_strengths: diagnosis.strengths.slice(0, 2),
    },
    {
      week_label: "Week 3",
      focus: riskLevel === "High-performing" ? "apply mastery" : "add timed practice",
      goal: "Use timed work to improve speed and accuracy.",
      tasks: ["Complete one timed set.", "Mark errors and revise them.", "Record one measurable win."],
      success_criteria: "The student can compare results against Week 1.",
      linked_weaknesses: diagnosis.weaknesses.slice(0, 2),
      linked_strengths: diagnosis.strengths.slice(0, 2),
    },
  ];

  const milestoneGoals = [
    {
      milestone_name: "Foundation checkpoint",
      target: "Complete core fundamentals",
      timeframe: "Mid-plan",
      linked_weeks: ["Week 1", "Week 2"],
      completion_check: "The student can demonstrate progress on the main weakness.",
      linked_weaknesses: diagnosis.weaknesses.slice(0, 2),
      linked_strengths: diagnosis.strengths.slice(0, 2),
    },
    {
      milestone_name: "Consistency checkpoint",
      target: "Sustain the study routine",
      timeframe: "End of plan",
      linked_weeks: ["Week 2", "Week 3"],
      completion_check: "The student maintains a repeatable routine for a full week.",
      linked_weaknesses: diagnosis.weaknesses.slice(0, 2),
      linked_strengths: diagnosis.strengths.slice(0, 2),
    },
    {
      milestone_name: "Outcome checkpoint",
      target: subject === "math" ? "Score 80% in mock tests" : "Improve quiz and essay results",
      timeframe: "Before the next assessment",
      linked_weeks: ["Week 3"],
      completion_check: "The student reaches the target on a mock test or quiz.",
      linked_weaknesses: diagnosis.weaknesses.slice(0, 2),
      linked_strengths: diagnosis.strengths.slice(0, 2),
    },
  ];

  const nextSteps = [
    "Review today's learning outcomes and highlight one gap.",
    "Plan a 25-minute study block for tonight.",
    "Practice one weak topic using active recall.",
    "Check your progress against the weekly goal.",
    "Ask for help on one unclear concept.",
  ];

  const quizQuestions = buildFallbackQuiz(studentData, riskLevel);

  return {
    learning_diagnosis: diagnosis.reason,
    weekly_goals: weeklyGoals,
    milestone_goals: milestoneGoals,
    quiz_questions: quizQuestions,
    quiz_generation: quizQuestions,
    study_plan: {
      overview: riskLevel === "High-performing"
        ? "Advanced study plan focused on stretch tasks and mastery review."
        : studytime >= 3
          ? "Balanced study plan with daily practice and weekly review."
          : "Focused study plan built around short, consistent revision sessions.",
      days: [
        { day: "Monday", focus: "Review the main weakness", tasks: ["Read notes", "Complete 5 practice items"], duration: "25–30 min" },
        { day: "Wednesday", focus: "Test recall", tasks: ["Do a mini quiz", "Check corrections"], duration: "20–25 min" },
        { day: "Friday", focus: "Apply learning", tasks: ["Solve mixed questions", "Summarize mistakes"], duration: "30 min" },
      ],
    },
    resources: [baseResource],
    next_steps: nextSteps,
    ai_generated: false,
  };
}

function normalizeAICoaching(aiCoaching: any, studentData: Record<string, any>, riskLevel: string, diagnosis: Diagnosis) {
  const fallback = buildFallbackAICoaching(studentData, riskLevel, diagnosis);
  const coaching = aiCoaching && typeof aiCoaching === "object" ? aiCoaching : {};
  const quizQuestions = coaching.quiz_questions ?? coaching.quiz_generation ?? fallback.quiz_questions;
  const nextSteps = normalizeActionSteps(coaching.next_steps, fallback.next_steps);

  return {
    diagnosis_explanation: coaching.diagnosis_explanation || coaching.learning_diagnosis || fallback.learning_diagnosis,
    learning_diagnosis: coaching.learning_diagnosis || coaching.diagnosis_explanation || fallback.learning_diagnosis,
    weekly_goals: Array.isArray(coaching.weekly_goals) && coaching.weekly_goals.length > 0 ? coaching.weekly_goals : fallback.weekly_goals,
    milestone_goals: Array.isArray(coaching.milestone_goals) && coaching.milestone_goals.length > 0 ? coaching.milestone_goals : fallback.milestone_goals,
    quiz_questions: quizQuestions,
    quiz_generation: quizQuestions,
    study_plan: coaching.study_plan?.days?.length ? coaching.study_plan : fallback.study_plan,
    resources: Array.isArray(coaching.resources) && coaching.resources.length > 0 ? coaching.resources : fallback.resources,
    next_steps: nextSteps,
    ai_generated: Boolean(coaching.ai_generated),
  };
}

function normalizeDiagnosis(predictionDiagnosis: any, studentData: Record<string, any>, riskLevel: string): Diagnosis {
  const fallback = buildFallbackDiagnosis(studentData, riskLevel);
  if (!predictionDiagnosis) return fallback;
  return {
    weaknesses: Array.isArray(predictionDiagnosis.weaknesses) && predictionDiagnosis.weaknesses.length > 0 ? predictionDiagnosis.weaknesses : fallback.weaknesses,
    strengths: Array.isArray(predictionDiagnosis.strengths) && predictionDiagnosis.strengths.length > 0 ? predictionDiagnosis.strengths : fallback.strengths,
    reason: predictionDiagnosis.reason || fallback.reason,
    profile: predictionDiagnosis.profile || fallback.profile,
    patterns: Array.isArray(predictionDiagnosis.patterns) ? predictionDiagnosis.patterns : fallback.patterns,
    recommendations: Array.isArray(predictionDiagnosis.recommendations) ? predictionDiagnosis.recommendations : fallback.recommendations,
  };
}

export async function POST(request: Request) {
  try {
    const studentData = await request.json();

    const normalizedPriority = ["low", "medium", "high"].includes(String(studentData.priority))
      ? String(studentData.priority)
      : "medium";
    const normalizedTargetGrade = typeof studentData.target_grade === "number"
      ? studentData.target_grade
      : Number.parseInt(String(studentData.target_grade ?? "14"), 10) || 14;
    const normalizedDeadline = typeof studentData.deadline === "string"
      ? studentData.deadline
      : "";

    const goalSummary = [
      `Target grade: ${normalizedTargetGrade}/20`,
      `Priority: ${normalizedPriority}`,
      normalizedDeadline ? `Deadline: ${normalizedDeadline}` : null,
    ].filter(Boolean).join(" | ");

    // Try Python backend first
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:5001/predict';
    try {
      // Convert flat format to nested format for backend
      const requestBody = {
        student_data: studentData,
        goal: {
          priority: normalizedPriority,
          target_grade: goalSummary,
          deadline: normalizedDeadline
        }
      };

      const response = await fetch(pythonBackendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(15000), // Increased timeout for LLM calls
      });

      if (!response.ok) throw new Error(`Backend returned ${response.status}`);

      const prediction = await response.json();
      
      // Handle new backend response structure
      const riskCategory = prediction.risk_level?.category || prediction.risk_level || calculateMockRisk(studentData);
      const gradeValue = prediction.predicted_grade?.value || prediction.predicted_grade || calculateMockGrade(studentData);
      
      // Transform AI coaching structure to match frontend expectations
      // Transform diagnosis structure
      const transformedDiagnosis = normalizeDiagnosis(prediction.diagnosis, studentData, riskCategory);
      const transformedAiCoaching = normalizeAICoaching(prediction.ai_coaching, studentData, riskCategory, transformedDiagnosis);

      return NextResponse.json({
        predictedGrade: gradeValue,
        riskLevel: riskCategory,
        confidence: prediction.predicted_grade?.confidence ?? prediction.confidence ?? 0.85,
        diagnosis: transformedDiagnosis,
        recommendations: generateRichRecommendations(studentData, riskCategory),
        aiCoaching: transformedAiCoaching,
        fromModel: true,
      });
    } catch (backendError) {
      // Fallback to local calculation
      if (process.env.NODE_ENV === 'development') {
        console.debug('Python backend unavailable, using fallback predictions');
      }
    }

    const risk = calculateMockRisk(studentData);
    const fallbackDiagnosis = buildFallbackDiagnosis(studentData, risk);
    const fallbackAiCoaching = normalizeAICoaching(null, studentData, risk, fallbackDiagnosis);

    // Fallback — no AI coaching available without Python backend
    return NextResponse.json({
      predictedGrade: calculateMockGrade(studentData),
      riskLevel: risk,
      confidence: 0.75,
      diagnosis: fallbackDiagnosis,
      recommendations: generateRichRecommendations(studentData, risk),
      aiCoaching: fallbackAiCoaching,
      fromModel: false,
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to process prediction' }, { status: 500 });
  }
}

function calculateMockGrade(data: Record<string, any>): number {
  let score = 12;
  if (data.studytime >= 3) score += 2;
  else if (data.studytime === 2) score += 0.5;
  if (data.higher === 'yes') score += 1;
  if (data.famsup === 'yes') score += 0.5;
  if (data.internet === 'yes') score += 0.5;
  if (data.failures > 0) score -= data.failures * 2;
  if (data.absences > 15) score -= 2;
  else if (data.absences > 5) score -= 0.5;
  if (data.goout > 3) score -= 1;
  if (data.Dalc > 2) score -= 1;
  if (data.Walc > 3) score -= 1;
  return Math.max(0, Math.min(20, score));
}

function calculateMockRisk(data: Record<string, any>): string {
  let riskScore = 0;
  if (data.failures > 0) riskScore += data.failures * 3;
  if (data.absences > 10) riskScore += 2;
  if (data.absences > 20) riskScore += 2;
  if (data.studytime < 2) riskScore += 3;
  if (data.Dalc > 2 || data.Walc > 3) riskScore += 2;
  if (data.goout > 3) riskScore += 1;
  if (data.higher === 'yes') riskScore -= 2;
  if (data.famsup === 'yes') riskScore -= 1;
  if (data.studytime >= 3) riskScore -= 2;
  if ((data.Medu ?? 0) >= 3 || (data.Fedu ?? 0) >= 3) riskScore -= 1;
  if (data.internet === 'yes') riskScore -= 1;
  if (data.paid === 'yes') riskScore -= 1;
  if (riskScore >= 5) return 'At-risk';
  if (riskScore >= 0) return 'Average';
  return 'High-performing';
}

function generateRichRecommendations(data: Record<string, any>, risk: string): string[] {
  const recs: string[] = [];

  if (risk === 'At-risk') {
    recs.push("Create a structured daily study schedule with fixed revision slots each evening.");
    recs.push("Practice past exam papers weekly to identify recurring weak areas.");
    recs.push("Join a study group or find a tutor for peer learning support.");
  } else if (risk === 'Average') {
    recs.push("Pinpoint 2-3 weak topics per subject and dedicate focused sessions to mastering them.");
    recs.push("Simulate exam conditions with timed mock tests weekly.");
    recs.push("Use spaced repetition (e.g. Anki) to keep older material fresh.");
  } else {
    recs.push("Set stretch goals like aiming for the top percentile or olympiad-style problems.");
    recs.push("Tackle advanced and cross-disciplinary problems to deepen understanding.");
    recs.push("Teaching peers is one of the best ways to solidify your own knowledge.");
  }

  if (data.studytime <= 1) recs.push("Your study time is very low. Aim for at least 1-2 dedicated hours daily.");
  if (data.absences > 15) recs.push(`High absenteeism (${data.absences} days) is hurting your learning. Prioritize attendance.`);
  if (data.failures > 0) recs.push(`You've had ${data.failures} past failure(s) — revisit fundamentals in those subjects.`);
  if (data.internet === 'yes') recs.push("Leverage free online resources: Khan Academy, YouTube, and Coursera.");
  if ((data.health ?? 3) <= 2) recs.push("Prioritize 7-8 hours of sleep, exercise, and nutritious meals.");

  return recs;
}