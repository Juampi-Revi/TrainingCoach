import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";

import "./globals.css";
import { authOptions } from "@/auth.config";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Training Challenge",
  description: "Entrenamiento y seguimiento con coach"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value;
  const initialTheme = themeCookie === "light" || themeCookie === "dark" ? themeCookie : undefined;

  return (
    <html lang="es" suppressHydrationWarning data-theme={initialTheme}>
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
