import manifest from "@/content/image-manifest.json";

export type ImageEntry = {
  width: number;
  height: number;
  aspect: number;
  color: string;
  lqip: string;
  widths: number[];
  hasJpg?: boolean;
  avif?: Record<string, string>;
  webp?: Record<string, string>;
  src: string;
  jpg?: string;
  poster?: string;
  id?: string;
};

const MAP = manifest as unknown as Record<string, ImageEntry>;

export function getImage(id: string): ImageEntry {
  const entry = MAP[id] ?? MAP.hero;
  if (!entry) {
    return {
      width: 1600, height: 1000, aspect: 1.6, color: "#1d2530", lqip: "",
      widths: [960], src: "/brand/logo-512.png",
    };
  }
  return entry;
}

export function buildSrcSet(entry: ImageEntry, format: "avif" | "webp"): string {
  const map = format === "avif" ? entry.avif : entry.webp;
  if (!map) return "";
  return Object.entries(map)
    .map(([w, url]) => `${url} ${w}w`)
    .join(", ");
}

export const HERO_IMAGE_ID = "hero";
