import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/shell";

export const metadata: Metadata = {
  title: "Kerala Roadbook",
  description: "A personal bike trip planner for Kerala"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AppShell>{children}</AppShell></body></html>;
}
