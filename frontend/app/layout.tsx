import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { SolanaProvider } from "@/helper/wallet_adapter";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AMM.xyz",
  description: "Implementation of AutomatedMarketMaker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SolanaProvider>
            <Toaster/>
            {children}
        </SolanaProvider>
      </body>
    </html>
  );
}
