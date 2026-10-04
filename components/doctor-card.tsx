import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin, Star, Video } from "lucide-react";
import type { Doctor } from "@/lib/demo-data";

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <article className="doctor-card">
      <div className="doctor-card-top">
        <div className={`person-avatar ${doctor.tone === "blue" ? "" : doctor.tone}`}>{doctor.initials}</div>
        <span className="rating-pill"><Star size={11} fill="currentColor" /> {doctor.rating.toFixed(1)} <span style={{ color: "#b69a66", fontWeight: 500 }}>({doctor.reviews})</span></span>
      </div>
      <h3>{doctor.name}</h3>
      <div className="doctor-specialty">{doctor.specialty} <span aria-hidden="true">·</span> {doctor.credential}</div>
      <div className="doctor-facts"><span><Clock3 size={12} /> {doctor.experience} years experience</span><span><Video size={12} /> {doctor.modes.map((mode) => mode === "video" ? "Video" : "In-clinic").join(" · ")}</span></div>
      <div className="doctor-facts"><span><MapPin size={12} /> {doctor.location}</span></div>
      <div className="doctor-card-bottom">
        <div className="doctor-price">₹{doctor.fee}<small>per consultation</small></div>
        <Link href={`/doctors/${doctor.id}`} className="btn btn-outline btn-sm">View & book <ArrowUpRight size={13} /></Link>
      </div>
    </article>
  );
}
