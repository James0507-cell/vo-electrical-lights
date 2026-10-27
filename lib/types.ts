export type ProjectPhoto = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

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
  cover: ProjectPhoto;
  photos: ProjectPhoto[];
  featured: boolean;
  sourceCaption?: string;
  sourceNote?: string;
};
