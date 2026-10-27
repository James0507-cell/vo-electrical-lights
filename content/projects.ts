import source from "./projects.json";
import type { Project } from "@/lib/types";

export type ProjectSource = Omit<Project, "cover" | "photos"> & {
  cover: string;
  photos: string[];
};

export const projectSource = source.projects as ProjectSource[];
export const extras = source.extras as {
  heroPoster: string;
  og: string;
  fieldStrip: string[];
  about: {
    team: string;
    training: string;
    trainingRoom: string;
    expo: string;
    portrait: string;
    warehouse: string;
    inverters: string;
  };
  services: Record<string, string>;
  products: { id: string; name: string }[];
};

export const projectFilters = [
  { id: "all", label: "All" },
  { id: "solar", label: "Solar" },
  { id: "street-lighting", label: "Street Lighting" },
  { id: "electrical-works", label: "Electrical Works" },
  { id: "supply", label: "Supply" },
  { id: "government", label: "Government" },
] as const;

export function filterMatches(project: ProjectSource, filter: string) {
  if (filter === "all") return true;
  const normalized = project.tags.map((t) => t.toLowerCase().replace(/\s+/g, "-").replace("&", "and"));
  return normalized.includes(filter);
}
