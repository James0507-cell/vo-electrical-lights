import QuoteForm from "@/components/sections/QuoteForm";
import CopyPhone from "@/components/ui/CopyPhone";
import { site } from "@/content/site";

export default function Contact() {
  return (
    <section id="contact" className="section theme-ink contact" aria-labelledby="contact-title">
      <div className="contact__glow" aria-hidden="true" />
      <div className="shell">
        <div className="contact__head">
          <p className="mono">06 / Start a project</p>
          <h2 id="contact-title" className="d-xxl contact__title">Let’s<br />talk.</h2>
        </div>

        <div className="contact__grid">
          <div className="contact__side">
            <p className="contact__lede">
              Tell us what you want to power — a home, a farm pump, a commercial roof, a street.
              We will tell you what we need to quote it properly.
            </p>

            <div className="contact__phone-row">
              <a className="contact__phone" href={`tel:${site.telephoneHref}`}>
                {site.telephoneDisplay}
              </a>
              <CopyPhone value={site.telephoneDisplay} />
            </div>

            <div className="contact__links">
              <a href={`mailto:${site.email}`}>
                <span className="mono">Email</span>
                <span>{site.email}</span>
              </a>
              <a href={site.facebook} target="_blank" rel="noreferrer">
                <span className="mono">Facebook</span>
                <span>{site.facebookLabel} ↗</span>
              </a>
            </div>

            <p className="contact__note mono">
              Supply · Delivery · Installation — private and government projects
            </p>
          </div>

          <div className="contact__form">
            <QuoteForm />
          </div>
        </div>
      </div>
    </section>
  );
}
