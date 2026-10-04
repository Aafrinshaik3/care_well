"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";

const links = [
  { href: "/doctors", label: "Find a doctor" },
  { href: "/dashboard/patient", label: "My appointments" },
  { href: "/dashboard/doctor", label: "For doctors" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="Carewell home" onClick={() => setOpen(false)}>
          <BrandMark /> <span>carewell</span>
        </Link>
        <nav className={`nav-links ${open ? "open" : ""}`} aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={pathname === link.href ? "active" : ""} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link href="/dashboard/patient" className="btn btn-outline btn-sm">Sign in</Link>
          <Link href="/doctors" className="btn btn-primary btn-sm">Book a visit <ArrowUpRight size={14} /></Link>
          <button className="menu-toggle" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((value) => !value)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
