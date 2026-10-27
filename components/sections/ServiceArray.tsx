"use client";

import { useState } from "react";
import Link from "next/link";
import VOImage from "@/components/media/VOImage";
import { services, beyondSolar } from "@/content/site";

export default function ServiceArray() {
  const [open, setOpen] = useState(0);

  return (
    <section id="services" className="section theme-ink array-section" aria-labelledby="services-title">
      <div className="shell">
        <div className="sec-head">
          <div className="sec-head__left">
            <p className="mono">01 / What we do</p>
            <h2 id="services-title" className="d-xl">The array.</h2>
          </div>
          <div className="sec-head__right">
            <p className="lede">
              Six ways to put the sun to work — from a single rooftop to a field of panels.
              Hover or tab through the array.
            </p>
          </div>
        </div>
      </div>

      <div className="array" aria-label="Solar services">
        {services.map((service, i) => {
          const isOpen = open === i;
          return (
            <button
              key={service.id}
              type="button"
              className={`array__cell ${isOpen ? "is-open" : ""}`}
              onMouseEnter={() => setOpen(i)}
              onFocus={() => setOpen(i)}
              onClick={() => setOpen(i)}
              aria-expanded={isOpen}
            >
              <VOImage
                id={service.photoId}
                alt=""
                decorative
                sizes="(max-width: 900px) 92vw, 42vw"
                className="array__img"
              />
              <span className="array__shade" aria-hidden="true" />
              <span className="array__num mono">{service.index}</span>
              <span className="array__plus" aria-hidden="true">+</span>
              <span className="array__content">
                <span className="array__nav-label">{service.navLabel}</span>
                <span className="array__title d-s">{service.title}</span>
                <span className="array__short mono">{service.short}</span>
                <span className="array__detail">
                  <span className="array__desc">{service.description}</span>
                  <span className="array__points">
                    {service.points.map((point) => <span key={point}>{point}</span>)}
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="shell">
        <div className="array__foot">
          <div>
            <p className="mono">Beyond solar</p>
            <p className="array__foot-line">
              {beyondSolar.groups.map((group) => group.title).join(" · ")} — supplied from our own stock.
            </p>
          </div>
          <Link className="btn" href="/#products">
            <span>The stockroom</span>
            <span className="arr" aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
