import "./globals.css";

export const metadata = {
  title: "IA Extractor Contable",
  description: "Extrae datos de facturas con Gemini",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}

