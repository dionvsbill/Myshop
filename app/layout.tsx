import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata={title:{default:"Myshop",template:"%s | Myshop"},description:"A modern shopping experience built for Ghana."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
