"use client";

import { useEffect, useState } from "react";

// ─── Workflow Trace Animation Data ───────────────────────────────────────────

const traceSteps = [
  { label: "Classify", detail: "reasoning → code-gen → writing", delay: 0 },
  { label: "Plan", detail: "3 steps decomposed", delay: 600 },
  {
    label: "Route Step 1",
    detail: "→ Claude Sonnet 4.6",
    model: "claude",
    delay: 1200,
  },
  {
    label: "Route Step 2",
    detail: "→ GPT-4.1",
    model: "openai",
    delay: 1800,
  },
  {
    label: "Route Step 3",
    detail: "→ Gemini 3.5 Flash",
    model: "vertex",
    delay: 2400,
  },
  { label: "Evaluate", detail: "3/3 passed", delay: 3000 },
  { label: "Trace Generated", detail: "$0.0087 · 4.2s", delay: 3600 },
];

// ─── Hero Section ────────────────────────────────────────────────────────────

function Hero() {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [inputTyped, setInputTyped] = useState(false);

  useEffect(() => {
    const inputTimer = setTimeout(() => setInputTyped(true), 400);
    const timers = traceSteps.map((step, i) =>
      setTimeout(() => setVisibleSteps(i + 1), step.delay + 1200)
    );
    return () => {
      clearTimeout(inputTimer);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16">
      <div className="max-w-4xl w-full text-center mb-16">
        <h1
          className="text-5xl md:text-7xl font-[family-name:var(--font-display)] leading-tight mb-6"
          style={{ color: "var(--color-foreground)" }}
        >
          Stop choosing AI models manually.
        </h1>
        <p
          className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          style={{ color: "var(--color-muted)" }}
        >
          RouteWise decomposes workflows, selects the best model and tools for
          each step, evaluates results, and generates a complete execution
          trace.
        </p>
        <div className="flex gap-4 justify-center mt-10">
          <a
            href="https://github.com/Bhavarth7/RouteWise#quick-start"
            className="px-6 py-3 rounded-md font-medium text-sm transition-all hover:opacity-90"
            style={{
              background: "var(--color-accent)",
              color: "var(--color-background)",
            }}
          >
            Get Started
          </a>
          <a
            href="https://github.com/Bhavarth7/RouteWise"
            className="px-6 py-3 rounded-md font-medium text-sm border transition-all hover:opacity-80"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-foreground)",
            }}
          >
            View on GitHub
          </a>
        </div>
      </div>

      {/* Live Workflow Trace Animation */}
      <div
        className="w-full max-w-xl rounded-lg border p-6 font-[family-name:var(--font-mono)] text-sm"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
          <span
            className="ml-3 text-xs"
            style={{ color: "var(--color-muted)" }}
          >
            routewise run
          </span>
        </div>

        <div className="mb-4">
          <span style={{ color: "var(--color-accent)" }}>$ </span>
          <span
            className={inputTyped ? "" : "opacity-0"}
            style={{ color: "var(--color-foreground)" }}
          >
            routewise run &quot;Build an AI support agent&quot;
          </span>
          {!inputTyped && (
            <span
              className="animate-blink"
              style={{ color: "var(--color-accent)" }}
            >
              █
            </span>
          )}
        </div>

        <div className="space-y-2">
          {traceSteps.map((step, i) => (
            <div
              key={step.label}
              className={`flex items-center gap-3 transition-all duration-300 ${
                i < visibleSteps
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              }`}
            >
              <span
                className="w-4 text-center"
                style={{
                  color:
                    i < visibleSteps
                      ? "var(--color-accent)"
                      : "var(--color-muted)",
                }}
              >
                {i < visibleSteps ? "✓" : "·"}
              </span>
              <span style={{ color: "var(--color-foreground)" }}>
                {step.label}
              </span>
              <span
                className="text-xs"
                style={{
                  color: step.model
                    ? "var(--color-accent-secondary)"
                    : "var(--color-muted)",
                }}
              >
                {step.detail}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Problem Section ─────────────────────────────────────────────────────────

function Problem() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-display)] text-center mb-20">
          The problem with multi-model workflows
        </h2>

        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Before: Chaos */}
          <div
            className="rounded-lg border p-8"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <p
              className="text-xs uppercase tracking-wider mb-6"
              style={{ color: "var(--color-muted)" }}
            >
              Without RouteWise
            </p>
            <div className="space-y-3 font-[family-name:var(--font-mono)] text-sm">
              {[
                "Claude → wrong task",
                "GPT → expensive for simple work",
                "Cursor → no routing visibility",
                "MCP → manual tool switching",
                "Scripts → fragile, no traces",
              ].map((line) => (
                <div key={line} className="flex items-center gap-2">
                  <span className="text-red-400">✗</span>
                  <span style={{ color: "var(--color-muted)" }}>{line}</span>
                </div>
              ))}
            </div>
          </div>

          {/* After: RouteWise */}
          <div
            className="rounded-lg border p-8"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-accent)",
              boxShadow: "0 0 40px -12px rgba(92, 225, 230, 0.15)",
            }}
          >
            <p
              className="text-xs uppercase tracking-wider mb-6"
              style={{ color: "var(--color-accent)" }}
            >
              With RouteWise
            </p>
            <div className="space-y-3 font-[family-name:var(--font-mono)] text-sm">
              {[
                "Task → Decompose → Route → Execute",
                "Best model per step, automatically",
                "Cost + latency tracked per step",
                "Full trace: why each model was chosen",
                "Works in Claude Code, Cursor, MCP",
              ].map((line) => (
                <div key={line} className="flex items-center gap-2">
                  <span style={{ color: "var(--color-accent)" }}>✓</span>
                  <span style={{ color: "var(--color-foreground)" }}>
                    {line}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ────────────────────────────────────────────────────────────

function HowItWorks() {
  const phases = [
    {
      title: "Plan",
      description: "Decompose task into ordered steps. Classify each step type.",
      icon: "◇",
    },
    {
      title: "Route",
      description:
        "Select best model per step within cost, latency, and quality constraints.",
      icon: "→",
    },
    {
      title: "Verify",
      description:
        "Execute, evaluate output quality, log full trace with costs and decisions.",
      icon: "✓",
    },
  ];

  return (
    <section className="py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-display)] text-center mb-6">
          How it works
        </h2>
        <p
          className="text-center mb-20 max-w-xl mx-auto"
          style={{ color: "var(--color-muted)" }}
        >
          Three phases. Every step traceable. Every decision explainable.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {phases.map((phase) => (
            <div
              key={phase.title}
              className="rounded-lg border p-8"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
            >
              <div
                className="text-2xl mb-4 font-[family-name:var(--font-mono)]"
                style={{ color: "var(--color-accent)" }}
              >
                {phase.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{phase.title}</h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--color-muted)" }}
              >
                {phase.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Routing Trace Section ───────────────────────────────────────────────────

function RoutingTrace() {
  const traceJson = `{
  "runId": "run_20260613_k7m2x1",
  "task": "Build an AI support agent",
  "status": "completed",
  "totalCostUsd": 0.0087,
  "totalLatencyMs": 4218,
  "steps": [
    {
      "stepId": "step_001",
      "type": "reasoning",
      "model": "claude-sonnet-4.6",
      "reason": "best-fit",
      "confidence": 0.92,
      "costUsd": 0.0034,
      "latencyMs": 2103,
      "evaluation": { "passed": true }
    },
    {
      "stepId": "step_002",
      "type": "code-gen",
      "model": "gpt-4.1",
      "reason": "user-preferred",
      "confidence": 0.95,
      "costUsd": 0.0021,
      "latencyMs": 1342,
      "evaluation": { "passed": true }
    },
    {
      "stepId": "step_003",
      "type": "writing",
      "model": "gemini-3.5-flash",
      "reason": "best-fit",
      "confidence": 0.88,
      "costUsd": 0.0002,
      "latencyMs": 773,
      "evaluation": { "passed": true }
    }
  ]
}`;

  return (
    <section className="py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-display)] text-center mb-6">
          Real routing trace
        </h2>
        <p
          className="text-center mb-12 max-w-xl mx-auto"
          style={{ color: "var(--color-muted)" }}
        >
          Every run produces a structured trace. See exactly which model was
          chosen, why, and what it cost.
        </p>

        <div
          className="rounded-lg border p-6 overflow-x-auto font-[family-name:var(--font-mono)] text-xs leading-relaxed"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <pre style={{ color: "var(--color-muted)" }}>
            <code>{traceJson}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}

// ─── Benchmarks Section ──────────────────────────────────────────────────────

function Benchmarks() {
  const data = [
    { approach: "Single Model (Claude)", cost: "$0.042", time: "12.4s", completion: "78%" },
    { approach: "Manual Switching", cost: "$0.028", time: "18.7s", completion: "85%" },
    { approach: "RouteWise", cost: "$0.009", time: "4.2s", completion: "94%", highlight: true },
  ];

  return (
    <section className="py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-display)] text-center mb-6">
          Benchmarks
        </h2>
        <p
          className="text-center mb-12 max-w-xl mx-auto"
          style={{ color: "var(--color-muted)" }}
        >
          Measured on a 7-step workflow: idea → plan → architecture → code →
          tests → docs → launch post.
        </p>

        <div
          className="rounded-lg border overflow-hidden"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b"
                style={{ borderColor: "var(--color-border)" }}
              >
                <th className="text-left px-6 py-4 font-medium" style={{ color: "var(--color-muted)" }}>Approach</th>
                <th className="text-right px-6 py-4 font-medium" style={{ color: "var(--color-muted)" }}>Cost</th>
                <th className="text-right px-6 py-4 font-medium" style={{ color: "var(--color-muted)" }}>Time</th>
                <th className="text-right px-6 py-4 font-medium" style={{ color: "var(--color-muted)" }}>Completion</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={row.approach}
                  className="border-b last:border-b-0"
                  style={{
                    borderColor: "var(--color-border)",
                    background: row.highlight ? "rgba(92, 225, 230, 0.04)" : undefined,
                  }}
                >
                  <td className="px-6 py-4" style={{ color: row.highlight ? "var(--color-accent)" : "var(--color-foreground)" }}>
                    {row.approach}
                  </td>
                  <td className="text-right px-6 py-4 font-[family-name:var(--font-mono)]" style={{ color: row.highlight ? "var(--color-accent)" : "var(--color-foreground)" }}>
                    {row.cost}
                  </td>
                  <td className="text-right px-6 py-4 font-[family-name:var(--font-mono)]" style={{ color: row.highlight ? "var(--color-accent)" : "var(--color-foreground)" }}>
                    {row.time}
                  </td>
                  <td className="text-right px-6 py-4 font-[family-name:var(--font-mono)]" style={{ color: row.highlight ? "var(--color-accent)" : "var(--color-foreground)" }}>
                    {row.completion}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─── Integrations Section ────────────────────────────────────────────────────

function Integrations() {
  const integrations = [
    "Claude Code",
    "Cursor",
    "MCP",
    "OpenAI",
    "Anthropic",
    "Vertex AI",
  ];

  return (
    <section className="py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-display)] mb-6">
          Works where you work
        </h2>
        <p className="mb-16" style={{ color: "var(--color-muted)" }}>
          Native MCP server for Claude Code and Cursor. Standalone CLI for
          terminal workflows.
        </p>

        <div className="flex flex-wrap justify-center gap-6">
          {integrations.map((name) => (
            <div
              key={name}
              className="px-6 py-3 rounded-md border text-sm font-medium"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-foreground)",
              }}
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Open Source Section ─────────────────────────────────────────────────────

function OpenSource() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-display)] mb-6">
          Open source. Apache 2.0.
        </h2>
        <p
          className="mb-12 max-w-lg mx-auto"
          style={{ color: "var(--color-muted)" }}
        >
          RouteWise is built in public. Contribute providers, evaluators,
          classification heuristics, or documentation.
        </p>

        <div className="flex flex-wrap justify-center gap-8 mb-12">
          {[
            { label: "TypeScript", value: "Strict" },
            { label: "Tests", value: "125+" },
            { label: "Providers", value: "3" },
            { label: "Models", value: "9" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-2xl font-semibold font-[family-name:var(--font-mono)]"
                style={{ color: "var(--color-accent)" }}
              >
                {stat.value}
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: "var(--color-muted)" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <a
          href="https://github.com/Bhavarth7/RouteWise"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-md border text-sm font-medium transition-all hover:opacity-80"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-foreground)",
          }}
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
          Star on GitHub
        </a>
      </div>
    </section>
  );
}

// ─── Roadmap Section ─────────────────────────────────────────────────────────

function Roadmap() {
  const items = [
    { label: "Core routing engine", done: true },
    { label: "CLI + MCP server", done: true },
    { label: "Anthropic + OpenAI + Vertex", done: true },
    { label: "Execution traces", done: true },
    { label: "Benchmark layer (auto-learn)", done: false },
    { label: "OpenRouter + Ollama", done: false },
    { label: "Web UI for traces", done: false },
    { label: "Team routing policies", done: false },
  ];

  return (
    <section className="py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-display)] text-center mb-16">
          Roadmap
        </h2>

        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-4 top-0 bottom-0 w-px"
            style={{ background: "var(--color-border)" }}
          />

          <div className="space-y-6">
            {items.map((item) => (
              <div key={item.label} className="flex items-center gap-4 pl-1">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10"
                  style={{
                    background: item.done
                      ? "var(--color-accent)"
                      : "var(--color-surface)",
                    color: item.done
                      ? "var(--color-background)"
                      : "var(--color-muted)",
                    border: item.done
                      ? "none"
                      : "1px solid var(--color-border)",
                  }}
                >
                  {item.done ? "✓" : "·"}
                </div>
                <span
                  style={{
                    color: item.done
                      ? "var(--color-foreground)"
                      : "var(--color-muted)",
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      className="py-12 px-6 border-t"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold">RouteWise</span>
          <span style={{ color: "var(--color-muted)" }}>·</span>
          <span className="text-sm" style={{ color: "var(--color-muted)" }}>
            Open-source AI workflow router
          </span>
        </div>
        <div className="flex gap-6 text-sm" style={{ color: "var(--color-muted)" }}>
          <a href="https://github.com/Bhavarth7/RouteWise" className="hover:underline">
            GitHub
          </a>
          <a href="https://github.com/Bhavarth7/RouteWise#quick-start" className="hover:underline">
            Docs
          </a>
          <a href="https://github.com/Bhavarth7/RouteWise/blob/main/LICENSE" className="hover:underline">
            Apache 2.0
          </a>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main>
      <Hero />
      <Problem />
      <HowItWorks />
      <RoutingTrace />
      <Benchmarks />
      <Integrations />
      <OpenSource />
      <Roadmap />
      <Footer />
    </main>
  );
}
