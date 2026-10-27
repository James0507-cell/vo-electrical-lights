"use client";

import { useState } from "react";

/** Copy-to-clipboard affordance for the phone number, with an animated toast. */
export default function CopyPhone({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <span className="copy-phone">
      <button type="button" onClick={copy} aria-label={`Copy phone number ${value}`}>
        {copied ? "Copied" : "Copy"}
      </button>
      <span className="copy-phone__toast" role="status" aria-live="polite">
        {copied ? "Number copied" : ""}
      </span>
    </span>
  );
}
