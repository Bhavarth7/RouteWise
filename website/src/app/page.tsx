"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const traceSteps = [
  { label: "Classify", detail: "reasoning → code-gen → writing" },
  { label: "Plan", detail: "3 steps decomposed" },
  { label: "Route Step 1", detail: "→ Claude Sonnet 4.6", accent: true },
  { label: "Route Step 2", detail: "→ GPT-4.1", accent: true },
  { label: "Route Step 3", detail: "→ Gemini 3.5 Flash", accent: true },
  { label: "Evaluate", detail: "3/3 passed" },
  { label: "Trace Generated", detail: "$0.0087 · 4.2s" },
];

const proofPoints = [
  "Multi-model routing",
  "MCP compatible",
  "Full execution trace",
  "Open source",
];

const withoutItems = [
  "Claude → wrong task",
  "GPT → expensive for simple work",
  "Cursor → no routing visibility",
  "MCP → manual tool switching",
  "Scripts → fragile, no traces",
];

const withItems = [
  "Task → Decompose → Route → Execute",
  "Best model per step, automatically",
  "Cost + latency tracked per step",
  "Full trace: why each model was chosen",
  "Works in Claude Code, Cursor, MCP",
];

const phases = [
  { num: "01", title: "Plan", description: "Decompose the task into ordered steps and classify each step type.", badge: "task graph" },
  { num: "02", title: "Route", description: "Select the best model per step within cost, latency, and quality constraints.", badge: "model plan" },
  { num: "03", title: "Verify", description: "Execute, evaluate output quality, and log a full trace with costs and routing decisions.", badge: "execution trace" },
];

const metrics = [
  { value: "78%", label: "cost reduction vs single model" },
  { value: "3×", label: "faster than manual switching" },
  { value: "94%", label: "task completion rate" },
  { value: "$0.009", label: "average routed cost" },
];

const benchmarkRows = [
  { approach: "Single Model (Claude)", cost: "$0.042", time: "12.4s", completion: "78%" },
  { approach: "Manual Switching", cost: "$0.028", time: "18.7s", completion: "85%" },
  { approach: "RouteWise", cost: "$0.009", time: "4.2s", completion: "94%", highlight: true },
];

const integrations = ["Claude Code", "Cursor", "MCP", "OpenAI", "Anthropic", "Vertex AI"];
const integrationsSub = ["OpenRouter", "Ollama", "LangGraph", "Terminal"];

const stats = [
  { value: "Strict", label: "TypeScript" },
  { value: "125+", label: "Tests" },
  { value: "3", label: "Providers" },
  { value: "9", label: "Models" },
];

