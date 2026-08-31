import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobLedger",
  description: "Job costs for contractors",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-CA">
      <body className="min-h-dvh bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
