import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SEO Diagnostico — Análisis SEO Profesional con IA',
  description: 'Diagnóstico SEO completo: auditoría técnica, on-page e IA. Descubre cómo mejorar tu posicionamiento en Google en segundos.',
  keywords: 'SEO Diagnostico, auditoría SEO IA, diagnóstico SEO gratis, SEO Chile',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
