/**
 * Shared types and labels for the Fieldwork archive.
 * Data comes from content/projects.json — nothing here invents project facts.
 */

export type Project = {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  year: number | null;
  date: string | null;
  location: string | null;
  capacity: string | null;
  client: string | null;
  summary: string;
  description: string;
  cover: string;
  photos: string[];
  featured: boolean;
  sourceCaption?: string | null;
  sourceNote?: string | null;
};

export type FilterMatch =
  | "Solar"
  | "Street Lighting"
  | "Electrical Works"
  | "Supply"
  | "Government";

export type Filter = {
  id: string;
  label: string;
  match: FilterMatch | null;
};

/** Filter bar order is fixed; matches the company's own service language. */
export const FILTERS: Filter[] = [
  { id: "all", label: "All", match: null },
  { id: "solar", label: "Solar", match: "Solar" },
  { id: "street-lighting", label: "Street Lighting", match: "Street Lighting" },
  { id: "electrical-works", label: "Electrical Works", match: "Electrical Works" },
  { id: "supply", label: "Supply", match: "Supply" },
  { id: "government", label: "Government", match: "Government" },
];

export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function photoCount(count: number): string {
  return count === 1 ? "1 photograph" : `${count} photographs`;
}

export function coverAlt(project: Project): string {
  const year = project.year ? `, ${project.year}` : "";
  return `${project.title} — ${project.category}${year}`;
}
