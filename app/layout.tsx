import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Myshop", template: "%s | Myshop" },
  description: "Shop products from trusted sellers.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/favicon.svg" },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}