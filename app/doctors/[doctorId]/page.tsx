import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Award, BadgeCheck, CalendarDays, Clock3, Languages, MapPin, ShieldCheck, Star, Video } from "lucide-react";
import { doctors } from "@/lib/demo-data";
import { BookingWidget } from "@/components/booking-widget";

type Params = Promise<{ doctorId: string }>;
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> { const { doctorId } = await params; const doctor = doctors.find((item) => item.id === doctorId); return { title: doctor ? `${doctor.name} · ${doctor.specialty}` : "Doctor not found" }; }

export default async function DoctorProfilePage({ params }: { params: Params }) {
  const { doctorId } = await params;
  const doctor = doctors.find((item) => item.id === doctorId);
  if (!doctor) notFound();
  return <>
    <section className="page-hero"><div className="container"><Link href="/doctors" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#70838e", fontSize: 10, fontWeight: 700 }}><ArrowLeft size={13} /> All doctors</Link><div style={{ marginTop: 22 }}><span className="eyebrow">Verified Carewell profile</span></div></div></section>
    <div className="container profile-layout">
      <div>
        <section className="profile-card">
          <div className="profile-head"><div className={`person-avatar ${doctor.tone === "blue" ? "" : doctor.tone}`}>{doctor.initials}</div><div><h1>{doctor.name}</h1><p>{doctor.specialty} · {doctor.credential}</p><div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 9, color: "#96701b", fontSize: 10 }}><Star size={12} fill="currentColor" /> {doctor.rating.toFixed(1)} <span style={{ color: "#8898a2" }}>({doctor.reviews} reviews)</span><BadgeCheck size={13} color="#0d9ac7" /></div></div></div>
          <p className="profile-copy">{doctor.bio}</p>
          <div className="profile-stats"><div><strong>{doctor.experience} years</strong><span>Experience</span></div><div><strong>98%</strong><span>Patient satisfaction</span></div><div><strong>15 min</strong><span>Visit duration</span></div></div>
          <h2 style={{ margin: "23px 0 12px", color: "#0f172a", fontSize: 14 }}>About this doctor</h2><p style={{ margin: 0, color: "#71838e", fontSize: 11, lineHeight: 1.8 }}>{doctor.bio} Patients can meet online or at the clinic, and leave with clear next steps.</p>
          <div style={{ display: "grid", gap: 12, marginTop: 22 }}><div style={{ display: "flex", gap: 10, color: "#748691", fontSize: 10 }}><MapPin size={14} color="#0ea5e9" /> {doctor.location}</div><div style={{ display: "flex", gap: 10, color: "#748691", fontSize: 10 }}><Languages size={14} color="#0ea5e9" /> {doctor.languages.join(", ")}</div><div style={{ display: "flex", gap: 10, color: "#748691", fontSize: 10 }}><Award size={14} color="#0ea5e9" /> {doctor.credential} · {doctor.experience} years of experience</div><div style={{ display: "flex", gap: 10, color: "#748691", fontSize: 10 }}><Clock3 size={14} color="#0ea5e9" /> Typical appointment: 15 minutes</div></div>
        </section>
        <div style={{ display: "flex", gap: 8, marginTop: 15, border: "1px solid #e5eef1", borderRadius: 16, padding: 15, color: "#6f838e", background: "#f9fcfd", fontSize: 9, lineHeight: 1.6 }}><ShieldCheck size={17} color="#109782" style={{ flex: "none" }} />Profile details in this demo are illustrative. Clinical credentials and provider identity must be independently verified before real-world use.</div>
      </div>
      <BookingWidget doctorId={doctor.id} fee={doctor.fee} supportedModes={doctor.modes} />
    </div>
  </>;
}
