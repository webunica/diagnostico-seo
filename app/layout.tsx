import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DiagnósticoSEO — Análisis SEO Profesional Impulsado por ChatGPT',
  description: 'Obtén un diagnóstico SEO completo de cualquier sitio web en minutos. Score, issues críticos, plan de acción priorizado. Potenciado por ChatGPT.',
  keywords: 'diagnóstico SEO, análisis SEO Chile, auditoría SEO, SEO profesional',
  openGraph: {
    title: 'DiagnósticoSEO — Análisis SEO con IA',
    description: 'Diagnóstico SEO completo: score, problemas críticos y plan de acción. Potenciado por ChatGPT.',
    url: 'https://diagnosticoseo.com',
    siteName: 'DiagnósticoSEO',
    type: 'website',
  },
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
      </head>
      <body>{children}</body>
    </html>
  );
}
