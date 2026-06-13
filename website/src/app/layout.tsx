import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RouteWise — Open-Source Step-Level Router for AI Agents",
  description:
    "Open-source AI workflow router that decomposes tasks, selects the best model and tools for each step in Claude Code, Cursor, MCP agents, and multi-model AI workflows.",
  keywords: [
    "AI workflow router",
    "agent routing",
    "multi-model AI",
    "LLM router",
    "Claude Code",
    "Cursor",
    "MCP",
    "Model Context Protocol",
    "AI agents",
    "open-source AI",
    "step-level routing",
    "AI orchestration",
  ],
  openGraph: {
    title: "RouteWise: Open-Source Step-Level Router for AI Agents",
    description:
      "Decompose workflows, route each step to the best model, evaluate outputs, generate execution traces.",
    type: "website",
    url: "https://routewise.dev",
  },
  twitter: {
    card: "summary_large_image",
    title: "RouteWise — AI Workflow Router",
    description:
      "Stop choosing AI models manually. RouteWise routes each step to the best model automatically.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
