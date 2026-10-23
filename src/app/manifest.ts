import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Unstack Learning",
    short_name: "Unstack",
    description:
      "Unstack Learning — free academic help. Get unstuck, build understanding, and keep learning.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#312e81",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
