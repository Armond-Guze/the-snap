import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "The Game Snap",
    short_name: "The Snap",
    description: "NFL news, your team, and your reading list.",
    start_url: "/my-snap",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#032c57",
    icons: [
      { src: "/snap-icon-192-v3.png", sizes: "192x192", type: "image/png" },
      { src: "/snap-icon-512-v3.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
