import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Serif, JetBrains_Mono, Space_Mono } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "@/components/motion/Motion";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["600", "700", "800"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["400", "500", "700"] });
const spaceMono = Space_Mono({ variable: "--font-spacemono", subsets: ["latin"], weight: ["400", "700"] });
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: "italic" });

export const metadata: Metadata = {
  title: "AlgoVerse — Learn DSA four ways",
  description: "One topic, four formats: brief, comic, video and a step-by-step visualizer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bricolage.variable} ${jetbrains.variable} ${spaceMono.variable} ${instrument.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
