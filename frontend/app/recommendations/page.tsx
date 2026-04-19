"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ── Type definitions ──────────────────────────────────────────────────────────

interface StudentData {
  school: string; sex: string; age: number; address: string;
  famsize: string; Pstatus: string; Medu: number; Fedu: number;
  Mjob: string; Fjob: string; reason: string; guardian: string;
  traveltime: number; studytime: number; failures: number;
  schoolsup: string; famsup: string; paid: string; activities: string;
  nursery: string; higher: string; internet: string; romantic: string;
  famrel: number; freetime: number; goout: number; Dalc: number;
  Walc: number; health: number; absences: number; subject: string;
}

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
  learning_diagnosis?: string;
  weekly_goals?: Array<{
    week_label: string;
    focus: string;
    goal: string;
    tasks: string[];
    success_criteria: string;
    linked_weaknesses: string[];
    linked_strengths: string[];
  }>;
  milestone_goals?: Array<{
    milestone_name: string;
    target: string;
    timeframe: string;
    linked_weeks: string[];
    completion_check: string;
    linked_weaknesses: string[];
    linked_strengths: string[];
  }>;
  quiz_questions?: Array<{
    question: string;
    type: "multiple-choice" | "short-answer" | "open-response";
    difficulty: "basic" | "intermediate" | "advanced";
    topic: string;
    choices: string[];
    answer: string;
    explanation: string;
  }>;
  quiz_generation?: Array<{
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
}

type Status = "good" | "average" | "needs-improvement";

