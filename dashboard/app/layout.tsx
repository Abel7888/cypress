import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import * as Sentry from '@sentry/nextjs';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cypress TokenGuard — Stop surprise AI bills",
  description: "Govern AI spend across your team. Real-time budget blocking, intelligent routing, and per-employee visibility.",
};

export function generateMetadata(): Metadata {
  return {
    other: {
      ...Sentry.getTraceData()
    }
  };
}

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
