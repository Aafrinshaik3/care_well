"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, CreditCard, LoaderCircle, ShieldCheck, Video, X } from "lucide-react";
import type { Doctor } from "@/lib/demo-data";

type Slot = { start: string; end: string; localStart: string; localEnd: string; status: "available" | "booked" };
type ConsultationMode = Doctor["modes"][number];
function localDateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function dateOptions() {
  return Array.from({ length: 6 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() + index + 1); return { key: localDateKey(date), day: date.toLocaleDateString("en", { weekday: "short" }), label: date.toLocaleDateString("en", { day: "numeric", month: "short" }) }; });
}

export function BookingWidget({ doctorId, fee, supportedModes }: { doctorId: string; fee: number; supportedModes: Doctor["modes"] }) {
  const dates = useMemo(dateOptions, []);
  const [selectedDate, setSelectedDate] = useState(dates[0].key);
  const [mode, setMode] = useState<ConsultationMode>(supportedModes.includes("video") ? "video" : "clinic");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);
  const [heldMessage, setHeldMessage] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true); setSelectedSlot(null); setHeldMessage(""); setPaymentOpen(false); setBookingConfirmed(false); setError("");
    fetch(`/api/v1/doctors/${encodeURIComponent(doctorId)}/slots?date=${selectedDate}&timezone=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC")}`)
      .then(async (response) => { if (!response.ok) throw new Error("Slots unavailable"); return response.json() as Promise<{ slots: Slot[] }>; })
      .then((data) => { if (active) setSlots(data.slots); })
      .catch(() => { if (active) setSlots([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [doctorId, selectedDate]);

  async function holdSlot() {
    if (!selectedSlot) return;
    setHolding(true); setError(""); setHeldMessage(""); setBookingConfirmed(false);
    try {
      const response = await fetch("/api/v1/appointments/hold", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doctorId, startTime: selectedSlot.start, date: selectedDate, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", type: mode === "clinic" ? "in_clinic" : "video" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We could not hold this time. Choose another slot.");
      setHeldMessage(`Your time is held for 5 minutes${data.demo ? " in this demo" : ""}. No payment was processed.`);
      setPaymentOpen(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Please try another time."); }
    finally { setHolding(false); }
  }

  function chooseMode(next: "video" | "clinic") {
    setMode(next); setHeldMessage(""); setPaymentOpen(false); setBookingConfirmed(false);
  }

  function confirmDemoBooking() {
    setBookingConfirmed(true);
    setHeldMessage("Demo appointment confirmed. No payment was processed.");
    setPaymentOpen(false);
  }

  return (
    <aside className="booking-panel">
      <h2>Choose a time</h2><p>Pick a visit style, then select an available appointment.</p>
      <div className="mode-switch" style={{ gridTemplateColumns: supportedModes.length > 1 ? "1fr 1fr" : "1fr" }}>{supportedModes.includes("video") && <button type="button" className={mode === "video" ? "selected" : ""} onClick={() => chooseMode("video")}><Video size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} /> Video visit</button>}{supportedModes.includes("clinic") && <button type="button" className={mode === "clinic" ? "selected" : ""} onClick={() => chooseMode("clinic")}>In-clinic</button>}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 18, color: "#82929d", fontSize: 9 }}><CalendarDays size={13} /> Upcoming dates</div>
      <div className="slot-dates">{dates.map((date) => <button type="button" key={date.key} className={`slot-date ${date.key === selectedDate ? "active" : ""}`} onClick={() => setSelectedDate(date.key)}><strong>{date.day}</strong><small>{date.label}</small></button>)}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9, color: "#82929d", fontSize: 9 }}><Clock3 size={13} /> Available times · your local timezone</div>
      {loading ? <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "18px 4px", color: "#82929d", fontSize: 10 }}><LoaderCircle size={14} className="animate-spin" /> Finding open times…</div> : <div className="slot-grid">{slots.map((slot) => <button type="button" key={`${slot.start}-${slot.status}`} className={`slot-button ${slot.status === "booked" ? "booked" : ""} ${selectedSlot?.start === slot.start ? "selected" : ""}`} disabled={slot.status === "booked"} onClick={() => { setSelectedSlot(slot); setHeldMessage(""); setBookingConfirmed(false); }} aria-label={`${slot.localStart} ${slot.status}`}>{slot.localStart}</button>)}</div>}
      {!loading && slots.length === 0 && <p style={{ color: "#81919b", fontSize: 10 }}>No openings on this date. Try another day.</p>}
      <div className="booking-summary"><span>Consultation fee</span><strong>₹{fee}</strong></div>
      {heldMessage ? <div role="status" style={{ display: "flex", gap: 8, marginBottom: 13, borderRadius: 12, padding: 12, color: "#117766", background: "#e8f7f2", fontSize: 10, lineHeight: 1.5 }}><CheckCircle2 size={15} style={{ flex: "none" }} />{heldMessage}</div> : null}
      {error ? <p role="alert" style={{ margin: "0 0 12px", color: "#b44d4d", fontSize: 10 }}>{error}</p> : null}
      <button type="button" className="btn btn-primary" style={{ width: "100%" }} disabled={!selectedSlot || holding || loading || bookingConfirmed} onClick={() => { if (heldMessage && !bookingConfirmed) setPaymentOpen(true); else void holdSlot(); }}>{holding ? <LoaderCircle size={15} className="animate-spin" /> : bookingConfirmed ? <CheckCircle2 size={15} /> : <CreditCard size={15} />}{holding ? "Holding your time…" : bookingConfirmed ? "Demo booking confirmed" : heldMessage ? "Review demo checkout" : "Continue to demo checkout"}</button>
      <p style={{ margin: "10px 0 0", textAlign: "center", color: "#99a5ac", fontSize: 8 }}>Demo flow only · no card details collected or charged.</p>

      {paymentOpen && <div className="checkout-backdrop" role="presentation"><section className="checkout-drawer" role="dialog" aria-modal="true" aria-labelledby="checkout-title"><div className="checkout-top"><div><span className="eyebrow">Secure checkout preview</span><h2 id="checkout-title">Review your visit</h2></div><button type="button" className="checkout-close" onClick={() => setPaymentOpen(false)} aria-label="Close checkout drawer"><X size={17} /></button></div><div className="checkout-detail"><span>Appointment</span><strong>{selectedSlot ? `${selectedSlot.localStart} · ${new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}` : "Choose an available time"}</strong></div><div className="checkout-detail"><span>Visit type</span><strong>{mode === "video" ? "Video consultation" : "In-clinic consultation"}</strong></div><div className="checkout-total"><span>Consultation fee</span><strong>₹{fee}</strong></div><div className="checkout-safety"><ShieldCheck size={16} /><span>This is a demo checkout. No card or payment credentials are requested, and no charge will be made.</span></div><p className="checkout-hold"><Clock3 size={13} />{heldMessage}</p><button type="button" className="btn btn-primary" style={{ width: "100%" }} disabled={!heldMessage} onClick={confirmDemoBooking}>Confirm demo appointment</button><button type="button" className="checkout-cancel" onClick={() => setPaymentOpen(false)}>Back to available times</button></section></div>}
    </aside>
  );
}
