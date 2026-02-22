"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface StudentData {
  school: string;
  sex: string;
  age: number;
  address: string;
  famsize: string;
  Pstatus: string;
  Medu: number;
  Fedu: number;
  Mjob: string;
  Fjob: string;
  reason: string;
  guardian: string;
  traveltime: number;
  studytime: number;
  failures: number;
  schoolsup: string;
  famsup: string;
  paid: string;
  activities: string;
  nursery: string;
  higher: string;
  internet: string;
  romantic: string;
  famrel: number;
  freetime: number;
  goout: number;
  Dalc: number;
  Walc: number;
  health: number;
  absences: number;
  subject: string;
}

export default function Recommendations() {
  const router = useRouter();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [riskLevel, setRiskLevel] = useState<string>("");
  const [predictedScore, setPredictedScore] = useState<number>(0);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    const data = sessionStorage.getItem("studentData");
    if (!data) {
      router.push("/form");
      return;
    }

    const parsed = JSON.parse(data);
    setStudentData(parsed);
    // Try to use cached prediction if the form previously stored it
    const cached = sessionStorage.getItem("prediction");
    if (cached) {
      try {
        const pred = JSON.parse(cached);
        if (pred) {
          setPredictedScore(Number(pred.predictedGrade ?? pred.predicted_score ?? 0));
          setRiskLevel(pred.riskLevel ?? pred.risk_level ?? calculateRiskLevel(parsed));
          setRecommendations(pred.recommendations ?? pred.recs ?? generateRecommendations(parsed, pred.riskLevel ?? calculateRiskLevel(parsed)));
          return;
        }
      } catch (e) {
        // ignore parse errors and fall through to fetching
      }
    }

    // Otherwise call the local API route which will proxy to the ML backend
    (async () => {
      try {
        const res = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed),
        });

        if (res.ok) {
          const json = await res.json();
          setPredictedScore(Number(json.predictedGrade ?? json.predicted_grade ?? json.predicted_score ?? 0));
          setRiskLevel(json.riskLevel ?? json.risk_level ?? calculateRiskLevel(parsed));
          setRecommendations(json.recommendations ?? json.recs ?? generateRecommendations(parsed, json.riskLevel ?? calculateRiskLevel(parsed)));
          // cache prediction for quick reloads
          try { sessionStorage.setItem('prediction', JSON.stringify(json)); } catch (e) {}
          return;
        }
      } catch (err) {
        console.error('Prediction request failed', err);
      }

      // Fallback to local calculation if API fails
      const risk = calculateRiskLevel(parsed);
      setRiskLevel(risk);
      const score = generatePredictedScore(parsed, risk);
      setPredictedScore(score);
      const recs = generateRecommendations(parsed, risk);
      setRecommendations(recs);
    })();
  }, [router]);

  const calculateRiskLevel = (data: StudentData): string => {
    let riskScore = 0;
    
    // Negative factors
    if (data.failures > 0) riskScore += data.failures * 3;
    if (data.absences > 10) riskScore += 2;
    if (data.studytime < 2) riskScore += 2;
    if (data.schoolsup === "yes") riskScore += 1; // Needs support
    if (data.Dalc > 2 || data.Walc > 2) riskScore += 2;
    if (data.goout > 3) riskScore += 1;
    
    // Positive factors
    if (data.higher === "yes") riskScore -= 2;
    if (data.famsup === "yes") riskScore -= 1;
    if (data.studytime >= 3) riskScore -= 2;
    if (data.Medu >= 3 || data.Fedu >= 3) riskScore -= 1;
    if (data.internet === "yes") riskScore -= 1;
    if (data.paid === "yes") riskScore -= 1;
    
    if (riskScore >= 4) return "At-risk";
    if (riskScore >= 0) return "Average";
    return "High-performing";
  };

  const generatePredictedScore = (data: StudentData, risk: string): number => {
    let baseScore = 12;
    
    if (risk === "High-performing") baseScore = 16;
    else if (risk === "Average") baseScore = 12;
    else baseScore = 8;
    
    // Adjust based on factors
    if (data.studytime >= 3) baseScore += 1;
    if (data.failures > 0) baseScore -= data.failures * 1.5;
    if (data.higher === "yes") baseScore += 0.5;
    if (data.absences > 15) baseScore -= 1;
    
    return Math.max(0, Math.min(20, baseScore));
  };

  const generateRecommendations = (data: StudentData, risk: string): string[] => {
    const recs: string[] = [];
    
    // Risk-based recommendations
    if (risk === "At-risk") {
      recs.push("Follow a structured weekly study plan with specific time blocks for each subject");
      recs.push("Practice previous year question papers regularly to identify weak areas");
      recs.push("Consider joining study groups or getting a tutor for additional support");
    } else if (risk === "Average") {
      recs.push("Focus on improving weak areas to move to high-performing level");
      recs.push("Increase mock test practice to build confidence and speed");
      recs.push("Review and revise topics regularly using spaced repetition");
    } else {
      recs.push("Maintain consistency in preparation and don't get complacent");
      recs.push("Attempt advanced practice problems to challenge yourself");
      recs.push("Help peers with their studies to reinforce your own understanding");
    }
    
    // Factor-specific recommendations
    if (data.studytime < 2) {
      recs.push("Increase your daily study time - aim for at least 2-3 hours per day");
    }
    
    if (data.absences > 10) {
      recs.push("Reduce absences - attending classes regularly is crucial for academic success");
    }
    
    if (data.failures > 0) {
      recs.push("Focus extra attention on subjects where you've had failures in the past");
    }
    
    if (data.famsup === "no") {
      recs.push("Try to engage family members in your academic journey for moral support");
    }
    
    if (data.internet === "yes" && data.studytime < 3) {
      recs.push("Use online resources like Khan Academy, Coursera, or educational YouTube channels");
    }
    
    if (data.goout > 3) {
      recs.push("Balance social life and studies - consider reducing time spent going out");
    }
    
    if (data.health < 3) {
      recs.push("Prioritize your health - exercise regularly and maintain a healthy diet");
    }
    
    return recs;
  };

  const getRecommendationIcon = (index: number, text: string) => {
    // Determine icon based on recommendation content
    if (text.includes("study plan") || text.includes("structured")) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    } else if (text.includes("question papers") || text.includes("practice")) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else if (text.includes("study groups") || text.includes("tutor") || text.includes("peers")) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    } else if (text.includes("time") || text.includes("daily")) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (text.includes("absences") || text.includes("classes")) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    } else if (text.includes("health") || text.includes("exercise")) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    } else if (text.includes("online") || text.includes("resources")) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      );
    } else if (text.includes("family") || text.includes("support")) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    } else if (text.includes("Balance") || text.includes("social")) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      );
    } else if (text.includes("advanced") || text.includes("challenge")) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
  };

  const getFeatureAnalysis = () => {
    if (!studentData) return [];
    
    const analysis = [
      {
        feature: "Study Time",
        value: studentData.studytime,
        max: 4,
        status: studentData.studytime >= 3 ? "good" : studentData.studytime >= 2 ? "average" : "needs-improvement"
      },
      {
        feature: "Past Failures",
        value: studentData.failures,
        max: 4,
        status: studentData.failures === 0 ? "good" : studentData.failures <= 1 ? "average" : "needs-improvement",
        inverse: true
      },
      {
        feature: "Absences",
        value: Math.min(studentData.absences, 30),
        max: 30,
        status: studentData.absences < 5 ? "good" : studentData.absences < 15 ? "average" : "needs-improvement",
        inverse: true
      },
      {
        feature: "Family Support",
        value: studentData.famsup === "yes" ? 5 : 1,
        max: 5,
        status: studentData.famsup === "yes" ? "good" : "needs-improvement"
      },
      {
        feature: "Higher Ed Goals",
        value: studentData.higher === "yes" ? 5 : 1,
        max: 5,
        status: studentData.higher === "yes" ? "good" : "needs-improvement"
      },
      {
        feature: "Parent Education",
        value: Math.max(studentData.Medu, studentData.Fedu),
        max: 4,
        status: Math.max(studentData.Medu, studentData.Fedu) >= 3 ? "good" : "average"
      }
    ];
    
    return analysis;
  };

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const getRiskColor = () => {
    if (riskLevel === "At-risk") return "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200";
    if (riskLevel === "Average") return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200";
    return "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700">
            LearnScope.ai
          </Link>
          <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
            Your Personalized Study Plan
          </h2>
        </div>

        {/* Prediction Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                Predicted Final Grade
              </h3>
              <div className="relative inline-flex items-center justify-center w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${(predictedScore / 20) * 351.858} 351.858`}
                    className={predictedScore >= 15 ? "text-green-500" : predictedScore >= 10 ? "text-yellow-500" : "text-red-500"}
                  />
                </svg>
                <span className="absolute text-3xl font-bold text-gray-900 dark:text-white">
                  {predictedScore.toFixed(1)}/20
                </span>
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                Performance Level
              </h3>
              <div className="flex items-center justify-center h-32">
                <span className={`text-2xl font-bold px-6 py-3 rounded-full ${getRiskColor()}`}>
                  {riskLevel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Key Factor Analysis
          </h3>
          <div className="space-y-4">
            {getFeatureAnalysis().map((item, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.feature}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    item.status === "good" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                    item.status === "average" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}>
                    {item.status === "good" ? "Good" : item.status === "average" ? "Average" : "Needs Attention"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      item.status === "good" ? "bg-green-500" :
                      item.status === "average" ? "bg-yellow-500" :
                      "bg-red-500"
                    }`}
                    style={{ width: `${(item.value / item.max) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Personalized Recommendations
            </h3>
          </div>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start p-4 bg-blue-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mr-4">
                  {getRecommendationIcon(index, rec)}
                </div>
                <p className="text-gray-800 dark:text-gray-200 flex-1 pt-2">
                  {rec}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link
            href="/form"
            className="flex-1 px-6 py-3 text-center border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white transition-colors"
          >
            ← Edit Information
          </Link>
          <button
            onClick={() => window.print()}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Report
          </button>
        </div>
      </div>
    </div>
  );
}
