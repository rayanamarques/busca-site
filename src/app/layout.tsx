import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Busca Site — Gestão de Licenciamento",
  description:
    "Sistema de gestão de licenciamento da Busca Site Marques Engenharia: ofensor, SLA, faturamento e prioridade por site.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