const roadmapNow = ["Core routing engine", "CLI + MCP server", "Anthropic + OpenAI + Vertex", "Execution traces"];
const roadmapNext = ["Benchmark layer with auto-learn", "OpenRouter + Ollama", "Web UI for traces", "Team routing policies"];

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

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="h-10 flex items-center justify-center px-4 border-b text-xs font-mono" style={{ background: "rgba(92,225,230,0.06)", borderColor: "rgba(92,225,230,0.16)", color: "var(--color-accent)" }}>
        Open-source AI workflow router for Claude Code, Cursor, MCP, OpenAI, Anthropic, and Vertex AI
      </div>
      <nav className="h-16 flex items-center justify-between px-6 max-w-6xl mx-auto border-b backdrop-blur-xl" style={{ background: "rgba(7,10,15,0.72)", borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-8">
          <a href="/" className="text-sm font-semibold tracking-tight" style={{ color: "var(--color-foreground)" }}>RouteWise</a>
          <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: "var(--color-muted)" }}>
            <a href="#how-it-works" className="transition-colors hover:text-[var(--color-foreground)]">How it works</a>
            <a href="#benchmarks" className="transition-colors hover:text-[var(--color-foreground)]">Benchmarks</a>
            <a href="#integrations" className="transition-colors hover:text-[var(--color-foreground)]">Integrations</a>
            <a href="https://github.com/Bhavarth7/RouteWise#quick-start" className="transition-colors hover:text-[var(--color-foreground)]">Docs</a>
          </div>
        </div>
        <a href="https://github.com/Bhavarth7/RouteWise" className="flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium border transition-colors hover:border-[var(--color-border-strong)]" style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
          <GithubIcon />
          <span className="hidden sm:inline">Star on GitHub</span>
        </a>
      </nav>
    </header>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [typed, setTyped] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setTyped(true), 500);
    const timers = traceSteps.map((_, i) => setTimeout(() => setVisibleSteps(i + 1), 1000 + i * 130));
    return () => { clearTimeout(t1); timers.forEach(clearTimeout); };
  }, []);

  return (
    <section className="relative pt-[104px] hero-grid overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-32 right-1/4 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, #5CE1E6 0%, transparent 70%)" }} />
      <div className="absolute top-48 left-1/6 w-[400px] h-[400px] rounded-full opacity-15 blur-[100px] pointer-events-none" style={{ background: "radial-gradient(circle, #7C8BFF 0%, transparent 70%)" }} />

      <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        {/* Left: Copy */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6 border" style={{ background: "rgba(92,225,230,0.08)", borderColor: "rgba(92,225,230,0.2)", color: "var(--color-accent)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
            AI Workflow Router
          </div>

          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[0.92] tracking-[-0.04em] mb-5" style={{ color: "var(--color-foreground)" }}>
            Stop routing<br />AI work manually.
          </h1>

          <p className="text-base md:text-lg leading-[1.7] max-w-md mb-8" style={{ color: "var(--color-secondary)" }}>
            RouteWise decomposes workflows into steps, selects the best model for each, evaluates results, and generates a complete execution trace.
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            <a href="https://github.com/Bhavarth7/RouteWise#quick-start" className="px-5 py-2.5 rounded-md text-sm font-medium transition-all hover:opacity-90" style={{ background: "var(--color-accent)", color: "var(--color-background)" }}>
              Get Started
            </a>
            <a href="https://github.com/Bhavarth7/RouteWise" className="px-5 py-2.5 rounded-md text-sm font-medium border transition-colors hover:border-[var(--color-border-strong)]" style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
              View on GitHub
            </a>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {proofPoints.map((p) => (
              <span key={p} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-muted)" }}>
                <span style={{ color: "var(--color-accent)" }}>✓</span> {p}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Terminal trace */}
        <div className="rounded-xl border overflow-hidden" style={{ background: "var(--color-surface)", borderColor: "var(--color-border-strong)" }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-elevated)" }}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(248,113,113,0.6)" }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(251,191,36,0.6)" }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(52,211,153,0.6)" }} />
            </div>
            <span className="ml-2 text-xs font-mono" style={{ color: "var(--color-muted)" }}>routewise run</span>
          </div>

          <div className="p-4 font-mono text-sm space-y-0">
            <div className="mb-3">
              <span style={{ color: "var(--color-accent)" }}>$ </span>
              <span className={typed ? "" : "opacity-0"} style={{ color: "var(--color-foreground)" }}>
                routewise run &quot;Build an AI support agent&quot;
              </span>
              {!typed && <span className="animate-blink" style={{ color: "var(--color-accent)" }}>█</span>}
            </div>

            <div className="space-y-1">
              {traceSteps.map((step, i) => (
                <div key={step.label} className={`flex items-center gap-2.5 py-0.5 px-2 rounded transition-all duration-300 ${i < visibleSteps ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`} style={{ background: i === visibleSteps - 1 ? "rgba(92,225,230,0.06)" : "transparent" }}>
                  <span className="text-xs w-4 text-center" style={{ color: i < visibleSteps ? "var(--color-success)" : "var(--color-muted)" }}>
                    {i < visibleSteps ? "✓" : "·"}
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-foreground)" }}>{step.label}</span>
                  <span className="text-xs" style={{ color: step.accent ? "var(--color-accent-secondary)" : "var(--color-muted)" }}>{step.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Problem ─────────────────────────────────────────────────────────────────

function Problem() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionHeader title="The problem with multi-model workflows" />

        <div className="grid md:grid-cols-2 gap-4 mt-14">
          <div className="rounded-xl border p-6 md:p-8" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-5" style={{ color: "var(--color-muted)" }}>Without RouteWise</p>
            <div className="space-y-3 font-mono text-sm">
              {withoutItems.map((line) => (
                <div key={line} className="flex items-start gap-2.5">
                  <span className="mt-0.5" style={{ color: "var(--color-danger)" }}>✗</span>
                  <span style={{ color: "var(--color-muted)" }}>{line}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-6 md:p-8" style={{ background: "var(--color-surface)", borderColor: "rgba(92,225,230,0.2)", boxShadow: "0 0 60px -20px rgba(92,225,230,0.08)" }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-5" style={{ color: "var(--color-accent)" }}>With RouteWise</p>
            <div className="space-y-3 font-mono text-sm">
              {withItems.map((line) => (
                <div key={line} className="flex items-start gap-2.5">
                  <span className="mt-0.5" style={{ color: "var(--color-success)" }}>✓</span>
                  <span style={{ color: "var(--color-foreground)" }}>{line}</span>
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
  return (
    <section id="how-it-works" className="py-24 md:py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionHeader title="Decompose. Route. Verify." subtitle="Three phases. Every step traceable. Every decision explainable." />

        <div className="grid md:grid-cols-3 gap-4 mt-14">
          {phases.map((phase) => (
            <div key={phase.num} className="group rounded-xl border p-6 md:p-8 transition-all duration-200 hover:-translate-y-1 hover:border-[rgba(92,225,230,0.22)]" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <span className="text-xs font-mono block mb-4" style={{ color: "var(--color-accent)" }}>{phase.num}</span>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>{phase.title}</h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--color-secondary)" }}>{phase.description}</p>
              <span className="inline-block px-2.5 py-1 rounded text-xs font-mono border" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>{phase.badge}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Trace Section ───────────────────────────────────────────────────────────

function TraceSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(traceJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">
        {/* Left: Copy */}
        <div>
          <SectionHeader title="Real routing trace" align="left" />
          <p className="text-sm leading-relaxed mt-4 mb-6" style={{ color: "var(--color-secondary)" }}>
            Every run produces a structured trace. See exactly which model was chosen, why, and what it cost.
          </p>
          <div className="space-y-2.5">
            {["Model selected", "Reason recorded", "Cost tracked", "Latency measured", "Evaluation logged"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <span style={{ color: "var(--color-accent)" }}>·</span>
                <span style={{ color: "var(--color-secondary)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Code card */}
        <div className="rounded-xl border overflow-hidden" style={{ background: "var(--color-surface)", borderColor: "var(--color-border-strong)" }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-elevated)" }}>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono" style={{ color: "var(--color-muted)" }}>trace.json</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: "rgba(52,211,153,0.12)", color: "var(--color-success)" }}>completed</span>
            </div>
            <button onClick={handleCopy} aria-label="Copy trace JSON" className="text-xs font-mono px-2.5 py-1 rounded border transition-colors hover:border-[var(--color-border-strong)]" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="p-4 overflow-x-auto font-mono text-xs leading-[1.7]">
            <pre style={{ color: "var(--color-muted)" }}><code>{traceJson}</code></pre>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Benchmarks ──────────────────────────────────────────────────────────────

function Benchmarks() {
  return (
    <section id="benchmarks" className="py-24 md:py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionHeader title="Benchmarks" subtitle="Measured on a 7-step workflow: idea → plan → architecture → code → tests → docs → launch post." />

        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-14 mb-6">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-xl border p-4 text-center transition-colors hover:border-[rgba(92,225,230,0.18)]" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <div className="text-2xl md:text-3xl font-semibold font-mono" style={{ color: "var(--color-accent)" }}>{m.value}</div>
              <div className="text-xs mt-1.5" style={{ color: "var(--color-muted)" }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                <th className="text-left px-5 py-3.5 text-xs font-medium" style={{ color: "var(--color-muted)" }}>Approach</th>
                <th className="text-right px-5 py-3.5 text-xs font-medium" style={{ color: "var(--color-muted)" }}>Cost</th>
                <th className="text-right px-5 py-3.5 text-xs font-medium" style={{ color: "var(--color-muted)" }}>Time</th>
                <th className="text-right px-5 py-3.5 text-xs font-medium" style={{ color: "var(--color-muted)" }}>Completion</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkRows.map((row) => (
                <tr key={row.approach} className="border-b last:border-b-0" style={{ borderColor: "var(--color-border)", background: row.highlight ? "rgba(92,225,230,0.05)" : undefined }}>
                  <td className="px-5 py-3" style={{ color: row.highlight ? "var(--color-accent)" : "var(--color-foreground)" }}>{row.approach}</td>
                  <td className="text-right px-5 py-3 font-mono" style={{ color: row.highlight ? "var(--color-accent)" : "var(--color-foreground)" }}>{row.cost}</td>
                  <td className="text-right px-5 py-3 font-mono" style={{ color: row.highlight ? "var(--color-accent)" : "var(--color-foreground)" }}>{row.time}</td>
                  <td className="text-right px-5 py-3 font-mono" style={{ color: row.highlight ? "var(--color-accent)" : "var(--color-foreground)" }}>{row.completion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─── Integrations ────────────────────────────────────────────────────────────

function IntegrationsSection() {
  return (
    <section id="integrations" className="py-24 md:py-32 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <SectionHeader title="Works where you work" subtitle="Native MCP server for Claude Code and Cursor. Standalone CLI for terminal workflows." />

        <div className="flex flex-wrap justify-center gap-3 mt-14">
          {integrations.map((name) => (
            <div key={name} className="px-5 py-2.5 rounded-lg border text-sm font-medium transition-all hover:border-[rgba(92,225,230,0.22)] hover:shadow-[0_0_20px_-8px_rgba(92,225,230,0.15)]" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
              {name}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {integrationsSub.map((name) => (
            <span key={name} className="px-3 py-1.5 rounded text-xs font-mono" style={{ color: "var(--color-muted)", background: "var(--color-surface)" }}>
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Open Source ─────────────────────────────────────────────────────────────

function OpenSource() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl border p-8 md:p-12 text-center" style={{ background: "var(--color-surface)", borderColor: "var(--color-border-strong)" }}>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3" style={{ color: "var(--color-foreground)" }}>Open source. Apache 2.0.</h2>
          <p className="text-sm mb-10 max-w-md mx-auto" style={{ color: "var(--color-secondary)" }}>
            RouteWise is built in public. Contribute providers, evaluators, classification heuristics, or documentation.
          </p>

          {/* Architecture mini-diagram */}
          <div className="flex items-center justify-center gap-2 mb-10 text-xs font-mono" style={{ color: "var(--color-muted)" }}>
            <span className="px-2 py-1 rounded border" style={{ borderColor: "var(--color-border)" }}>CLI</span>
            <span>→</span>
            <span className="px-2 py-1 rounded border" style={{ borderColor: "var(--color-border)" }}>Router</span>
            <span>→</span>
            <span className="px-2 py-1 rounded border" style={{ borderColor: "var(--color-border)" }}>Providers</span>
            <span>→</span>
            <span className="px-2 py-1 rounded border" style={{ borderColor: "var(--color-border)" }}>Trace</span>
          </div>

          <div className="flex flex-wrap justify-center gap-8 mb-10">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-xl font-semibold font-mono" style={{ color: "var(--color-accent)" }}>{s.value}</div>
                <div className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          <a href="https://github.com/Bhavarth7/RouteWise" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all hover:opacity-90" style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
            <GithubIcon />
            Star on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Roadmap ─────────────────────────────────────────────────────────────────

function Roadmap() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <SectionHeader title="Roadmap" />

        <div className="grid md:grid-cols-2 gap-4 mt-14">
          <div className="rounded-xl border p-6" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-5" style={{ color: "var(--color-success)" }}>Available now</p>
            <div className="space-y-3">
              {roadmapNow.map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "var(--color-accent)", color: "var(--color-background)" }}>✓</span>
                  <span style={{ color: "var(--color-foreground)" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-6" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-5" style={{ color: "var(--color-accent-secondary)" }}>Coming next</p>
            <div className="space-y-3">
              {roadmapNext.map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center border" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-muted)" }} />
                  </span>
                  <span style={{ color: "var(--color-muted)" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ───────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="rounded-xl border p-10 md:p-14 relative overflow-hidden" style={{ background: "var(--color-surface)", borderColor: "var(--color-border-strong)" }}>
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(92,225,230,0.08) 0%, transparent 70%)" }} />
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4 relative" style={{ color: "var(--color-foreground)" }}>Stop routing AI work manually.</h2>
          <p className="text-sm mb-8 relative" style={{ color: "var(--color-secondary)" }}>Give every workflow a planner, router, evaluator, and trace.</p>
          <div className="flex flex-wrap gap-3 justify-center relative">
            <a href="https://github.com/Bhavarth7/RouteWise#quick-start" className="px-5 py-2.5 rounded-md text-sm font-medium transition-all hover:opacity-90" style={{ background: "var(--color-accent)", color: "var(--color-background)" }}>
              Get Started
            </a>
            <a href="https://github.com/Bhavarth7/RouteWise" className="px-5 py-2.5 rounded-md text-sm font-medium border transition-colors hover:border-[var(--color-border-strong)]" style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="py-8 px-6 border-t" style={{ borderColor: "var(--color-border)" }}>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>RouteWise</span>
          <span style={{ color: "var(--color-border-strong)" }}>·</span>
          <span className="text-xs" style={{ color: "var(--color-muted)" }}>Open-source AI workflow router</span>
        </div>
        <div className="flex gap-5 text-xs" style={{ color: "var(--color-muted)" }}>
          <a href="https://github.com/Bhavarth7/RouteWise" className="transition-colors hover:text-[var(--color-foreground)]">GitHub</a>
          <a href="https://github.com/Bhavarth7/RouteWise#quick-start" className="transition-colors hover:text-[var(--color-foreground)]">Docs</a>
          <a href="https://github.com/Bhavarth7/RouteWise/blob/main/LICENSE" className="transition-colors hover:text-[var(--color-foreground)]">Apache 2.0</a>
        </div>
      </div>
    </footer>
  );
}

// ─── Shared Components ───────────────────────────────────────────────────────

function SectionHeader({ title, subtitle, align = "center" }: { title: string; subtitle?: string; align?: "center" | "left" }) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-[-0.03em] leading-[0.95]" style={{ color: "var(--color-foreground)" }}>{title}</h2>
      {subtitle && <p className="text-sm mt-3 max-w-lg mx-auto" style={{ color: "var(--color-secondary)" }}>{subtitle}</p>}
    </div>
  );
}

function GithubIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <TraceSection />
        <Benchmarks />
        <IntegrationsSection />
        <OpenSource />
        <Roadmap />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
