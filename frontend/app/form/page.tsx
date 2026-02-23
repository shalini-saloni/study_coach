"use client";

import { useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const StepIcons = {
  Personal: () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
    </svg>
  ),
  Family: () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
    </svg>
  ),
  Academic: () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
    </svg>
  ),
  Lifestyle: () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
    </svg>
  ),
  Check: () => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
    </svg>
  ),
};

const steps = [
  { id: 1, label: "Personal",  Icon: StepIcons.Personal  },
  { id: 2, label: "Family",    Icon: StepIcons.Family    },
  { id: 3, label: "Academic",  Icon: StepIcons.Academic  },
  { id: 4, label: "Lifestyle", Icon: StepIcons.Lifestyle },
];

const SelectField = ({
  name, value, options, onChange,
}: {
  name: string;
  value: string | number;
  options: { value: string | number; label: string }[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) => (
  <div className="relative">
    <select name={name} value={value} onChange={onChange}
      className="w-full appearance-none px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:border-violet-500 transition-all cursor-pointer pr-10"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
      </svg>
    </div>
  </div>
);

const RangeSlider = ({
  name, value, min, max, onChange, labels,
}: {
  name: string; value: number; min: number; max: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  labels?: string[];
}) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-slate-400 font-medium">
        {labels
          ? labels.map((l, i) => <span key={i}>{l}</span>)
          : Array.from({ length: max - min + 1 }, (_, i) => <span key={i}>{min + i}</span>)
        }
      </div>
      <div className="relative h-3">
        <div className="absolute inset-0 rounded-full bg-slate-200"/>
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
          style={{ width: `${pct}%` }}/>
        <input type="range" name={name} value={value} min={min} max={max} onChange={onChange}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-3"/>
        <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-violet-500 shadow-md pointer-events-none transition-all"
          style={{ left: `calc(${pct}% - 10px)` }}/>
      </div>
      <div className="text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-sm font-bold">{value}</span>
      </div>
    </div>
  );
};

const ToggleSwitch = ({
  name, value, label, onChange,
}: {
  name: string; value: string; label: string;
  onChange: (name: string, val: string) => void;
}) => {
  const on = value === "yes";
  return (
    <button type="button" onClick={() => onChange(name, on ? "no" : "yes")}
      className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm ${
        on ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
      }`}
    >
      <span>{label}</span>
      <div className={`relative w-12 h-6 rounded-full transition-all ${on ? "bg-violet-500" : "bg-slate-300"}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? "left-7" : "left-1"}`}/>
      </div>
    </button>
  );
};

// Two-option card picker
const CardPicker = ({
  value, options, onPick,
}: {
  value: string;
  options: { v: string; label: string; Icon: () => JSX.Element }[];
  onPick: (v: string) => void;
}) => (
  <div className="grid grid-cols-2 gap-3">
    {options.map(o => (
      <button type="button" key={o.v} onClick={() => onPick(o.v)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-semibold transition-all text-sm ${
          value === o.v ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
        }`}
      >
        <span className={value === o.v ? "text-violet-500" : "text-slate-400"}><o.Icon /></span>
        {o.label}
      </button>
    ))}
  </div>
);

const label = "block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2";

