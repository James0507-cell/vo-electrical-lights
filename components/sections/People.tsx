import Link from "next/link";
import VOImage from "@/components/media/VOImage";
import { creds } from "@/content/creds";
import { extras } from "@/content/projects";

const stats = [
  { value: "17", label: "Documented projects in the archive" },
  { value: "Luzon + Mindanao", label: "Where we have installed" },
  { value: "Nationwide", label: "Equipment delivery" },
];

export default function People() {
  return (
    <section id="about" className="section theme-paper people" aria-labelledby="people-title">
      <div className="shell">
        <div className="people__head">
          <div>
            <p className="mono mono--ink">05 / Who we are</p>
            <h2 id="people-title" className="d-xl people__title">Quality is<br />our <em>key.</em></h2>
          </div>
          <p className="people__lede lede">
            V.O is two things at once: an electrical trading house and a solar installation team.
            The panels, inverters, poles, lights and materials come through our own stock — and the
            people who sell them are the people who install them.
          </p>
        </div>

        <div className="people__grid">
          <figure className="people__main" data-reveal>
            <VOImage
              id={extras.about.team}
              alt="V.O installation crew on site in hard hats and hi-vis, standing beside a ground-mounted solar array"
              ratio="4 / 5"
              sizes="(max-width: 900px) 92vw, 44vw"
            />
            <figcaption className="mono">Our crew — ground-mounted array, project files</figcaption>
          </figure>

          <div className="people__copy">
            <p className="people__statement">
              We design, supply and install solar for homes, farms, businesses and public projects.
              Large commercial rooftops. Solar-powered irrigation. Street lighting. Transformers,
              CCTV and fire-alarm works.
            </p>
            <p className="body-copy">
              The company works with private clients and government agencies alike — complete
              documents, PHILGEPS-ready, and a crew that shows up in proper protective gear. Quality
              is our key — and every photograph on this site comes from our own project files.
            </p>

            <ul className="people__stamps">
              {creds.map((cred) => (
                <li key={cred.label}>
                  <span>{cred.label}</span>
                  <small>{cred.detail}</small>
                </li>
              ))}
            </ul>

            <Link className="btn btn--ink" href="/#contact">
              <span>Talk to the team</span>
              <span className="arr" aria-hidden="true">↗</span>
            </Link>
          </div>

          <figure className="people__small people__small--a" data-reveal>
            <VOImage
              id={extras.about.training}
              alt="V.O staff in a training and briefing session"
              ratio="4 / 3"
              sizes="(max-width: 900px) 45vw, 22vw"
            />
            <figcaption className="mono">Training & briefings</figcaption>
          </figure>

          <figure className="people__small people__small--b" data-reveal>
            <VOImage
              id={extras.about.expo}
              alt="Villanueva-Ong booth at a regional trade event"
              ratio="4 / 3"
              sizes="(max-width: 900px) 45vw, 22vw"
            />
            <figcaption className="mono">Regional trade event</figcaption>
          </figure>

          <dl className="people__stats" data-reveal>
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt>{stat.value}</dt>
                <dd className="mono">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
