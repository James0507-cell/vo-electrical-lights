import { faqs } from "@/content/site";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function Faq() {
  return (
    <section id="faq" className="section theme-paper faq" aria-labelledby="faq-title">
      <div className="shell">
        <div className="faq__head">
          <div className="faq__head-left">
            <p className="mono mono--ink">Good to know</p>
            <h2 id="faq-title" className="d-l">Questions.</h2>
          </div>
          <p className="faq__note">Short, honest answers. For anything else, call or message us — we answer with the same directness.</p>
        </div>
        <div className="faq__list">
          {faqs.map((item, i) => (
            <details className="faq__item" key={item.q} data-reveal style={{ "--d": `${i * 40}ms` } as React.CSSProperties}>
              <summary>
                <span className="faq__index mono">{String(i + 1).padStart(2, "0")}</span>
                <span className="faq__q">{item.q}</span>
                <span className="faq__plus" aria-hidden="true" />
              </summary>
              <div className="faq__a"><p>{item.a}</p></div>
            </details>
          ))}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </section>
  );
}
