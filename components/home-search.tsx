"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, Search, Stethoscope } from "lucide-react";

export function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (specialty) params.set("specialty", specialty);
    router.push(`/doctors${params.size ? `?${params.toString()}` : ""}`);
  }
  return (
    <form className="hero-search" onSubmit={submit}>
      <div className="search-field"><Search size={17} /><div><label htmlFor="doctor-search">I’m looking for</label><input id="doctor-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Doctor, clinic, or symptom" /></div></div>
      <div className="search-field"><Stethoscope size={17} /><div><label htmlFor="specialty-search">Specialty</label><select id="specialty-search" value={specialty} onChange={(event) => setSpecialty(event.target.value)}><option value="">All specialties</option><option>Cardiology</option><option>Dermatology</option><option>Pediatrics</option><option>Psychiatry</option><option>Orthopedics</option><option>General physician</option></select></div></div>
      <button className="btn btn-primary" type="submit">Find care <ArrowRight size={15} /></button>
    </form>
  );
}
