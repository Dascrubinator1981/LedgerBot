import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "LedgerBot · Your money. Your rules.",
  description:
    "Private manual finance planning. Ledger, Budget, Forecaster and Pip.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