// ── SVG Icon components ──────────────────────────────────────────────────────
const I = {
  Calendar: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Clipboard: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  Users: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  TrendingUp: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  Repeat: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Star: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  Lightning: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Bulb: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  Clock: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Warning: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  BookOpen: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  Globe: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
  Home: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Ban: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>,
  Moon: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
  Heart: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  GradCap: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>,
  Calculator: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  Pencil: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Sparkles: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  BarChart: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  School: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  Target: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  ChevronDown: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>,
  ChevronLeft: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>,
  Printer: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
  Brain: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  Rocket: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Link: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
  Play: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  App: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  Wand: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  CheckCircle: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

type IconKey = keyof typeof I;
type RecItem = { text: string; icon: IconKey };

// ── Recommendation generation (fallback) ──────────────────────────────────────
function generateRecommendations(data: StudentData, risk: string): RecItem[] {
  const recs: RecItem[] = [];
  if (risk === "At-risk") {
    recs.push({ icon: "Calendar", text: "Create a structured daily study schedule — divide your time by subject with fixed revision slots each evening." });
    recs.push({ icon: "Clipboard", text: "Practice past exam papers weekly to identify recurring weak areas and track your progress over time." });
    recs.push({ icon: "Users", text: "Join a study group or find a tutor — peer learning dramatically improves retention for at-risk students." });
  } else if (risk === "Average") {
    recs.push({ icon: "TrendingUp", text: "Pinpoint 2–3 weak topics per subject and dedicate focused sessions to mastering them this week." });
    recs.push({ icon: "Clipboard", text: "Simulate exam conditions with timed mock tests weekly to build speed, stamina, and reduce test anxiety." });
    recs.push({ icon: "Repeat", text: "Use spaced repetition (e.g. Anki) to keep older material fresh alongside new content." });
  } else {
    recs.push({ icon: "Star", text: "Maintain your momentum — set stretch goals like aiming for the top percentile or exploring olympiad-style problems." });
    recs.push({ icon: "Lightning", text: "Tackle advanced and cross-disciplinary problems to deepen conceptual understanding beyond the syllabus." });
    recs.push({ icon: "Users", text: "Teaching peers is one of the most effective ways to consolidate your own knowledge — consider informal tutoring." });
  }
  if (data.studytime <= 1) recs.push({ icon: "Clock", text: "Your study time is very low (under 2 hrs/week). Aim for at least 1–2 dedicated hours daily to see real improvement." });
  if (data.absences > 15) recs.push({ icon: "Warning", text: `High absenteeism (${data.absences} days) is significantly hurting your learning. Prioritize attending every class.` });
  if (data.failures > 0) recs.push({ icon: "BookOpen", text: `You've had ${data.failures} past failure(s) — revisit fundamentals in those subjects before moving to advanced topics.` });
  if (data.internet === "yes") recs.push({ icon: "Globe", text: "Leverage free online resources: Khan Academy, YouTube (3Blue1Brown for math, CrashCourse), and Coursera." });
  if (data.health <= 2) recs.push({ icon: "Heart", text: "Your health score is low — prioritize 7–8 hours of sleep, regular exercise, and nutritious meals." });
  if (data.higher === "yes") recs.push({ icon: "GradCap", text: "Since you're aiming for higher education, research entrance requirements early and align your study goals." });
  if (data.subject === "math") recs.push({ icon: "Calculator", text: "For mathematics: practice solving problems from scratch daily, even if just 5 problems per session." });
  else recs.push({ icon: "Pencil", text: "For Portuguese: focus on reading comprehension, essay structure, and vocabulary by writing short paragraphs daily." });
  return recs;
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function gradeToRisk(score: number): string {
  if (score >= 15) return "High-performing";
  if (score >= 10) return "Average";
  return "At-risk";
}

function calcRiskLocally(d: StudentData): string {
  let s = 0;
  if (d.failures > 0) s += d.failures * 3;
  if (d.absences > 10) s += 2;
  if (d.absences > 20) s += 2;
  if (d.studytime < 2) s += 3;
  if (d.Dalc > 2 || d.Walc > 3) s += 2;
  if (d.goout > 3) s += 1;
  if (d.higher === "yes") s -= 2;
  if (d.famsup === "yes") s -= 1;
  if (d.studytime >= 3) s -= 2;
  if (d.Medu >= 3 || d.Fedu >= 3) s -= 1;
  if (d.internet === "yes") s -= 1;
  if (d.paid === "yes") s -= 1;
  if (s >= 5) return "At-risk";
  if (s >= 0) return "Average";
  return "High-performing";
}

function calcGradeLocally(d: StudentData, risk: string): number {
  let base = risk === "High-performing" ? 16 : risk === "Average" ? 12 : 8;
  if (d.studytime >= 3) base += 1;
  if (d.failures > 0) base -= d.failures * 1.5;
  if (d.higher === "yes") base += 0.5;
  if (d.absences > 15) base -= 1.5;
  else if (d.absences > 5) base -= 0.5;
  return Math.max(0, Math.min(20, base));
}

// ── Day color scheme for study plan ──────────────────────────────────────────
const dayColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  Monday:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700",    dot: "bg-blue-500" },
  Tuesday:   { bg: "bg-purple-50",  border: "border-purple-200",  text: "text-purple-700",  dot: "bg-purple-500" },
  Wednesday: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  Thursday:  { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-500" },
  Friday:    { bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-700",    dot: "bg-rose-500" },
  Saturday:  { bg: "bg-cyan-50",    border: "border-cyan-200",    text: "text-cyan-700",    dot: "bg-cyan-500" },
  Sunday:    { bg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-600",   dot: "bg-slate-400" },
};

// ── Resource type icon ──────────────────────────────────────────────────────
function resourceIcon(type: string): IconKey {
  switch (type) {
    case "website": return "Globe";
    case "youtube": return "Play";
    case "app": return "App";
    case "technique": return "Bulb";
    default: return "Link";
  }
}

function resourceTypeBadge(type: string): { bg: string; text: string; label: string } {
  switch (type) {
    case "website":   return { bg: "bg-blue-100",    text: "text-blue-700",    label: "Website" };
    case "youtube":   return { bg: "bg-red-100",     text: "text-red-700",     label: "YouTube" };
    case "app":       return { bg: "bg-emerald-100", text: "text-emerald-700", label: "App" };
    case "technique": return { bg: "bg-amber-100",   text: "text-amber-700",   label: "Technique" };
    default:          return { bg: "bg-slate-100",   text: "text-slate-700",   label: "Resource" };
  }
}

function normalizeNextSteps(nextSteps?: string[]): string[] {
  const defaults = [
    "Review today's learning outcomes and highlight one gap.",
    "Plan a 25-minute study block for tonight.",
    "Practice one weak topic using active recall.",
    "Check your progress against the weekly goal.",
    "Ask for help on one unclear concept.",
  ];
  const verbs = ["Review", "Plan", "Practice", "Check", "Ask"];
  const items = Array.isArray(nextSteps) ? nextSteps.filter(Boolean).slice(0, 5) : [];
  while (items.length < 5) {
    items.push(defaults[items.length]);
  }
  return items.slice(0, 5).map((item, index) => {
    const text = String(item || defaults[index]).trim();
    return text.toLowerCase().startsWith(verbs[index].toLowerCase()) ? text : `${verbs[index]} ${text}`.trim();
  });
}

function normalizeCoaching(aiCoaching: AICoaching | null, risk: string, diagnosis: Diagnosis | null): AICoaching {
  const fallbackQuiz = [
    {
      question: "What is one effective way to review a weak topic?",
      type: "multiple-choice" as const,
      difficulty: "basic" as const,
      topic: "study habits",
      choices: ["Ignore it", "Use active recall", "Read once only", "Skip practice"],
      answer: "Use active recall",
      explanation: "Active recall helps turn review into retrieval practice.",
    },
    {
      question: "Why should you check your mistakes after practice?",
      type: "short-answer" as const,
      difficulty: "intermediate" as const,
      topic: "study habits",
      choices: [],
      answer: "To identify gaps and avoid repeating them.",
      explanation: "Error review improves learning efficiency.",
    },
    {
      question: "Explain how a weekly goal can help you improve.",
      type: "open-response" as const,
      difficulty: "intermediate" as const,
      topic: "planning",
      choices: [],
      answer: "It breaks a larger target into smaller, trackable steps.",
      explanation: "Weekly goals create measurable progress markers.",
    },
  ];

  const fallback: AICoaching = {
    diagnosis_explanation: diagnosis?.reason || "A personalized study plan is ready based on the submitted profile.",
    learning_diagnosis: diagnosis?.reason || "A personalized study plan is ready based on the submitted profile.",
    weekly_goals: [
      {
        week_label: "Week 1",
        focus: "stabilize the routine",
        goal: "Build a consistent study habit and focus on the main weakness.",
        tasks: ["Review the weakest topic.", "Complete one daily study block.", "Write one question for support."],
        success_criteria: "The student completes the planned tasks and can explain the improvement.",
        linked_weaknesses: diagnosis?.weaknesses?.slice(0, 2) || [],
        linked_strengths: diagnosis?.strengths?.slice(0, 2) || [],
      },
      {
        week_label: "Week 2",
        focus: "build recall habit",
        goal: "Use active recall and short quizzes to reinforce learning.",
        tasks: ["Test memory without notes.", "Review mistakes immediately.", "Repeat one weak topic."],
        success_criteria: "The student shows better recall and fewer repeat mistakes.",
        linked_weaknesses: diagnosis?.weaknesses?.slice(0, 2) || [],
        linked_strengths: diagnosis?.strengths?.slice(0, 2) || [],
      },
      {
        week_label: "Week 3",
        focus: risk === "High-performing" ? "apply mastery" : "add timed practice",
        goal: "Use timed work to improve speed and accuracy.",
        tasks: ["Complete one timed set.", "Mark errors and revise them.", "Record one measurable win."],
        success_criteria: "The student can compare results against Week 1.",
        linked_weaknesses: diagnosis?.weaknesses?.slice(0, 2) || [],
        linked_strengths: diagnosis?.strengths?.slice(0, 2) || [],
      },
    ],
    milestone_goals: [
      {
        milestone_name: "Foundation checkpoint",
        target: "Complete core fundamentals",
        timeframe: "Mid-plan",
        linked_weeks: ["Week 1", "Week 2"],
        completion_check: "The student can demonstrate progress on the main weakness.",
        linked_weaknesses: diagnosis?.weaknesses?.slice(0, 2) || [],
        linked_strengths: diagnosis?.strengths?.slice(0, 2) || [],
      },
      {
        milestone_name: "Consistency checkpoint",
        target: "Sustain the study routine",
        timeframe: "End of plan",
        linked_weeks: ["Week 2", "Week 3"],
        completion_check: "The student maintains a repeatable routine for a full week.",
        linked_weaknesses: diagnosis?.weaknesses?.slice(0, 2) || [],
        linked_strengths: diagnosis?.strengths?.slice(0, 2) || [],
      },
      {
        milestone_name: "Outcome checkpoint",
        target: "Reach the target grade",
        timeframe: "Before the next assessment",
        linked_weeks: ["Week 3"],
        completion_check: "The student reaches the target on a mock test or quiz.",
        linked_weaknesses: diagnosis?.weaknesses?.slice(0, 2) || [],
        linked_strengths: diagnosis?.strengths?.slice(0, 2) || [],
      },
    ],
    quiz_questions: fallbackQuiz,
    quiz_generation: fallbackQuiz,
    study_plan: {
      overview: "Structured study plan with short practice cycles and weekly review.",
      days: [
        { day: "Monday", focus: "Review weak topics", tasks: ["Read notes", "Complete practice items"], duration: "25 min" },
        { day: "Wednesday", focus: "Test recall", tasks: ["Do a mini quiz", "Check corrections"], duration: "20 min" },
        { day: "Friday", focus: "Apply learning", tasks: ["Solve mixed questions", "Summarize mistakes"], duration: "30 min" },
      ],
    },
    resources: [
      { name: "Khan Academy", type: "website", url: "https://www.khanacademy.org/", why: "Free lessons and practice for core subjects." },
      { name: "BBC Bitesize", type: "website", url: "https://www.bbc.co.uk/bitesize", why: "Clear revision guides and quizzes." },
      { name: "Quizlet", type: "website", url: "https://quizlet.com/", why: "Flashcards and quick review tools." },
    ],
    next_steps: normalizeNextSteps(),
    ai_generated: false,
  };

  if (!aiCoaching) return fallback;

  const quizQuestions = aiCoaching.quiz_questions?.length
    ? aiCoaching.quiz_questions
    : aiCoaching.quiz_generation?.length
      ? aiCoaching.quiz_generation
      : fallback.quiz_questions;

  return {
    ...fallback,
    ...aiCoaching,
    diagnosis_explanation: aiCoaching.diagnosis_explanation || aiCoaching.learning_diagnosis || fallback.diagnosis_explanation,
    learning_diagnosis: aiCoaching.learning_diagnosis || aiCoaching.diagnosis_explanation || fallback.learning_diagnosis,
    weekly_goals: aiCoaching.weekly_goals?.length ? aiCoaching.weekly_goals : fallback.weekly_goals,
    milestone_goals: aiCoaching.milestone_goals?.length ? aiCoaching.milestone_goals : fallback.milestone_goals,
    quiz_questions: quizQuestions,
    quiz_generation: quizQuestions,
    study_plan: aiCoaching.study_plan?.days?.length ? aiCoaching.study_plan : fallback.study_plan,
    resources: aiCoaching.resources?.length ? aiCoaching.resources : fallback.resources,
    next_steps: normalizeNextSteps(aiCoaching.next_steps),
    ai_generated: Boolean(aiCoaching.ai_generated),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Recommendations() {
  const [data, setData] = useState<StudentData | null>(null);
  const [risk, setRisk] = useState("");
  const [score, setScore] = useState(0);
  const [recs, setRecs] = useState<RecItem[]>([]);
  const [aiCoaching, setAiCoaching] = useState<AICoaching | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDay, setOpenDay] = useState<number | null>(0); // First day open by default
  const [openRec, setOpenRec] = useState<number | null>(null);
  const [openQuiz, setOpenQuiz] = useState<number | null>(0);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [apiWarning, setApiWarning] = useState<string | null>(null);
  const [missingInputData, setMissingInputData] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = sessionStorage.getItem("studentData");
      if (!raw) {
        setMissingInputData(true);
        setLoading(false);
        return;
      }
      const sd: StudentData = JSON.parse(raw);
      setData(sd);

      let finalGrade: number;
      let finalRisk: string;

      // Try stored prediction
      const stored = sessionStorage.getItem("prediction");
      if (stored) {
        try {
          const pred = JSON.parse(stored);
          finalGrade = pred.predictedGrade ?? calcGradeLocally(sd, calcRiskLocally(sd));
          finalRisk = pred.riskLevel ?? gradeToRisk(finalGrade);
          setScore(finalGrade);
          setRisk(finalRisk);
          if (pred.diagnosis) setDiagnosis(pred.diagnosis);
          if (pred.aiCoaching) {
            // Transform learning_diagnosis to diagnosis_explanation for compatibility
            const coaching = { ...pred.aiCoaching };
            if (coaching.learning_diagnosis && !coaching.diagnosis_explanation) {
              coaching.diagnosis_explanation = coaching.learning_diagnosis;
            }
            setAiCoaching(coaching);
          }
          setRecs(generateRecommendations(sd, finalRisk));
          setLoading(false);
          return;
        } catch { /* fall through */ }
      }

      // Try API
      try {
        const res = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sd),
        });
        if (!res.ok) throw new Error();
        const result = await res.json();
        finalGrade = result.predictedGrade ?? calcGradeLocally(sd, calcRiskLocally(sd));
        finalRisk = result.riskLevel ?? gradeToRisk(finalGrade);
        if (result.diagnosis) setDiagnosis(result.diagnosis);
        if (result.aiCoaching) {
          // Transform learning_diagnosis to diagnosis_explanation for compatibility
          const coaching = { ...result.aiCoaching };
          if (coaching.learning_diagnosis && !coaching.diagnosis_explanation) {
            coaching.diagnosis_explanation = coaching.learning_diagnosis;
          }
          setAiCoaching(coaching);
        }
      } catch {
        const r = calcRiskLocally(sd);
        finalGrade = calcGradeLocally(sd, r);
        finalRisk = gradeToRisk(finalGrade);
        setApiWarning("Live AI service is unavailable. Showing fallback recommendations from your submitted profile.");
      }

      setScore(finalGrade);
      setRisk(finalRisk);
      setRecs(generateRecommendations(sd, finalRisk));
      setLoading(false);
    })();
  }, []);

  const toggleStep = (idx: number) => {
    setCheckedSteps(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  if (loading || !data) {
    if (missingInputData) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-violet-50 to-fuchsia-50 px-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-violet-100 shadow-xl shadow-violet-100 p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto">
              <I.Warning />
            </div>
            <h2 className="text-xl font-black text-slate-800">No Student Profile Found</h2>
            <p className="text-sm text-slate-500">Please complete the form first so we can generate your personalized recommendations.</p>
            <Link href="/form" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold">
              Go To Form
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-violet-50 to-fuchsia-50">
        <div className="text-center space-y-5 w-full max-w-md px-4">
          <div className="w-16 h-16 mx-auto relative">
            <div className="absolute inset-0 rounded-full border-4 border-violet-200" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-600 animate-spin" />
          </div>
          <p className="text-slate-500 font-medium">Analyzing your profile with AI...</p>
          <p className="text-slate-400 text-sm">Generating your personalized study coaching</p>
          <div className="space-y-2 pt-2">
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 w-2/3 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400">This usually takes a few seconds</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived display values ───────────────────────────────────────────────
  const riskCfg = {
    "At-risk": { textColor: "text-red-600", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", subtitle: "Needs focused improvement", gradient: "from-red-500 to-rose-500" },
    "Average": { textColor: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", subtitle: "Room to grow significantly", gradient: "from-amber-500 to-orange-500" },
    "High-performing": { textColor: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", subtitle: "Excellent — keep it up!", gradient: "from-emerald-500 to-teal-500" },
  }[risk] ?? { textColor: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", subtitle: "", gradient: "from-amber-500 to-orange-500" };

  const gaugeColor = score >= 15 ? "#10b981" : score >= 10 ? "#f59e0b" : "#ef4444";
  const circ = 2 * Math.PI * 52;
  const dash = (score / 20) * circ;

  const coaching = normalizeCoaching(aiCoaching, risk, diagnosis);
  const quizItems = coaching.quiz_questions ?? coaching.quiz_generation ?? [];
  const weeklyGoals = coaching.weekly_goals ?? [];
  const milestoneGoals = coaching.milestone_goals ?? [];
  const studyPlan = coaching.study_plan;
  const resources = coaching.resources ?? [];
  const nextSteps = normalizeNextSteps(coaching.next_steps);

  const statusColors: Record<Status, { bar: string; badge: string }> = {
    "good": { bar: "from-emerald-400 to-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
    "average": { bar: "from-amber-400 to-amber-500", badge: "bg-amber-100 text-amber-700" },
    "needs-improvement": { bar: "from-red-400 to-red-500", badge: "bg-red-100 text-red-700" },
  };

  type Factor = { label: string; value: number; max: number; status: Status; display: string; Icon: IconKey };
  const factors: Factor[] = [
    { label: "Study Time", value: data.studytime, max: 4, status: data.studytime >= 3 ? "good" : data.studytime >= 2 ? "average" : "needs-improvement", display: ["< 2 hrs", "2–5 hrs", "5–10 hrs", "> 10 hrs"][data.studytime - 1] ?? `${data.studytime}`, Icon: "BookOpen" },
    { label: "Past Failures", value: 4 - data.failures, max: 4, status: data.failures === 0 ? "good" : data.failures === 1 ? "average" : "needs-improvement", display: `${data.failures} failure${data.failures !== 1 ? "s" : ""}`, Icon: "Warning" },
    { label: "Absences", value: Math.max(0, 30 - Math.min(30, data.absences)), max: 30, status: data.absences < 5 ? "good" : data.absences < 15 ? "average" : "needs-improvement", display: `${data.absences} days`, Icon: "School" },
    { label: "Family Support", value: data.famsup === "yes" ? 5 : 1, max: 5, status: data.famsup === "yes" ? "good" : "needs-improvement", display: data.famsup === "yes" ? "Yes" : "No", Icon: "Home" },
    { label: "Higher Ed Goal", value: data.higher === "yes" ? 5 : 1, max: 5, status: data.higher === "yes" ? "good" : "needs-improvement", display: data.higher === "yes" ? "Yes" : "No", Icon: "GradCap" },
    { label: "Health", value: data.health, max: 5, status: data.health >= 4 ? "good" : data.health >= 3 ? "average" : "needs-improvement", display: `${data.health}/5`, Icon: "Heart" },
  ];

  const reportSourceLabel = coaching.ai_generated ? "Powered by AI Coach" : "AI-Enhanced Coaching";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-fuchsia-50 py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">
              LearnScope.ai
            </span>
          </Link>
          <h2 className="mt-3 text-xl font-bold text-slate-700">Your Personalized Study Plan</h2>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-violet-100 to-fuchsia-100 border border-violet-200">
              <I.Sparkles />
              <span className="text-xs font-bold text-violet-700">
                {reportSourceLabel}
              </span>
          </div>
        </div>

        {apiWarning && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-medium">
            {apiWarning}
          </div>
        )}

        {/* Score + Risk */}
        <div className="bg-white rounded-3xl shadow-xl shadow-violet-100 border border-violet-100 p-5 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
            {/* Gauge */}
            <div className="flex flex-col items-center gap-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Predicted Final Grade</p>
              <div className="relative w-36 h-36">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                  <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`}
                    style={{ stroke: gaugeColor, transition: "stroke-dasharray 1s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-slate-800">{score.toFixed(1)}</span>
                  <span className="text-xs font-semibold text-slate-400">out of 20</span>
                </div>
              </div>
              <div className="flex gap-3 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />Below 10</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />10 – 14</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />15+</span>
              </div>
            </div>

            {/* Level badge */}
            <div className="flex flex-col items-center gap-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Performance Level</p>
              <div className={`w-full px-6 py-6 rounded-2xl border-2 ${riskCfg.bg} ${riskCfg.border} flex flex-col items-center gap-2`}>
                <div className={`w-3 h-3 rounded-full ${riskCfg.dot} animate-pulse`} />
                <span className={`text-2xl font-black ${riskCfg.textColor}`}>{risk}</span>
                <p className="text-xs text-slate-500 text-center">{riskCfg.subtitle}</p>
                {diagnosis?.profile && diagnosis.profile !== "Standard Profile" && (
                  <span className="mt-1 text-xs font-bold px-3 py-1 rounded-full bg-violet-100 text-violet-700">
                    {diagnosis.profile}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ━━━ AI DIAGNOSIS SECTION ━━━ */}
        {coaching.diagnosis_explanation && (
          <div className="relative bg-white rounded-3xl shadow-xl shadow-violet-100 border border-violet-100 overflow-hidden">
            {/* Gradient accent bar */}
            <div className={`h-1.5 bg-gradient-to-r ${riskCfg.gradient}`} />
            <div className="p-5 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white">
                  <I.Brain />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">AI Diagnosis</h3>
                  <p className="text-xs text-slate-400">Personalized analysis of your academic profile</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-violet-50/50 rounded-2xl p-6 border border-slate-100">
                <p className="text-slate-700 leading-relaxed text-[15px] break-words">
                  {coaching.diagnosis_explanation}
                </p>
              </div>
              {/* Strengths & Weaknesses pills */}
              {diagnosis && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {diagnosis.strengths?.map((s, i) => (
                    <span key={`s-${i}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      {s}
                    </span>
                  ))}
                  {diagnosis.weaknesses?.map((w, i) => (
                    <span key={`w-${i}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      {w}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* Factor Analysis */}
            <div className="bg-white rounded-3xl shadow-xl shadow-violet-100 border border-violet-100 p-5 sm:p-8">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white">
                  <I.BarChart />
                </span>
                Key Factor Analysis
              </h3>
              <div className="space-y-5">
                {factors.map((f, idx) => {
                  const sc = statusColors[f.status];
                  const Icon = I[f.Icon];
                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <span className="text-slate-400"><Icon /></span>
                          {f.label}
                          <span className="text-slate-400 font-normal text-xs">({f.display})</span>
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sc.badge}`}>
                          {f.status === "good" ? "Good" : f.status === "average" ? "Average" : "Needs Work"}
                        </span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${sc.bar} transition-all duration-700`}
                          style={{ width: `${(f.value / f.max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ━━━ AI STUDY PLAN ━━━ */}
            <div className="bg-white rounded-3xl shadow-xl shadow-violet-100 border border-violet-100 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
              <div className="p-5 sm:p-8">
                <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white">
                    <I.Calendar />
                  </span>
                  Study Plan
                </h3>
                <p className="text-sm text-slate-500 mb-6 break-words">{studyPlan.overview}</p>
                <div className="space-y-3">
                  {studyPlan.days?.map((day, idx) => {
                    const isOpen = openDay === idx;
                    const dc = dayColors[day.day] ?? dayColors.Monday;
                    return (
                      <div key={idx} className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden ${isOpen ? `${dc.border} ${dc.bg}` : "border-slate-100 hover:border-slate-200"}`}>
                        <button onClick={() => setOpenDay(isOpen ? null : idx)} className="w-full text-left px-5 py-4 flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dc.dot}`} />
                          <div className="flex-1">
                            <span className={`text-sm font-bold ${isOpen ? dc.text : "text-slate-700"}`}>{day.day}</span>
                            <span className="text-xs text-slate-400 ml-2">— {day.focus}</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{day.duration}</span>
                          <span className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                            <I.ChevronDown />
                          </span>
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-4">
                            <div className="pl-5 border-l-2 border-slate-200 space-y-2">
                              {day.tasks?.map((task, tIdx) => (
                                <div key={tIdx} className="flex items-start gap-2 text-sm text-slate-600">
                                  <span className="text-violet-400 mt-0.5 flex-shrink-0"><I.CheckCircle /></span>
                                  <span className="break-words">{task}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ━━━ WEEKLY GOALS ━━━ */}
            <div className="bg-white rounded-3xl shadow-xl shadow-violet-100 border border-violet-100 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div className="p-5 sm:p-8">
                <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
                    <I.Target />
                  </span>
                  Weekly Goals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  {weeklyGoals.map((goal, idx) => (
                    <div key={idx} className="rounded-2xl border-2 border-slate-100 bg-gradient-to-br from-slate-50 to-violet-50/50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">{goal.week_label}</p>
                      <h4 className="text-sm font-black text-slate-800 mt-1">{goal.focus}</h4>
                      <p className="text-sm text-slate-600 leading-relaxed mt-3 break-words">{goal.goal}</p>
                      <div className="mt-3 space-y-2">
                        {goal.tasks?.map((task, taskIdx) => (
                          <div key={taskIdx} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="text-emerald-500 mt-0.5 flex-shrink-0"><I.CheckCircle /></span>
                            <span className="break-words">{task}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Success Criteria</p>
                        <p className="text-xs text-slate-600 leading-relaxed break-words">{goal.success_criteria}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ━━━ MILESTONES ━━━ */}
            <div className="bg-white rounded-3xl shadow-xl shadow-violet-100 border border-violet-100 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
              <div className="p-5 sm:p-8">
                <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
                    <I.Star />
                  </span>
                  Milestones
                </h3>
                <div className="space-y-3 mt-5">
                  {milestoneGoals.map((milestone, idx) => (
                    <div key={idx} className="rounded-2xl border-2 border-slate-100 p-4 bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-amber-500">{milestone.milestone_name}</p>
                          <h4 className="text-sm font-black text-slate-800 mt-1">{milestone.target}</h4>
                          <p className="text-xs text-slate-400 mt-1">{milestone.timeframe}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(milestone.linked_weeks || []).map((week, weekIdx) => (
                            <span key={`week-${idx}-${weekIdx}`} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                              {week}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mt-3 leading-relaxed break-words">{milestone.completion_check}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ━━━ RESOURCES ━━━ */}
            <div className="bg-white rounded-3xl shadow-xl shadow-violet-100 border border-violet-100 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500" />
              <div className="p-5 sm:p-8">
                <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                    <I.Globe />
                  </span>
                  Resources
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                  {resources.map((res, idx) => {
                    const badge = resourceTypeBadge(res.type);
                    const RIcon = I[resourceIcon(res.type)];
                    const isExternal = res.url && res.url !== "#" && res.url.startsWith("http");
                    return (
                      <div key={idx} className="group rounded-2xl border-2 border-slate-100 hover:border-violet-200 hover:shadow-md transition-all p-5 flex flex-col">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500 group-hover:text-white transition-all">
                            <RIcon />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-800 break-words">{res.name}</h4>
                            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed flex-1 break-words">{res.why}</p>
                        {isExternal && (
                          <a href={res.url} target="_blank" rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors"
                          >
                            <I.Link /> Open Resource
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ━━━ PRACTICE QUIZ ━━━ */}
            <div className="bg-white rounded-3xl shadow-xl shadow-violet-100 border border-violet-100 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-fuchsia-500 to-violet-500" />
              <div className="p-5 sm:p-8">
                <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center text-white">
                    <I.Bulb />
                  </span>
                  Practice Quiz
                </h3>
                <div className="space-y-3 mt-5">
                  {quizItems.map((quizItem, idx) => {
                    const isOpen = openQuiz === idx;
                    const difficultyBadge = quizItem.difficulty === "basic"
                      ? "bg-emerald-100 text-emerald-700"
                      : quizItem.difficulty === "advanced"
                        ? "bg-violet-100 text-violet-700"
                        : "bg-amber-100 text-amber-700";
                    return (
                      <div key={idx} className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden ${isOpen ? "border-violet-200 bg-violet-50/40" : "border-slate-100 hover:border-slate-200"}`}>
                        <button onClick={() => setOpenQuiz(isOpen ? null : idx)} className="w-full text-left px-5 py-4 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <I.CheckCircle />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-blue-500">{quizItem.topic}</span>
                              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${difficultyBadge}`}>{quizItem.difficulty}</span>
                              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{quizItem.type}</span>
                            </div>
                            <p className="text-sm font-semibold text-slate-700 leading-relaxed break-words">{quizItem.question}</p>
                          </div>
                          <span className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                            <I.ChevronDown />
                          </span>
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5">
                            {quizItem.choices?.length > 0 && (
                              <div className="grid gap-2 mb-4">
                                {quizItem.choices.map((choice, choiceIdx) => (
                                  <div key={choiceIdx} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 break-words">
                                    {choice}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="rounded-2xl border border-violet-200 bg-white p-4 space-y-3">
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Correct Answer</p>
                                <p className="text-sm text-slate-700 leading-relaxed break-words">{quizItem.answer}</p>
                              </div>
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Explanation</p>
                                <p className="text-sm text-slate-600 leading-relaxed break-words">{quizItem.explanation}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Fallback Recommendations (always shown) */}
            <div className="bg-white rounded-3xl shadow-xl shadow-violet-100 border border-violet-100 p-5 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white">
                  <I.Sparkles />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">
                    Additional Tips
                  </h3>
                  <p className="text-xs text-slate-400">{recs.length} tailored suggestions for you</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {recs.map((rec, idx) => {
                  const isOpen = openRec === idx;
                  const Icon = I[rec.icon];
                  return (
                    <button key={idx} type="button"
                      onClick={() => setOpenRec(isOpen ? null : idx)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${isOpen ? "border-violet-300 bg-violet-50" : "border-slate-100 hover:border-violet-200 hover:bg-violet-50/50"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isOpen ? "bg-violet-500 text-white" : "bg-slate-100 text-slate-500"
                          }`}>
                          <Icon />
                        </div>
                        <p className={`flex-1 text-sm font-semibold leading-snug ${isOpen ? "text-violet-700" : "text-slate-700"}`}>
                          {rec.text}
                        </p>
                        <span className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                          <I.ChevronDown />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
            {/* ━━━ AI NEXT STEPS ━━━ */}
                <div className="bg-white rounded-3xl shadow-xl shadow-violet-100 border border-violet-100 overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white">
                        <I.Rocket />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-800">Next Steps</h3>
                        <p className="text-xs text-slate-400">Exactly 5 action items</p>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {nextSteps.map((step, idx) => {
                        const checked = checkedSteps.has(idx);
                        return (
                          <button
                            key={idx}
                            onClick={() => toggleStep(idx)}
                            className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 flex items-start gap-3 ${
                              checked
                                ? "border-emerald-200 bg-emerald-50"
                                : "border-slate-100 hover:border-violet-200 hover:bg-violet-50/30"
                            }`}
                          >
                            <div className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                              checked
                                ? "border-emerald-500 bg-emerald-500"
                                : "border-slate-300"
                            }`}>
                              {checked && (
                                <svg fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3} className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="text-[11px] font-bold text-violet-500 uppercase tracking-wider">Step {idx + 1}</span>
                              <p className={`text-sm font-medium mt-0.5 leading-relaxed transition-all ${
                                checked ? "text-slate-400 line-through" : "text-slate-700"
                              }`}>
                                {step}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400">Progress</span>
                        <span className="text-xs font-bold text-violet-600">{checkedSteps.size}/5 completed</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                          style={{ width: `${(checkedSteps.size / 5) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pb-2">
              <Link href="/form"
                className="py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-center hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <I.ChevronLeft /> Edit Profile
              </Link>
              <button onClick={() => window.print()}
                className="py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold shadow-lg shadow-violet-200 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <I.Printer /> Save Report
              </button>
            </div>
          </aside>
        </div>

      </div>
    </div>
  );
}