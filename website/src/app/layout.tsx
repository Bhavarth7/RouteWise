import type { Metadata } from "next";
import "./globals.css";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
