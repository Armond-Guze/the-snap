export function GET() {
  return Response.json({
    id: "/write",
    name: "Snap Writer",
    short_name: "Snap Writer",
    description: "Write and edit articles for The Snap.",
    start_url: "/write/new",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      { src: "/snap-icon-192-black-v5.png", sizes: "192x192", type: "image/png" },
      { src: "/snap-icon-512-black-v5.png", sizes: "512x512", type: "image/png" },
    ],
  }, { headers: { "Content-Type": "application/manifest+json" } });
}
