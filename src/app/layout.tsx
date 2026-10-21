import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: "IT Resilience Command Center",
  description: "Monitor and manage the IT Resilience Index.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="fixed inset-x-0 bottom-0 top-14 overflow-y-auto overscroll-contain">{children}</main>
      </body>
    </html>
  );
}