export default function StudentForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    school: "GP", sex: "F", age: 17, address: "U",
    famsize: "GT3", Pstatus: "T", Medu: 2, Fedu: 2,
    Mjob: "other", Fjob: "other", reason: "course", guardian: "mother",
    traveltime: 1, studytime: 2, failures: 0,
    schoolsup: "no", famsup: "yes", paid: "no", activities: "no",
    nursery: "yes", higher: "yes", internet: "yes", romantic: "no",
    famrel: 4, freetime: 3, goout: 2, Dalc: 1, Walc: 1, health: 3,
    absences: 0, subject: "math",
  });

  const numFields = ["age","Medu","Fedu","traveltime","studytime","failures","famrel","freetime","goout","Dalc","Walc","health","absences"];

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: numFields.includes(name) ? parseInt(value) : value }));
  };
  const onRange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [e.target.name]: parseInt(e.target.value) }));
  };
  const onToggle = (name: string, val: string) => setForm(p => ({ ...p, [name]: val }));
  const onPick = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/predict", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = res.ok ? await res.json() : null;
      sessionStorage.setItem("studentData", JSON.stringify(form));
      if (json) sessionStorage.setItem("prediction", JSON.stringify(json));
      else sessionStorage.removeItem("prediction");
    } catch {
      sessionStorage.setItem("studentData", JSON.stringify(form));
    }
    router.push("/recommendations");
  };

  const GenderFemale = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 0v9m-3-3h6"/></svg>;
  const GenderMale   = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><circle cx="10" cy="14" r="5"/><path strokeLinecap="round" strokeLinejoin="round" d="M19 5l-5 5m0 0V7m0 3h3"/></svg>;
  const CityIcon     = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>;
  const RuralIcon    = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>;
  const TogetherIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>;
  const ApartIcon    = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-fuchsia-50 py-10 px-4">

      {/* Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block">
          <span className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">
            LearnScope.ai
          </span>
        </Link>
        <p className="mt-2 text-slate-400 text-sm font-medium">Complete your profile to unlock personalized recommendations</p>
      </div>

      {/* Step progress */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 z-0"/>
          <div className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 z-0 transition-all duration-500"
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}/>
          {steps.map(s => (
            <button type="button" key={s.id} onClick={() => setStep(s.id)}
              className="relative z-10 flex flex-col items-center gap-1.5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                step >= s.id
                  ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-200 scale-110 text-white"
                  : "bg-white border-2 border-slate-200 text-slate-400"
              }`}>
                {step > s.id ? <StepIcons.Check /> : <s.Icon />}
              </div>
              <span className={`text-xs font-bold transition-all ${step >= s.id ? "text-violet-600" : "text-slate-400"}`}>
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl shadow-violet-100 border border-violet-100 overflow-hidden">

          {step === 1 && (
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Personal Information</h2>
                <p className="text-slate-400 text-sm mt-1">Tell us a bit about yourself</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className={label}>School</label>
                  <SelectField name="school" value={form.school} onChange={onChange} options={[
                    { value: "GP", label: "Gabriel Pereira" },
                    { value: "MS", label: "Mousinho da Silveira" },
                  ]}/>
                </div>
                <div><label className={label}>Subject</label>
                  <SelectField name="subject" value={form.subject} onChange={onChange} options={[
                    { value: "math",       label: "Mathematics" },
                    { value: "portuguese", label: "Portuguese"  },
                  ]}/>
                </div>
              </div>

              <div>
                <label className={label}>Gender</label>
                <CardPicker value={form.sex} onPick={v => onPick("sex", v)} options={[
                  { v: "F", label: "Female", Icon: GenderFemale },
                  { v: "M", label: "Male",   Icon: GenderMale   },
                ]}/>
              </div>

              <div>
                <label className={label}>Age: {form.age} years old</label>
                <RangeSlider name="age" value={form.age} min={15} max={22} onChange={onRange}/>
              </div>

              <div>
                <label className={label}>Address Type</label>
                <CardPicker value={form.address} onPick={v => onPick("address", v)} options={[
                  { v: "U", label: "Urban", Icon: CityIcon  },
                  { v: "R", label: "Rural", Icon: RuralIcon },
                ]}/>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Family Background</h2>
                <p className="text-slate-400 text-sm mt-1">Your home and family environment</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className={label}>Family Size</label>
                  <SelectField name="famsize" value={form.famsize} onChange={onChange} options={[
                    { value: "LE3", label: "≤ 3 members" },
                    { value: "GT3", label: "> 3 members" },
                  ]}/>
                </div>
                <div><label className={label}>Parent Status</label>
                  <CardPicker value={form.Pstatus} onPick={v => onPick("Pstatus", v)} options={[
                    { v: "T", label: "Together", Icon: TogetherIcon },
                    { v: "A", label: "Apart",    Icon: ApartIcon    },
                  ]}/>
                </div>
              </div>

              <div>
                <label className={label}>Mother's Education Level</label>
                <RangeSlider name="Medu" value={form.Medu} min={0} max={4} onChange={onRange}
                  labels={["None","4th gr.","9th gr.","Secondary","Higher"]}/>
              </div>

              <div>
                <label className={label}>Father's Education Level</label>
                <RangeSlider name="Fedu" value={form.Fedu} min={0} max={4} onChange={onRange}
                  labels={["None","4th gr.","9th gr.","Secondary","Higher"]}/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className={label}>Mother's Job</label>
                  <SelectField name="Mjob" value={form.Mjob} onChange={onChange} options={[
                    { value: "teacher",  label: "Teacher"  },
                    { value: "health",   label: "Health"   },
                    { value: "services", label: "Services" },
                    { value: "at_home",  label: "At Home"  },
                    { value: "other",    label: "Other"    },
                  ]}/>
                </div>
                <div><label className={label}>Father's Job</label>
                  <SelectField name="Fjob" value={form.Fjob} onChange={onChange} options={[
                    { value: "teacher",  label: "Teacher"  },
                    { value: "health",   label: "Health"   },
                    { value: "services", label: "Services" },
                    { value: "at_home",  label: "At Home"  },
                    { value: "other",    label: "Other"    },
                  ]}/>
                </div>
              </div>

              <div><label className={label}>Guardian</label>
                <SelectField name="guardian" value={form.guardian} onChange={onChange} options={[
                  { value: "mother", label: "Mother" },
                  { value: "father", label: "Father" },
                  { value: "other",  label: "Other"  },
                ]}/>
              </div>

              <div>
                <label className={label}>Family Relationship Quality</label>
                <RangeSlider name="famrel" value={form.famrel} min={1} max={5} onChange={onRange}
                  labels={["Very Poor","Poor","Average","Good","Excellent"]}/>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Academic Profile</h2>
                <p className="text-slate-400 text-sm mt-1">Your study habits and school performance</p>
              </div>

              <div><label className={label}>Reason for Choosing School</label>
                <SelectField name="reason" value={form.reason} onChange={onChange} options={[
                  { value: "course",     label: "Course Preference"  },
                  { value: "reputation", label: "School Reputation"  },
                  { value: "home",       label: "Close to Home"      },
                  { value: "other",      label: "Other"              },
                ]}/>
              </div>

              <div>
                <label className={label}>Weekly Study Time</label>
                <RangeSlider name="studytime" value={form.studytime} min={1} max={4} onChange={onRange}
                  labels={["< 2 hrs","2–5 hrs","5–10 hrs","> 10 hrs"]}/>
              </div>

              <div>
                <label className={label}>Travel Time to School</label>
                <RangeSlider name="traveltime" value={form.traveltime} min={1} max={4} onChange={onRange}
                  labels={["< 15 min","15–30 min","30–60 min","> 1 hr"]}/>
              </div>

              <div>
                <label className={label}>Past Class Failures</label>
                <RangeSlider name="failures" value={form.failures} min={0} max={4} onChange={onRange}/>
              </div>

              <div>
                <label className={label}>Number of Absences: {form.absences} days</label>
                <div className="flex items-center gap-4">
                  <input type="number" name="absences" value={form.absences} onChange={onChange}
                    min={0} max={93}
                    className="w-28 px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-800 font-bold text-lg focus:outline-none focus:border-violet-500 text-center"/>
                  <span className="text-slate-400 text-sm">days missed this year</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className={label}>Support & Activities</label>
                <ToggleSwitch name="schoolsup"  value={form.schoolsup}  label="Extra educational support at school" onChange={onToggle}/>
                <ToggleSwitch name="famsup"     value={form.famsup}     label="Family educational support"         onChange={onToggle}/>
                <ToggleSwitch name="paid"       value={form.paid}       label="Extra paid tutoring classes"         onChange={onToggle}/>
                <ToggleSwitch name="activities" value={form.activities} label="Extracurricular activities"          onChange={onToggle}/>
                <ToggleSwitch name="higher"     value={form.higher}     label="Wants to pursue higher education"    onChange={onToggle}/>
                <ToggleSwitch name="internet"   value={form.internet}   label="Internet access at home"             onChange={onToggle}/>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800">Lifestyle & Wellbeing</h2>
                <p className="text-slate-400 text-sm mt-1">Your social life and health habits</p>
              </div>

              <div>
                <label className={label}>Free Time Quality</label>
                <RangeSlider name="freetime" value={form.freetime} min={1} max={5} onChange={onRange}
                  labels={["Very Low","Low","Medium","High","Very High"]}/>
              </div>

              <div>
                <label className={label}>Going Out with Friends</label>
                <RangeSlider name="goout" value={form.goout} min={1} max={5} onChange={onRange}
                  labels={["Rarely","Sometimes","Often","Frequently","Always"]}/>
              </div>

              <div>
                <label className={label}>Workday Alcohol Consumption</label>
                <RangeSlider name="Dalc" value={form.Dalc} min={1} max={5} onChange={onRange}
                  labels={["None","Low","Moderate","High","Very High"]}/>
              </div>

              <div>
                <label className={label}>Weekend Alcohol Consumption</label>
                <RangeSlider name="Walc" value={form.Walc} min={1} max={5} onChange={onRange}
                  labels={["None","Low","Moderate","High","Very High"]}/>
              </div>

              <div>
                <label className={label}>Overall Health Status</label>
                <RangeSlider name="health" value={form.health} min={1} max={5} onChange={onRange}
                  labels={["Very Poor","Poor","Fair","Good","Excellent"]}/>
              </div>

              <div className="space-y-3">
                <label className={label}>Other Details</label>
                <ToggleSwitch name="nursery"  value={form.nursery}  label="Attended nursery school"      onChange={onToggle}/>
                <ToggleSwitch name="romantic" value={form.romantic} label="In a romantic relationship"   onChange={onToggle}/>
              </div>
            </div>
          )}

          <div className="px-8 pb-8 flex gap-3">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="flex-1 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
                Back
              </button>
            ) : (
              <Link href="/"
                className="flex-1 py-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all text-center flex items-center justify-center gap-2">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
                Home
              </Link>
            )}

            {step < 4 ? (
              <button type="button" onClick={() => setStep(s => s + 1)}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold shadow-lg shadow-violet-200 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                Continue
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            ) : (
              <button type="submit" disabled={submitting}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold shadow-lg shadow-violet-200 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    Analyzing…
                  </>
                ) : (
                  <>
                    Get My Recommendations
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-slate-400 text-sm mt-4">Step {step} of {steps.length}</p>
      </form>
    </div>
  );
}