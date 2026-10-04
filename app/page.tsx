import Link from "next/link";
import { ArrowRight, ArrowUpRight, Baby, Bone, Brain, CalendarCheck2, Check, HeartPulse, ShieldCheck, Sparkles, Stethoscope, Video } from "lucide-react";
import { doctors, specialties } from "@/lib/demo-data";
import { HomeSearch } from "@/components/home-search";
import { DoctorCard } from "@/components/doctor-card";

const specialtyIcons = { heart: HeartPulse, sparkles: Sparkles, baby: Baby, brain: Brain, bone: Bone, stethoscope: Stethoscope } as const;
const heroImage = "/manus-storage/async-images/mLN99s2kd0U1kieSb9dbvY/image-1.webp";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="hero-kicker"><span className="pulse-dot" /> Care that meets you where you are</div>
            <h1>The right doctor,<br /><em>a little closer.</em></h1>
            <p>Thoughtful healthcare begins with a conversation. Find a doctor you trust, choose a time that works, and take your next step with confidence.</p>
            <HomeSearch />
            <div className="hero-proof"><div className="avatar-stack"><span>AS</span><span>MN</span><span>LM</span><span>PK</span></div><span><strong>4.9/5 average</strong> from 12,000+ thoughtful visits</span></div>
          </div>
          <div className="hero-visual" aria-label="Carewell doctor illustration">
            <div className="hero-photo"><img src={heroImage} alt="A Carewell doctor in a bright, welcoming clinic" /><div className="photo-wash" /></div>
            <div className="availability-float"><span className="availability-icon"><CalendarCheck2 size={17} /></span><span><b>Appointments, made easy</b><small>Choose a time that works for you</small></span></div>
            <div className="doctor-float"><span className="doctor-mini">AS</span><span><strong>Dr. Ava Shah</strong><small>Cardiology · 12 years</small></span><span className="doctor-rating">★ 4.9</span></div>
          </div>
        </div>
      </section>

      <section className="trust-strip" id="carewell-trust"><div className="container trust-inner"><span className="trust-lead">A more considered way to get care</span><span className="trust-item"><ShieldCheck size={16} /> Doctor profiles you can explore</span><span className="trust-item"><Video size={16} /> Online or in-clinic visits</span><span className="trust-item"><Check size={15} /> Clear next steps</span></div></section>

      <section className="section-pad specialty-section">
        <div className="container">
          <div className="section-head"><div><span className="eyebrow">Start where you are</span><h2>Care for every<br /><span className="serif">part of your life.</span></h2></div><p>Browse a specialty or search for a doctor who understands what you need. Your next step can be a simple conversation.</p></div>
          <div className="specialty-grid">{specialties.map((item) => { const Icon = specialtyIcons[item.icon as keyof typeof specialtyIcons]; return <Link href={`/doctors?specialty=${encodeURIComponent(item.name)}`} key={item.name} className="specialty-card"><span className="specialty-icon"><Icon size={19} /></span><h3>{item.name}</h3><p>{item.detail}</p></Link>; })}</div>
        </div>
      </section>

      <section className="section-pad doctor-section">
        <div className="container">
          <div className="section-head"><div><span className="eyebrow">Meet your care team</span><h2>Doctors who listen<br /><span className="serif">before they advise.</span></h2></div><Link href="/doctors" className="btn btn-outline">Explore all doctors <ArrowUpRight size={15} /></Link></div>
          <div className="doctor-grid">{doctors.slice(0, 3).map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)}</div>
        </div>
      </section>

      <section className="metrics-band"><div className="container metrics-inner"><div className="metrics-intro"><h2>Small steps.<br />A better care journey.</h2><p>Carewell helps you move from “I should ask someone” to a clear next step.</p></div><div className="metric"><strong>1,200+</strong><span>Care-minded clinicians</span></div><div className="metric"><strong>4.9 / 5</strong><span>Average patient rating</span></div><div className="metric"><strong>15 min</strong><span>Simple appointment slots</span></div></div></section>

      <section className="section-pad" id="how-it-works"><div className="container"><div className="section-head"><div><span className="eyebrow">A clear path forward</span><h2>From question to<br /><span className="serif">conversation.</span></h2></div><p>Less time wondering where to begin. More time focused on the care that feels right.</p></div><div className="steps-grid"><article className="step-card"><span className="step-number">01</span><h3>Find your fit</h3><p>Explore doctor profiles, specialties, ratings and the way each clinician works.</p></article><article className="step-card"><span className="step-number">02</span><h3>Choose your moment</h3><p>See appointment options and choose a visit style and time that works for you.</p></article><article className="step-card"><span className="step-number">03</span><h3>Meet with confidence</h3><p>Bring your questions to a thoughtful conversation, online or in person.</p></article></div></div></section>

      <section className="container" style={{ paddingBottom: 84 }}><div className="cta-panel"><div><h2>Make room for feeling better.</h2><p>Explore doctors and find a time that works for you.</p></div><Link href="/doctors" className="btn">Find your doctor <ArrowRight size={15} /></Link></div></section>
      <div className="container" style={{ marginBottom: 32 }}><span className="demo-note">Demo experience · Appointments and provider integrations are simulated</span></div>
    </>
  );
}
