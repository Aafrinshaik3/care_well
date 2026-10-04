import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard-view";
import { getDemoAppointments } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Patient dashboard" };
export default function PatientDashboardPage() {
  const appointments = getDemoAppointments().map((item) => ({ ...item, start: item.start.toISOString() }));
  return <><section className="page-hero" style={{ paddingBottom: 14 }}><div className="container"><span className="eyebrow">Your Carewell space</span></div></section><DashboardView role="patient" initialAppointments={appointments} /></>;
}
