import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "YourCoachFit",
    short_name: "YourCoach",
    description: "Tu plataforma de entrenamiento personalizado",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0B0B0C",
    theme_color: "#0B0B0C",
    icons: [
      {
        src: "/icon.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
