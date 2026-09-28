import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRUD SQL Server",
  description: "Gestión de productos con SQL Server",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
