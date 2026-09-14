import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kerala Roadbook",
  description: "A personal bike trip planner for Kerala"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
