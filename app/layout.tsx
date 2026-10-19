import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "MonumentStudio | Monument Design",
  description:
    "Design a memorial in real-world inches, personalize its inscription, review area and volume, and save a design file. A preliminary design workspace for Villegas Headstones & Monuments LLC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
