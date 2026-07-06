import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Broono - Tamagotchi Pet Simulation",
  description: "A mobile-first Tamagotchi-style pet simulation game.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
