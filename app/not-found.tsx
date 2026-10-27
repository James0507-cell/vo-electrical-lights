import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className="section theme-ink" style={{ minHeight: "100svh", display: "grid", placeItems: "center", paddingTop: "var(--nav-h)" }}>
      <div className="shell" style={{ textAlign: "center" }}>
        <p className="eyebrow" style={{ justifyContent: "center" }}>404</p>
        <h1 className="display-l" style={{ margin: "1.4rem 0" }}>This circuit goes nowhere.</h1>
        <p className="lede" style={{ margin: "0 auto 2rem" }}>
          The page you are looking for does not exist. Head back to the site or see the fieldwork.
        </p>
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link className="btn btn--sun" href="/"><span>Back home</span></Link>
          <Link className="btn" href="/work/"><span>Fieldwork</span></Link>
        </div>
      </div>
    </section>
  );
}
