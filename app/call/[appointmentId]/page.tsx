import { redirect } from "next/navigation";

type Params = Promise<{ appointmentId: string }>;

export default async function AppointmentCallLink({ params }: { params: Params }) {
  const { appointmentId } = await params;
  redirect(`/consultation/${encodeURIComponent(appointmentId)}`);
}
