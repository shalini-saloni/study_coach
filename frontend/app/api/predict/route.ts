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
  study_plan: {
    overview: string;
    days: StudyDay[];
  };
  resources: Resource[];
  next_steps: string[];
  ai_generated: boolean;
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

export async function POST(request: Request) {
  try {
    const studentData = await request.json();

    // Try Python backend first
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:5001/predict';
    try {
      // Convert flat format to nested format for backend
      const requestBody = {
        student_data: studentData,
        goal: {
          priority: 'medium',
          target_grade: 'Improve overall academic performance'
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
      let transformedAiCoaching = null;
      if (prediction.ai_coaching) {
        transformedAiCoaching = {
          diagnosis_explanation: prediction.ai_coaching.learning_diagnosis || '',
          study_plan: prediction.ai_coaching.study_plan || { overview: '', days: [] },
          resources: prediction.ai_coaching.resources || [],
          next_steps: prediction.ai_coaching.next_steps || [],
          ai_generated: prediction.ai_coaching.ai_generated || false
        };
      }

      // Transform diagnosis structure
      let transformedDiagnosis = null;
      if (prediction.diagnosis) {
        transformedDiagnosis = {
          weaknesses: prediction.diagnosis.weaknesses || [],
          strengths: prediction.diagnosis.strengths || [],
          reason: prediction.diagnosis.reason || '',
          profile: prediction.diagnosis.profile || '',
          patterns: prediction.diagnosis.patterns || [],
          recommendations: prediction.diagnosis.recommendations || []
        };
      }

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

    // Fallback — no AI coaching available without Python backend
    const risk = calculateMockRisk(studentData);
    return NextResponse.json({
      predictedGrade: calculateMockGrade(studentData),
      riskLevel: risk,
      confidence: 0.75,
      diagnosis: null,
      recommendations: generateRichRecommendations(studentData, risk),
      aiCoaching: null,
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