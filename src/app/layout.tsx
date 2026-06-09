import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ai product manager | Scrum SaaS",
  description: "AI chat with persistent Scrum artifacts, sprint burndown, review, retro, markdown export, and priority scoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-noise" />
        {children}
      </body>
    </html>
  );
}
