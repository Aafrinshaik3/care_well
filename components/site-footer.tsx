import Link from "next/link";
import { BrandMark } from "@/components/ui/brand-mark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <Link href="/" className="brand"><BrandMark /><span>carewell</span></Link>
            <p>Thoughtful care, scheduled around real life. Find trusted doctors and make your next step feel simpler.</p>
            <span className="demo-note">Demo experience · No real payments</span>
          </div>
          <div className="footer-links">
            <div className="footer-col"><strong>Explore</strong><Link href="/doctors">Find a doctor</Link><Link href="/doctors">Specialties</Link><Link href="/dashboard/patient">Appointments</Link></div>
            <div className="footer-col"><strong>Your care</strong><Link href="/dashboard/patient">Patient dashboard</Link><Link href="/dashboard/doctor">Doctor dashboard</Link><Link href="/consultation/appt-cw-1042">Consultation room</Link></div>
            <div className="footer-col"><strong>About Carewell</strong><a href="#how-it-works">How it works</a><a href="#carewell-trust">Our approach</a><a href="mailto:hello@carewell.example">Contact</a></div>
          </div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Carewell. A demonstration booking experience.</span><span>For urgent or emergency symptoms, contact local emergency services.</span></div>
      </div>
    </footer>
  );
}
