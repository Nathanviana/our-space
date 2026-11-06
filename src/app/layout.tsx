import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
import "./globals.css";

// Serifa editorial só nos títulos de destaque (nomes do casal, seções da Início)
const serifa = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--fonte-serifa", display: "swap" });

export const metadata: Metadata = {
  title: "Nosso Espaço",
  description: "O espaço de Nathan e Iris para o que querem viver e o que já viveram juntos.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f7f9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={serifa.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
