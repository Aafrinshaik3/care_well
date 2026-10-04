import type { Metadata } from "next";
import { DoctorsDirectory } from "@/components/doctors-directory";

export const metadata: Metadata = { title: "Find a doctor", description: "Browse Carewell doctors by specialty, fee, rating and visit style." };

type SearchParams = Promise<{ q?: string; specialty?: string }>;

export default async function DoctorsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <><section className="page-hero"><div className="container"><span className="eyebrow">Find your fit</span><h1>Meet your next doctor.</h1><p>Explore clinicians by specialty, ratings and the way you’d like to meet. Every profile is a starting point for a more thoughtful conversation.</p></div></section><DoctorsDirectory initialQuery={params.q ?? ""} initialSpecialty={params.specialty ?? ""} /></>;
}
