import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cypress Vision — Stop overpaying for AI",
  description: "AI spend management for builders. Automatic routing, hard spend limits, and per-asset visibility. One 30-second setup.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ margin: 0, background: "#FFFFFF", color: "#0A1F3D" }}>
        {children}
      </body>
    </html>
  );
}
