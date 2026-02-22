import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const studentData = await request.json();
    // Call the ML backend using an environment-configured URL
    const backendUrl = process.env.BACKEND_URL || process.env.ML_API_URL || "";

    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl.replace(/\/$/, "")}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(studentData),
        });

        const json = await res.json();
        return NextResponse.json(json, { status: res.status });
      } catch (err) {
        // Fall through to mock on error
        console.error("Error calling backend predict API:", err);
      }
    }

    // Fallback: return mock predictions when no backend configured or call fails
    const mockPrediction = {
      predictedGrade: calculateMockGrade(studentData),
      riskLevel: calculateMockRisk(studentData),
      confidence: 0.85,
      recommendations: generateMockRecommendations(studentData),
    };

    return NextResponse.json(mockPrediction);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process prediction' },
      { status: 500 }
    );
  }
}

function calculateMockGrade(data: any): number {
  let score = 12;
  
  // Positive factors
  if (data.studytime >= 3) score += 2;
  if (data.higher === 'yes') score += 1;
  if (data.famsup === 'yes') score += 1;
  if (data.internet === 'yes') score += 0.5;
  
  // Negative factors
  if (data.failures > 0) score -= data.failures * 2;
  if (data.absences > 10) score -= 2;
  if (data.goout > 3) score -= 1;
  
  return Math.max(0, Math.min(20, score));
}

function calculateMockRisk(data: any): string {
  const grade = calculateMockGrade(data);
  
  if (grade < 10) return 'At-risk';
  if (grade < 15) return 'Average';
  return 'High-performing';
}

function generateMockRecommendations(data: any): string[] {
  const recs: string[] = [];
  
  if (data.studytime < 2) {
    recs.push('Increase daily study time to at least 2-3 hours');
  }
  
  if (data.failures > 0) {
    recs.push('Focus on subjects where you have had past failures');
  }
  
  if (data.absences > 10) {
    recs.push('Improve attendance - regular class participation is crucial');
  }
  
  return recs;
}
