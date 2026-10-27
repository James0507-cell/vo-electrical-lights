"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/content/site";

const primary = [
  { href: "/#work", label: "Work" },
  { href: "/#services", label: "Services" },
  { href: "/#products", label: "Supply" },
  { href: "/#process", label: "Process" },
  { href: "/#contact", label: "Contact" },
];

const menuLinks = [
  { href: "/#work", label: "Work" },
  { href: "/#services", label: "Services" },
  { href: "/#products", label: "Supply" },
  { href: "/#process", label: "Process" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export default function Nav() {
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    window.__lenis?.stop();
    const timer = window.setTimeout(() => {
      menuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    }, 120);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        burgerRef.current?.focus();
      }
      if (event.key === "Tab" && menuRef.current) {
        const nodes = Array.from(
          menuRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
        ).filter((el) => el.offsetParent !== null);
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      root.style.overflow = "";
      window.__lenis?.start();
    };
  }, [open]);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>

      <header className={`nav ${compact ? "is-compact" : ""}`}>
        <div className="nav__bar">
          <Link href="/" className="nav__brand">
            <span className="nav__logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo-128.png" alt="" width={128} height={128} />
            </span>
            <span className="nav__wordmark">
              <strong>V.O Electrical</strong>
              <span>Lights Trading</span>
            </span>
            <span className="sr-only"> — home</span>
          </Link>

          <nav className="nav__links" aria-label="Primary">
            {primary.map((item) => (
              <Link key={item.href} href={item.href}><span data-scramble>{item.label}</span></Link>
            ))}
          </nav>

          <div className="nav__right">
            <a className="nav__phone" href={`tel:${site.telephoneHref}`}>{site.telephoneDisplay}</a>
            <Link href="/#contact" className="btn btn--ink nav__cta">
              <span>Get a quote</span>
              <span className="arr" aria-hidden="true">↗</span>
            </Link>
            <button
              ref={burgerRef}
              type="button"
              className="nav__burger"
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <span /><span />
            </button>
          </div>
        </div>
      </header>

      <div
        id="site-menu"
        ref={menuRef}
        className={`menu ${open ? "is-open" : ""}`}
        role="dialog"
        aria-modal={open ? true : undefined}
        aria-label="Site menu"
        inert={!open ? true : undefined}
      >
        <p className="menu__label mono">Navigate — V.O Electrical</p>
        <div className="menu__inner">
          <nav className="menu__links" aria-label="Mobile">
            {menuLinks.map((item, i) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="menu__meta">
          <a href={`tel:${site.telephoneHref}`}>{site.telephoneDisplay}</a>
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <a href={site.facebook} target="_blank" rel="noreferrer">Facebook ↗</a>
          <span className="mono">Solar · Electrical · Philippines</span>
        </div>
      </div>
    </>
  );
}
