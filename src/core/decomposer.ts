import type { Provider } from '../providers/interface.js';
import type { DecomposedWorkflow, StepType, WorkflowStep } from '../types/index.js';

/** System prompt for the decomposer model call */
const DECOMPOSE_SYSTEM = `You are a workflow decomposer. Break the given task into ordered steps.
Each step must have: id, type, goal, inputs, expectedOutput.

Valid step types: reasoning, code-gen, summarization, writing, research, editing

Respond with JSON only, no markdown fences. Use this exact schema:
{
  "steps": [
    {
      "id": "step_001",
      "type": "reasoning",
      "goal": "What this step produces",
      "inputs": ["what it needs"],
      "expectedOutput": "Description of the expected artifact"
    }
  ]
}

Keep steps focused and atomic. Order them by dependency. Use 3-8 steps for most tasks.`;

/** Fallback templates for common task patterns */
const FALLBACK_TEMPLATES: Array<{ pattern: RegExp; steps: WorkflowStep[] }> = [
  {
    pattern: /\b(build|create|implement|make)\b.*\b(app|application|service|tool|cli|api)\b/i,
    steps: [
      {
        id: 'step_001',
        type: 'reasoning',
        goal: 'Plan architecture and components',
        inputs: ['user task'],
        expectedOutput: 'Technical plan with components and dependencies',
      },
      {
        id: 'step_002',
        type: 'code-gen',
        goal: 'Scaffold project structure',
        inputs: ['step_001'],
        expectedOutput: 'Project files and configuration',
      },
      {
        id: 'step_003',
        type: 'code-gen',
        goal: 'Implement core logic',
        inputs: ['step_001', 'step_002'],
        expectedOutput: 'Working implementation',
      },
      {
        id: 'step_004',
        type: 'code-gen',
        goal: 'Write tests',
        inputs: ['step_003'],
        expectedOutput: 'Test suite covering core functionality',
      },
      {
        id: 'step_005',
        type: 'writing',
        goal: 'Write documentation',
        inputs: ['step_003'],
        expectedOutput: 'README with setup and usage instructions',
      },
    ],
  },
  {
    pattern: /\b(write|create|draft)\b.*\b(doc|documentation|readme|guide)\b/i,
    steps: [
      {
        id: 'step_001',
        type: 'research',
        goal: 'Analyze codebase and existing docs',
        inputs: ['user task'],
        expectedOutput: 'Key features, API surface, and usage patterns',
      },
      {
        id: 'step_002',
        type: 'reasoning',
        goal: 'Plan documentation structure',
        inputs: ['step_001'],
        expectedOutput: 'Document outline with sections',
      },
      {
        id: 'step_003',
        type: 'writing',
        goal: 'Write documentation content',
        inputs: ['step_001', 'step_002'],
        expectedOutput: 'Complete documentation',
      },
      {
        id: 'step_004',
        type: 'editing',
        goal: 'Review and polish',
        inputs: ['step_003'],
        expectedOutput: 'Polished final documentation',
      },
    ],
  },
  {
    pattern: /\b(test|write tests|add tests)\b/i,
    steps: [
      {
        id: 'step_001',
        type: 'research',
        goal: 'Analyze code to test',
        inputs: ['user task'],
        expectedOutput: 'List of functions/paths to test',
      },
      {
        id: 'step_002',
        type: 'reasoning',
        goal: 'Plan test strategy',
        inputs: ['step_001'],
        expectedOutput: 'Test plan with cases and edge cases',
      },
      {
        id: 'step_003',
        type: 'code-gen',
        goal: 'Write test code',
        inputs: ['step_001', 'step_002'],
        expectedOutput: 'Test files with passing tests',
      },
    ],
  },
];

/** Default fallback when no template matches */
const GENERIC_TEMPLATE: WorkflowStep[] = [
  {
    id: 'step_001',
    type: 'reasoning',
    goal: 'Analyze task and plan approach',
    inputs: ['user task'],
    expectedOutput: 'Approach and plan',
  },
  {
    id: 'step_002',
    type: 'code-gen',
    goal: 'Implement the requested work',
    inputs: ['step_001'],
    expectedOutput: 'Implementation output',
  },
  {
    id: 'step_003',
    type: 'writing',
    goal: 'Document the result',
    inputs: ['step_002'],
    expectedOutput: 'Summary or documentation',
  },
];

/** Decompose a task into workflow steps using a model call */
export async function decompose(task: string, provider?: Provider): Promise<DecomposedWorkflow> {
  // Try model-based decomposition first
  if (provider?.isAvailable()) {
    try {
      const response = await provider.complete(
        `Decompose this task into ordered steps:\n\n${task}`,
        {
          system: DECOMPOSE_SYSTEM,
          temperature: 0.3,
          maxTokens: 2048,
          jsonMode: true,
        },
      );

      const parsed = parseDecomposition(response.content);
      if (parsed && parsed.steps.length > 0) {
        return parsed;
      }
    } catch {
      // Fall through to template-based decomposition
    }
  }

  // Fallback to template-based decomposition
  return { steps: getTemplateSteps(task) };
}

/** Parse JSON response into a DecomposedWorkflow */
function parseDecomposition(content: string): DecomposedWorkflow | null {
  try {
    // Strip markdown fences if present
    const cleaned = content
      .replace(/```json?\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const data = JSON.parse(cleaned) as { steps?: unknown[] };

    if (!data.steps || !Array.isArray(data.steps)) {
      return null;
    }

    const validTypes: StepType[] = [
      'reasoning',
      'code-gen',
      'summarization',
      'writing',
      'research',
      'editing',
    ];
    const steps: WorkflowStep[] = [];

    for (let i = 0; i < data.steps.length; i++) {
      const raw = data.steps[i] as Record<string, unknown>;
      const step: WorkflowStep = {
        id: typeof raw.id === 'string' ? raw.id : `step_${String(i + 1).padStart(3, '0')}`,
        type: validTypes.includes(raw.type as StepType) ? (raw.type as StepType) : 'reasoning',
        goal: typeof raw.goal === 'string' ? raw.goal : 'Complete step',
        inputs: Array.isArray(raw.inputs) ? (raw.inputs as string[]) : ['previous step'],
        expectedOutput: typeof raw.expectedOutput === 'string' ? raw.expectedOutput : 'Step output',
      };
      steps.push(step);
    }

    return { steps };
  } catch {
    return null;
  }
}

/** Get template steps for a task based on pattern matching */
function getTemplateSteps(task: string): WorkflowStep[] {
  for (const template of FALLBACK_TEMPLATES) {
    if (template.pattern.test(task)) {
      return template.steps;
    }
  }
  return GENERIC_TEMPLATE;
}

// Export for testing
export { getTemplateSteps, parseDecomposition };
