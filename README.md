# RouteWise

**Open-Source Step-Level Router for AI Agents, Claude Code, Cursor & MCP**

> Stop choosing AI models manually. RouteWise automatically decomposes workflows, routes each step to the best model/tool, evaluates outputs, and generates a complete execution trace.

[![npm version](https://img.shields.io/npm/v/routewise)](https://www.npmjs.com/package/routewise)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](tsconfig.json)

---

<!-- TODO: Add terminal GIF demo here -->
<!-- ![RouteWise Demo](docs/assets/demo.gif) -->

## Why RouteWise?

Every AI workflow has steps that need different models. Debugging needs deep reasoning. Summarization needs speed. Code generation needs accuracy. Documentation needs clarity.

**The problem:**
- You manually switch between Claude, GPT, Gemini, and local tools
- Simple tasks get expensive when you send everything to one premium model
- Complex workflows get routed poorly because you guess instead of measure
- No visibility into why a model was chosen or how much it cost
- Claude Code and Cursor don't tell you which model would be best for each step

**RouteWise solves this** by sitting between your workflow and your models. It decomposes tasks into steps, classifies each step, selects the right model within your constraints (cost, latency, quality, privacy), executes, evaluates, and traces every decision.

Works with Claude Code, Cursor, any MCP client, or standalone from the terminal.

---

## Quick Start

Install and run your first workflow in under 60 seconds:

```bash
# Install
npm install -g routewise

# Set your API keys (use whichever providers you have)
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
export VERTEX_PROJECT_ID="my-project"  # Optional: for Gemini models

# Run a workflow
routewise run "Fix the failing authentication test and update docs"
```

### Example Output

```
routewise — running workflow
Task: Fix the failing authentication test and update docs

step_001 [reasoning] Plan the debugging approach
  → claude-sonnet-4.6 (best-fit, confidence: 90%)
  ✓ passed ($0.0032, 2847ms)

step_002 [code-gen] Fix the authentication middleware
  → claude-sonnet-4.6 (user-preferred, confidence: 95%)
  ✓ passed ($0.0058, 3201ms)

step_003 [code-gen] Update test assertions
  → gpt-4.1 (fallback, confidence: 80%)
  ✓ passed ($0.0019, 1843ms)

step_004 [writing] Update authentication documentation
  → gemini-3.5-flash (best-fit, confidence: 90%)
  ✓ passed ($0.0002, 892ms)

✓ completed — 4 steps, 4 passed
Cost: $0.0111 │ Time: 8.8s
Trace: .routewise/runs/run_20260613_k7m2x1/
```

Every decision is logged. Every cost is tracked. Every step is traceable.

---

## How It Works

```
User Task (natural language)
     │
     ▼
┌─────────────┐
│  Decomposer │  Breaks task into ordered steps
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Classifier  │  Labels: reasoning | code-gen | summarization | writing | research | editing
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Router    │  Picks best model per step within constraints (cost, latency, quality)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Executor   │  Calls the selected model with step context
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Evaluator  │  Scores output quality with heuristics + human verdict
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Trace     │  Logs: model, reason, cost, latency, quality, verdict
└─────────────┘
```

RouteWise is not another AI wrapper. It's infrastructure — a routing layer that makes multi-model workflows automatic, traceable, and cost-efficient.

---

## Supported Integrations

### Claude Code

RouteWise works as an MCP server inside Claude Code. Add it to your MCP config:

```json
{
  "mcpServers": {
    "routewise": {
      "command": "npx",
      "args": ["-y", "routewise", "serve"]
    }
  }
}
```

Claude Code can then call `routewise_run`, `routewise_step`, `routewise_trace`, and `routewise_models` as tools — getting step-level routing without leaving the Claude Code workflow.

### Cursor

Use RouteWise as an MCP server in Cursor's agent mode. Same config as above — Cursor's MCP integration discovers RouteWise tools automatically. Your Cursor agent can route individual steps to different models based on the task type.

### MCP (Model Context Protocol)

RouteWise implements a full MCP server with four tools:

| Tool | Description |
|------|-------------|
| `routewise_run` | Decompose and execute a full workflow |
| `routewise_step` | Route and execute a single step |
| `routewise_trace` | Retrieve routing trace (why each model was chosen) |
| `routewise_models` | List available models with costs and capabilities |

Any MCP client (Claude Code, Cursor, VS Code agents, custom agents) can call these tools.

### Standalone CLI

Use RouteWise directly from the terminal — no IDE required:

```bash
routewise run "Build an MVP for a todo app with auth"
routewise step "Summarize this PR" --type summarization
routewise trace --run run_20260613_k7m2x1
routewise models
```

### Providers

| Provider | Models | Status |
|----------|--------|--------|
| **Anthropic** | Claude Opus 4.8, Sonnet 4.6, Haiku 4.5 | ✅ Supported |
| **OpenAI** | GPT-5.5, o3, GPT-4.1 | ✅ Supported |
| **Google Vertex AI** | Gemini 3.5 Flash, 3.1 Pro, 3.1 Flash Lite | ✅ Supported |
| Local models (Ollama) | Any | 🔜 Planned |
| OpenRouter | Any | 🔜 Planned |

---

## Example Workflows

RouteWise shines when a task has steps that need different strengths:

```bash
# Fix a bug — needs reasoning + code + testing
routewise run "Fix the race condition in the checkout flow"

# Generate tests — needs code analysis + code generation
routewise run "Write comprehensive tests for the auth module"

# Create a design document — needs research + reasoning + writing
routewise run "Create an architecture design for the new payment system"

# Build an MVP — needs planning + code + docs + content
routewise run "Build an MVP for a URL shortener with analytics"

# Launch content — needs writing + editing + summarization
routewise run "Create launch post, demo script, and README for the new feature"
```

---

## Routing Trace

Every run produces a trace at `.routewise/runs/<run_id>/`:

```
.routewise/runs/run_20260613_k7m2x1/
├── trace.json       # Run metadata (cost, time, status)
├── steps.jsonl      # Per-step decisions (one JSON per line)
└── artifacts/       # Step outputs
```

### trace.json

```json
{
  "runId": "run_20260613_k7m2x1",
  "task": "Fix the failing authentication test",
  "status": "completed",
  "totalSteps": 4,
  "totalCostUsd": 0.0111,
  "totalLatencyMs": 8783,
  "constraints": { "maxCostPerRun": 0.50, "maxLatencyPerStep": 30000 }
}
```

### steps.jsonl (one line per step)

```json
{
  "stepId": "step_001",
  "type": "reasoning",
  "goal": "Plan debugging approach",
  "model": "claude-sonnet-4.6",
  "provider": "anthropic",
  "reason": "best-fit",
  "confidence": 0.9,
  "costUsd": 0.0032,
  "latencyMs": 2847,
  "evaluation": { "passed": true, "checks": ["ordered-items: OK", "min-length: OK"] }
}
```

View any trace with `routewise trace` or `routewise trace --run <id>`.

---

## Comparison

| Feature | RouteWise | Claude Code alone | Cursor alone | Single-model scripts |
|---------|-----------|-------------------|--------------|---------------------|
| Step-level routing | ✅ Per-step model selection | ❌ One model | ❌ One model | ❌ One model |
| Cost awareness | ✅ Budget constraints | ❌ No visibility | ❌ No visibility | ❌ Manual tracking |
| Execution traces | ✅ Full trace per run | ❌ No traces | ❌ No traces | ❌ Manual logging |
| Multi-provider | ✅ Anthropic + OpenAI + Vertex | ⚠️ Anthropic only | ⚠️ Limited | ❌ One SDK |
| MCP integration | ✅ Native MCP server | ✅ MCP client | ✅ MCP client | ❌ None |
| Human verdict | ✅ Accept/reject per step | ❌ N/A | ❌ N/A | ❌ N/A |
| Workflow decomposition | ✅ Automatic | ❌ Manual | ❌ Manual | ❌ Manual |
| Quality evaluation | ✅ Per-step heuristics | ❌ N/A | ❌ N/A | ❌ N/A |

RouteWise doesn't replace Claude Code or Cursor — it makes them better by adding step-level routing intelligence underneath.

---

## Configuration

Create `routewise.config.ts` (or run `routewise init`):

```typescript
import { defineConfig } from 'routewise';

export default defineConfig({
  providers: {
    anthropic: { apiKey: 'env:ANTHROPIC_API_KEY' },
    openai: { apiKey: 'env:OPENAI_API_KEY' },
    vertex: {
      projectId: 'env:VERTEX_PROJECT_ID',
      location: 'us-central1',
    },
  },
  constraints: {
    maxCostPerRun: 0.50,        // USD
    maxCostPer1kTokens: 0.02,   // USD
    maxLatencyPerStep: 30_000,  // ms
    preferredProviders: ['anthropic', 'openai', 'vertex'],
    privacyLevel: 'standard',
  },
  routing: {
    reasoning:      { prefer: 'claude-sonnet-4.6', fallback: 'gpt-4.1' },
    'code-gen':     { prefer: 'claude-sonnet-4.6', fallback: 'gpt-4.1' },
    summarization:  { prefer: 'gemini-3.1-flash-lite', fallback: 'claude-haiku-4.5' },
    writing:        { prefer: 'claude-sonnet-4.6', fallback: 'gpt-4.1' },
    research:       { prefer: 'gemini-3.1-pro', fallback: 'gpt-5.5' },
    editing:        { prefer: 'gemini-3.5-flash', fallback: 'claude-haiku-4.5' },
  },
  trace: {
    store: 'local',
    directory: '.routewise/runs',
  },
});
```

Zero-config works too — RouteWise uses sensible defaults with just API keys set as environment variables.

---

## Available Models

```bash
$ routewise models
```

| Model | Provider | Cost/1k | Latency | Quality | Best For |
|-------|----------|---------|---------|---------|----------|
| claude-opus-4.8 | Anthropic | $0.015 | 8000ms | 0.98 | Complex reasoning, hard problems |
| claude-sonnet-4.6 | Anthropic | $0.003 | 3000ms | 0.92 | Daily driver, code, writing |
| claude-haiku-4.5 | Anthropic | $0.00025 | 800ms | 0.75 | Instant text, simple tasks |
| gpt-5.5 | OpenAI | $0.005 | 4000ms | 0.95 | Autonomous agents |
| o3 | OpenAI | $0.01 | 15000ms | 0.97 | STEM, science, thinking |
| gpt-4.1 | OpenAI | $0.002 | 2500ms | 0.90 | General versatility |
| gemini-3.5-flash | Vertex | $0.0001 | 1000ms | 0.82 | Fast multimodal |
| gemini-3.1-pro | Vertex | $0.00125 | 3500ms | 0.91 | Deep reasoning, huge context |
| gemini-3.1-flash-lite | Vertex | $0.00005 | 500ms | 0.70 | Cheapest, simplest tasks |

Adding a new model is one entry in `src/providers/models.ts` — it auto-registers everywhere.

---

## CLI Reference

| Command | Description |
|---------|-------------|
| `routewise run "<task>"` | Decompose and execute a full workflow |
| `routewise run "<task>" --no-confirm` | Skip human verdict prompts |
| `routewise step "<prompt>"` | Route and execute a single step |
| `routewise step --type code-gen "<prompt>"` | Override classification |
| `routewise trace` | Show latest routing trace |
| `routewise trace --run <id>` | Show specific trace |
| `routewise models` | List available models |
| `routewise init` | Create config file |
| `routewise config check` | Validate config |
| `routewise serve` | Start MCP server (stdio) |

---

## Architecture

```
routewise/
├── src/
│   ├── cli/        → CLI commands (run, step, trace, init, serve, models)
│   ├── core/       → Routing engine (classifier, selector, executor, evaluator, decomposer, router)
│   ├── config/     → Config schema, loader, defaults (Zod validation)
│   ├── providers/  → Model adapters (Anthropic, OpenAI, Vertex) + model catalog
│   ├── mcp/        → MCP server (4 tools for Claude Code, Cursor, any MCP client)
│   └── trace/      → Trace storage and rendering
├── tests/          → Unit tests (125 passing)
└── dist/           → Built CLI + library
```

---

## Adding New Models (Plug and Play)

Edit `src/providers/models.ts`:

```typescript
{
  id: 'your-new-model',
  provider: 'openai',
  capabilities: ['reasoning', 'code-gen', 'writing'],
  costPer1kTokens: 0.004,
  p95LatencyMs: 2000,
  qualityScore: 0.93,
  contextWindow: 256000,
  supportsStructuredOutput: true,
  tags: ['new-feature'],
  metadata: { description: 'Your model description' },
}
```

It immediately appears in routing, `routewise models`, and MCP tools. No other files to touch.

---

## Adding New Providers

1. Create `src/providers/your-provider.ts` implementing the `Provider` interface
2. Add model entries to `src/providers/models.ts`
3. Register in `src/cli/setup.ts` (3 lines)

The `Provider` interface is intentionally minimal:

```typescript
interface Provider {
  name: string;
  complete(prompt: string, options?: ProviderCompleteOptions): Promise<ProviderResponse>;
  completeWithModel(model: string, prompt: string, options?: ProviderCompleteOptions): Promise<ProviderResponse>;
  isAvailable(): boolean;
  listModels(): string[];
}
```

---

## Roadmap

- [x] Core routing engine (classify → select → execute → evaluate → trace)
- [x] CLI with full workflow support
- [x] MCP server (Claude Code, Cursor, any MCP client)
- [x] Anthropic provider (Opus 4.8, Sonnet 4.6, Haiku 4.5)
- [x] OpenAI provider (GPT-5.5, o3, GPT-4.1)
- [x] Google Vertex AI provider (Gemini 3.5 Flash, 3.1 Pro, 3.1 Flash Lite)
- [x] Human verdict (accept/reject per step)
- [x] Execution traces with full cost/latency tracking
- [ ] Benchmark layer (auto-improve routing from execution history)
- [ ] OpenRouter provider
- [ ] Ollama / local model provider
- [ ] Web UI for trace visualization
- [ ] Team features (shared routing policies)
- [ ] A/B testing between models
- [ ] Plugin system for custom evaluators

---

## Development

```bash
git clone https://github.com/your-org/routewise.git
cd routewise
pnpm install
pnpm build        # Build CLI + library
pnpm test         # Run 125 tests
pnpm typecheck    # Type check (strict mode)
pnpm lint         # Lint with Biome
```

---

## Contributing

RouteWise is open source and contributions are welcome. Areas where help is valuable:

- New provider adapters (OpenRouter, Ollama, Replicate)
- Better step classification heuristics
- Evaluation improvements
- Benchmark/comparison data
- Documentation and examples

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

Apache 2.0 — use RouteWise in your projects, teams, and products. See [LICENSE](LICENSE) for details.
