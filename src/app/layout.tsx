import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RealtyOS — Real estate, under control",
  description: "A premium operating system for modern real estate businesses.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}