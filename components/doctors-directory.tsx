"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Star } from "lucide-react";
import { doctors } from "@/lib/demo-data";
import { DoctorCard } from "@/components/doctor-card";

const specialtyRoots: Record<string, string> = {
  Cardiology: "cardiolog",
  Dermatology: "dermatolog",
  "General physician": "general physician",
  Pediatrics: "pediatric",
  Psychiatry: "psychiatr",
  Orthopedics: "orthopedic",
};

function specialtyMatches(doctorSpecialty: string, selected: string) {
  const root = specialtyRoots[selected] ?? selected.toLowerCase();
  return doctorSpecialty.toLowerCase().includes(root);
}

export function DoctorsDirectory({ initialQuery = "", initialSpecialty = "" }: { initialQuery?: string; initialSpecialty?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [maxFee, setMaxFee] = useState(1500);
  const [highRating, setHighRating] = useState(false);
  const [videoOnly, setVideoOnly] = useState(false);
  const visible = useMemo(() => doctors.filter((doctor) => {
    const q = query.trim().toLowerCase();
    return (!q || `${doctor.name} ${doctor.specialty} ${doctor.location}`.toLowerCase().includes(q))
      && (!specialty || specialtyMatches(doctor.specialty, specialty))
      && doctor.fee <= maxFee
      && (!highRating || doctor.rating >= 4.8)
      && (!videoOnly || doctor.modes.includes("video"));
  }), [query, specialty, maxFee, highRating, videoOnly]);

  return (
    <div className="container directory-layout">
      <aside className="filters-panel">
        <h3><SlidersHorizontal size={15} style={{ verticalAlign: "-3px", marginRight: 7 }} /> Refine your search</h3>
        <div className="filter-group"><h4>Specialty</h4><label className="filter-choice"><input type="radio" name="specialty" checked={!specialty} onChange={() => setSpecialty("")} /> All specialties</label>{["Cardiology", "Dermatology", "General physician", "Pediatrics", "Psychiatry", "Orthopedics"].map((name) => <label className="filter-choice" key={name}><input type="radio" name="specialty" checked={specialty === name} onChange={() => setSpecialty(name)} /> {name}</label>)}</div>
        <div className="filter-group"><h4>Consultation fee · up to ₹{maxFee}</h4><input aria-label="Maximum consultation fee" type="range" min="500" max="1500" step="50" value={maxFee} onChange={(event) => setMaxFee(Number(event.target.value))} style={{ width: "100%", accentColor: "#0ea5e9" }} /><div style={{ display: "flex", justifyContent: "space-between", color: "#93a1a9", fontSize: 9 }}><span>₹500</span><span>₹1,500</span></div></div>
        <div className="filter-group"><h4>Patient ratings</h4><label className="filter-choice"><input type="checkbox" checked={highRating} onChange={(event) => setHighRating(event.target.checked)} /><Star size={12} fill="#e6ad47" color="#e6ad47" /> 4.8 and above</label></div>
        <div className="filter-group"><h4>Visit style</h4><label className="filter-choice"><input type="checkbox" checked={videoOnly} onChange={(event) => setVideoOnly(event.target.checked)} /> Online consultation</label></div>
      </aside>
      <section aria-label="Doctor results">
        <div className="directory-tools"><div className="directory-search"><Search size={16} color="#9aa8af" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search doctors, specialties, or location" aria-label="Search doctors" /></div><span style={{ color: "#81919a", fontSize: 10, whiteSpace: "nowrap" }}>{visible.length} doctors</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 15, flexWrap: "wrap" }}><span style={{ color: "#81919a", fontSize: 10 }}>Popular:</span>{["Cardiology", "Dermatology", "Pediatrics"].map((label) => <button key={label} type="button" onClick={() => setSpecialty(specialty === label ? "" : label)} style={{ border: "1px solid #e4edf0", borderRadius: 99, padding: "6px 10px", color: specialty === label ? "#0787c2" : "#71828d", background: specialty === label ? "#eaf9fd" : "white", fontSize: 9 }}>{label}</button>)}</div>
        {visible.length ? <div className="results-list">{visible.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)}</div> : <div className="clinical-card" style={{ textAlign: "center", padding: 36 }}><h3>No doctors match those filters</h3><p style={{ color: "#81919b", fontSize: 11 }}>Try another specialty or expand the fee range.</p><button className="btn btn-outline btn-sm" onClick={() => { setQuery(""); setSpecialty(""); setMaxFee(1500); setHighRating(false); setVideoOnly(false); }}>Clear filters</button></div>}
      </section>
    </div>
  );
}
