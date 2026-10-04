import type { Metadata } from "next";
import { TelehealthRoom } from "@/components/telehealth-room";

type Params = Promise<{ appointmentId: string }>;
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> { const { appointmentId } = await params; return { title: `Consultation ${appointmentId}` }; }
export default async function ConsultationPage({ params }: { params: Params }) { const { appointmentId } = await params; return <TelehealthRoom appointmentId={appointmentId} />; }
