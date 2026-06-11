import "~/styles/globals.css";

import { type Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "LicenseMeter — find the Microsoft 365 licenses you pay for but do not use",
  description:
    "LicenseMeter connects read-only to your Microsoft 365 tenant and shows the monthly cost of unused, misassigned and forgotten licenses.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} ${fraunces.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
