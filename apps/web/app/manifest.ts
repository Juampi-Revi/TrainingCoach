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
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Empezar sesión de hoy",
        short_name: "Entrenar",
        description: "Abrir la semana y empezar el entreno de hoy",
        url: "/semana",
      },
      {
        name: "Ver semana",
        short_name: "Semana",
        url: "/semana",
      },
    ],
  };
}
