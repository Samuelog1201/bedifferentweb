import type { Metadata } from "next";
import { connection } from "next/server";
import { Inter, Karantina, League_Gothic } from "next/font/google";
import "./globals.css";

const karantina = Karantina({
  subsets: ["latin"],
  variable: "--font-karantina",
  weight: "700",
  display: "swap",
});

const leagueGothic = League_Gothic({
  subsets: ["latin"],
  variable: "--font-league-gothic",
  weight: "400",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BeDifferent | Fitness Lifestyle",
  description: "BeDifferent — marca colombiana de ropa Fitness Lifestyle.",
  ...(process.env.NEXT_PUBLIC_SITE_URL ? { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL) } : {}),
  applicationName: "BeDifferent",
  icons: {
    icon: [
      { url: "/icons/bedifferent-favicon-v1.ico", sizes: "any", type: "image/x-icon" },
      { url: "/icons/bedifferent-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/bedifferent-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/icons/bedifferent-180.png", sizes: "180x180", type: "image/png" },
  },
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
    <html lang="es-CO" className={`${karantina.variable} ${leagueGothic.variable} ${inter.variable}`}>
      <body><a className="skip-link" href="#main-content">Saltar al contenido</a>{children}</body>
    </html>
  );
}
