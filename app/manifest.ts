import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "V.O Electrical Lights Trading",
    short_name: "V.O Electrical",
    description: "Solar installation and electrical supply in the Philippines.",
    start_url: "/",
    display: "browser",
    background_color: "#06080c",
    theme_color: "#06080c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
