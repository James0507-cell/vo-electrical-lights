import Link from "next/link";
import { site } from "@/content/site";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer__glow" aria-hidden="true" />
      <div className="shell">
        <div className="footer__top">
          <div>
            <p className="eyebrow" style={{ marginBottom: "1.4rem" }}>Villanueva-Ong Electrical Lights Trading</p>
            <p className="footer__claim">Quality is our <em>key.</em></p>
            <p className="mono" style={{ marginTop: "1.4rem", maxWidth: "34ch" }}>
              Solar installation · Electrical supply · Street lighting — Philippines
            </p>
          </div>
          <div className="footer__cols">
            <div className="footer__col">
              <h3>Explore</h3>
              <ul>
                <li><Link href="/#work">Work</Link></li>
                <li><Link href="/work/">Field records</Link></li>
                <li><Link href="/#services">Services</Link></li>
                <li><Link href="/#products">Supply</Link></li>
                <li><Link href="/#process">Process</Link></li>
              </ul>
            </div>
            <div className="footer__col">
              <h3>Company</h3>
              <ul>
                <li><Link href="/#about">About</Link></li>
                <li><Link href="/#contact">Contact</Link></li>
                <li><Link href="/#faq">FAQ</Link></li>
                <li><a href={site.facebook} target="_blank" rel="noreferrer">Facebook ↗</a></li>
              </ul>
            </div>
            <div className="footer__col">
              <h3>Talk to us</h3>
              <ul>
                <li><a href={`tel:${site.telephoneHref}`}>{site.telephoneDisplay}</a></li>
                <li><a href={`mailto:${site.email}`}>{site.email}</a></li>
                <li><p>{site.serviceNote}</p></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer__wordmark" aria-hidden="true">V.O Electrical</div>

        <div className="footer__bottom">
          <span>© {year} {site.legalName}</span>
          <span>Photographs from our project files · No stock imagery</span>
          <span><a href="#main">Back to top ↑</a></span>
        </div>
      </div>
    </footer>
  );
}
