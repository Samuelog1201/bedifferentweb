import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "BeDifferent | Fitness Lifestyle",
  description: "BeDifferent — marca colombiana de ropa Fitness Lifestyle.",
  ...(process.env.NEXT_PUBLIC_SITE_URL ? { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL) } : {}),
  applicationName: "BeDifferent",
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "BeDifferent",
    title: "BeDifferent | Fitness Lifestyle",
    description: "DISCIPLINE MAKES THE DIFFERENCE. MORE THAN CLOTHING.",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();

  return (
    <html lang="es-CO">
      <body><a className="skip-link" href="#main-content">Saltar al contenido</a>{children}</body>
    </html>
  );
}
