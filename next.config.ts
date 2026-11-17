import type { NextConfig } from "next";
import { approvedProductionWhatsAppNumber, normalizeWhatsAppNumber } from "./src/lib/whatsapp";

if (
  process.env.NODE_ENV === "production" &&
  normalizeWhatsAppNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER) !== approvedProductionWhatsAppNumber
) {
  throw new Error(
    "Production build blocked: configure NEXT_PUBLIC_WHATSAPP_NUMBER with BeDifferent's approved commercial number before deployment.",
  );
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    qualities: [75, 90, 95, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cxctfcqongjrhpdfsawk.supabase.co",
        pathname: "/storage/v1/object/sign/be-different-products/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      ],
    }];
  },
};

export default nextConfig;
