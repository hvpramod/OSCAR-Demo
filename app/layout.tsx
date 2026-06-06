import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "OSCAR — Optum HouseCalls Supply Chain Agent",
  description: "Just-in-Time Provider Supply Chain Agent for Optum HouseCalls",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen" style={{ background: "#f8f9fb" }}>
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
