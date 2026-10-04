"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity, ArrowUpRight, CalendarCheck2, Check, Clock3, CreditCard, FileText, LayoutDashboard, Video } from "lucide-react";
import { doctors, type DemoAppointment } from "@/lib/demo-data";

type AppointmentView = Omit<DemoAppointment, "start"> & { start: string };

export function DashboardView({ role, initialAppointments }: { role: "patient" | "doctor"; initialAppointments: AppointmentView[] }) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const active = useMemo(() => appointments.filter((item) => item.status !== "completed"), [appointments]);
  const history = appointments.filter((item) => item.status === "completed");
  const title = role === "patient" ? "Your care, in one place." : "Good morning, doctor.";
  const changeStatus = (id: string, status: AppointmentView["status"]) => setAppointments((items) => items.map((item) => item.id === id ? { ...item, status } : item));

  return (
    <div className="container dashboard-shell">
      <aside className="dashboard-sidebar"><h3>Carewell space</h3><Link className="side-link active" href={role === "patient" ? "/dashboard/patient" : "/dashboard/doctor"}><LayoutDashboard size={14} /> Overview</Link><a className="side-link" href="#appointments"><CalendarCheck2 size={14} /> Appointments</a><a className="side-link" href="#history"><Activity size={14} /> Visit history</a><a className="side-link" href="#payments"><CreditCard size={14} /> Payments</a><Link className="side-link" href="/doctors"><ArrowUpRight size={14} /> Find a doctor</Link><div style={{ margin: "14px 5px 3px", borderRadius: 12, padding: 11, color: "#7c6a40", background: "#fff8e8", fontSize: 9, lineHeight: 1.6 }}>Demo dashboard<br />Changes are local to this preview.</div></aside>
      <section className="dashboard-main">
        <div className="dashboard-top"><div><span className="eyebrow">{role === "patient" ? "Patient dashboard" : "Doctor dashboard"}</span><h1 style={{ marginTop: 8 }}>{title}</h1><p>{role === "patient" ? "A calm place to see what’s next and revisit past conversations." : "Keep appointments and patient follow-ups easy to navigate."}</p></div><Link className="btn btn-primary btn-sm" href={role === "patient" ? "/doctors" : "/consultation/appt-cw-1042"}>{role === "patient" ? "Find a doctor" : "Open consultation"} <ArrowUpRight size={13} /></Link></div>
        <div className="summary-grid"><div className="summary-card"><span>Upcoming visits</span><strong>{active.length}</strong></div><div className="summary-card"><span>Completed visits</span><strong>{history.length}</strong></div><div className="summary-card" id="payments"><span>Payment status</span><strong style={{ fontSize: 14, color: "#078577" }}>Demo-held</strong></div></div>
        <div id="appointments" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "23px 0 12px" }}><h2 style={{ margin: 0, color: "#0f172a", fontSize: 15 }}>Upcoming appointments</h2><span className="demo-note">Demo data</span></div>
        <div className="appointment-list">{active.map((appointment) => {
          const doctor = doctors.find((item) => item.id === appointment.doctorId) ?? doctors[0];
          const date = new Date(appointment.start);
          return <article key={appointment.id} className="appointment-card"><div className="appointment-person"><div className={`person-avatar ${doctor.tone === "blue" ? "" : doctor.tone}`} style={{ width: 45, height: 45, borderRadius: 14, fontSize: 12 }}>{role === "patient" ? doctor.initials : appointment.patient.slice(0, 1)}</div><div><h3>{role === "patient" ? doctor.name : appointment.patient}</h3><p>{role === "patient" ? `${doctor.specialty} · ` : `${doctor.name} · `}{date.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })} at {date.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}</p></div></div><div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}><span className={`status-tag ${appointment.status === "pending" ? "pending" : ""}`}><Check size={10} /> {appointment.status === "pending" ? "Awaiting confirmation" : "Confirmed"}</span><span className="status-tag" style={{ color: "#697c87", background: "#f1f5f6" }}>{appointment.payment}</span>{appointment.type === "video" ? <Link href={`/consultation/${appointment.id}`} className="btn btn-primary btn-sm"><Video size={13} /> Join room</Link> : role === "doctor" ? <button className="btn btn-outline btn-sm" onClick={() => changeStatus(appointment.id, "confirmed")}>Confirm</button> : <button className="btn btn-outline btn-sm" onClick={() => changeStatus(appointment.id, "confirmed")}>View details</button>}</div></article>;
        })}{active.length === 0 && <div className="clinical-card" style={{ color: "#83939d", fontSize: 11 }}>No upcoming appointments in this demo yet. <Link href="/doctors" style={{ color: "#0787c2" }}>Find a doctor</Link>.</div>}</div>
        <div id="history" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "27px 0 12px" }}><h2 style={{ margin: 0, color: "#0f172a", fontSize: 15 }}>Recent visit history</h2><span style={{ color: "#8c9aa3", fontSize: 9 }}>Clinical record access is not connected</span></div>
        <div className="appointment-list">{history.map((appointment) => { const doctor = doctors.find((item) => item.id === appointment.doctorId) ?? doctors[0]; const date = new Date(appointment.start); return <article key={appointment.id} className="appointment-card"><div className="appointment-person"><div className="person-avatar" style={{ width: 42, height: 42, borderRadius: 13, fontSize: 11 }}>{doctor.initials}</div><div><h3>{doctor.name} · {doctor.specialty}</h3><p>{date.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })} · {appointment.type === "video" ? "Video visit" : "In-clinic"}</p></div></div><Link className="btn btn-outline btn-sm" href={`/consultation/${appointment.id}`}><FileText size={13} /> Visit summary</Link></article>; })}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 17, color: "#8a9aa3", fontSize: 9 }}><Clock3 size={12} /> Appointment and payment changes in this preview are illustrative and aren’t saved to a production record.</div>
      </section>
    </div>
  );
}
