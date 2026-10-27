import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/portfolio/portfolio.module.css";
import WorkArchive from "@/components/portfolio/WorkArchive";
import type { Project } from "@/components/portfolio/types";
import projectsData from "@/content/projects.json";
import { site } from "@/content/site";
import { getImage } from "@/lib/images";

const projects: Project[] = projectsData.projects;

const totalPhotos = projects.reduce((count, project) => count + project.photos.length, 0);
const datedYears = projects
  .map((project) => project.year)
  .filter((year): year is number => typeof year === "number");
const firstYear = datedYears.length > 0 ? Math.min(...datedYears) : null;
const lastYear = datedYears.length > 0 ? Math.max(...datedYears) : null;
const yearRange = firstYear && lastYear ? `${firstYear}—${lastYear}` : null;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://voelectrical.example";

const title = "Field Records — solar, street lighting & electrical projects";
const description = `${projects.length} field records from the V.O Electrical Lights Trading files — rooftop and ground-mount solar, solar street lighting, transformers, CCTV, fire alarm work and equipment supply for private and government clients in the Philippines.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/work/" },
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: "/work/",
    siteName: site.legalName,
    title,
    description,
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "V.O Electrical Lights Trading — field records",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.jpg"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${siteUrl}/work/#page`,
      url: `${siteUrl}/work/`,
      name: title,
      description,
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@id": `${siteUrl}/#organization` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: projects.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: projects.map((project, index) => {
          const cover = getImage(project.cover);
          const coverPath = cover.jpg ?? cover.src;
          return {
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Thing",
              name: project.title,
              description: project.summary,
              url: `${siteUrl}/work/?project=${project.slug}`,
              image: `${siteUrl}${coverPath}`,
            },
          };
        }),
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "Field Records", item: `${siteUrl}/work/` },
      ],
    },
  ],
};

export default function WorkPage() {
  return (
    <>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className="shell">
            <div className={styles.headerTop} data-reveal>
              <p className={styles.kicker}>
                <span className={styles.kickerSquare} aria-hidden="true" />
                Fieldwork / {projects.length} projects
              </p>
              <p className={styles.headerMeta}>
                Project archive · {yearRange} · {totalPhotos} photographs
              </p>
            </div>

            <h1 className={styles.title} data-reveal>
              <span className={styles.titleLine}>Field</span>
              <span className={styles.titleLine}>Records</span>
            </h1>
            <div className={styles.titleRule} aria-hidden="true" data-reveal />

            <div className={styles.headerFoot} data-reveal>
              <p className={styles.intro}>
                Solar, street lighting, electrical works and supply — {projects.length} projects
                from our own files.
              </p>
              <div className={styles.badge}>
                <span className={styles.badgeNum}>{projects.length}</span>
                <span className={styles.badgeLabel}>Projects</span>
              </div>
            </div>
          </div>
        </header>

        <WorkArchive projects={projects} />

        <section className={styles.cta} aria-labelledby="work-cta-heading">
          <div className={`shell ${styles.ctaInner}`}>
            <p className={styles.ctaKicker}>Next</p>
            <h2 id="work-cta-heading" className={styles.ctaTitle} data-reveal>
              Have a roof, a field, or a road to light?
            </h2>
            <div className={styles.ctaRow}>
              <p className={styles.ctaCopy}>
                Tell us where the site is and what it needs to power. A site assessment usually
                comes first — we will tell you what a proper installation takes.
              </p>
              <div className={styles.ctaActions}>
                <Link className={styles.ctaPrimary} href="/#contact">
                  <span>Start a project</span>
                  <span className={styles.ctaArrow} aria-hidden="true">
                    ↗
                  </span>
                </Link>
                <a className={styles.ctaSecondary} href={`tel:${site.telephoneHref}`}>
                  <span>{site.telephoneDisplay}</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
