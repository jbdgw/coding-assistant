# Advanced Features Implementation Roadmap: Phases 2-7

This document outlines the remaining implementation phases for the Advanced Features project.

## ✅ Phase 1: Core Infrastructure (COMPLETED)

**Status**: Completed and committed to GitHub
**Commit**: `750d569`

### What Was Built:

- Plugin system (loader, registry, hooks)
- Agent mode manager with 5 pre-defined modes
- Enhanced analytics database schema
- Code quality analyzer with ESLint integration
- Ink + React dependencies installed

---

## 📋 Phase 2: Security Scanner & Check Command (Days 4-6)

### Objective

Build comprehensive code quality pipeline with security scanning capabilities.

### Components to Build

#### 1. Security Scanner (`src/lib/quality/security-scanner.ts`)

```typescript
interface SecurityIssue {
  type: 'dependency-vulnerability' | 'hardcoded-secret' | 'sql-injection' | 'xss' | 'insecure-dependency';
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line?: number;
  description: string;
  recommendation: string;
  cve?: string; // For vulnerability issues
}

class SecurityScanner {
  async scanDependencies(): Promise<SecurityIssue[]>;
  async scanForSecrets(patterns: string[]): Promise<SecurityIssue[]>;
  async scanCodePatterns(): Promise<SecurityIssue[]>;
}
```

**Features:**

- Run `npm audit` and parse results
- Regex-based secret detection (API keys, passwords, tokens)
- Common vulnerability pattern detection
- Integration with existing ESLint security plugins

#### 2. Check Command (`src/commands/check.ts`)

```bash
my-cli check [path]
  --fix              # Auto-fix issues where possible
  --security-only    # Only run security scans
  --quality-only     # Only run quality checks
  --report <format>  # Output format: text, json, html
  --fail-on <level>  # Exit with error on: error, warning, smell
```

**Workflow:**

1. Run CodeAnalyzer (ESLint)
2. Run SecurityScanner
3. Aggregate results
4. Display formatted report
5. Optionally fail CI/CD based on severity

#### 3. Pre-commit Integration

Update `.husky/pre-commit` to optionally run `my-cli check --staged`

### Testing Requirements

- Test with intentional security issues
- Test with various code smells
- Verify auto-fix functionality
- Test report generation

---

## 📋 Phase 3: Testing Intelligence (Days 7-9)

### Objective

AI-powered test generation, execution in E2B, and coverage analysis.

### Components to Build

#### 1. Test Generator (`src/lib/testing/test-generator.ts`)

```typescript
interface TestGeneratorOptions {
  framework: 'vitest' | 'jest' | 'mocha';
  coverage: 'unit' | 'integration' | 'e2e';
  style: 'describe' | 'test';
}

class TestGenerator {
  async generateTests(code: string, options: TestGeneratorOptions): Promise<string>;
  async analyzeGaps(file: string, existingTests: string[]): Promise<string[]>;
}
```

**Features:**

- Use AI to generate test cases for functions/classes
- Analyze existing tests to find coverage gaps
- Generate edge case tests
- Support multiple test frameworks

#### 2. Test Runner (`src/lib/testing/test-runner.ts`)

```typescript
interface TestRunResult {
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  failureDetails: Array<{ test: string; error: string }>;
}

class TestRunner {
  async runInE2B(testFiles: string[]): Promise<TestRunResult>;
  async runLocally(command: string): Promise<TestRunResult>;
  async runWithCoverage(): Promise<TestRunResult & { coverage: CoverageReport }>;
}
```

**Features:**

- Execute tests in E2B sandbox (isolated from local)
- Run in parallel with local tests
- Compare results (E2B vs local)
- Timeout handling

#### 3. Coverage Analyzer (`src/lib/testing/coverage-analyzer.ts`)

```typescript
interface CoverageReport {
  lines: number;
  functions: number;
  branches: number;
  statements: number;
  uncoveredLines: number[];
}

class CoverageAnalyzer {
  async analyze(coverageFile: string): Promise<CoverageReport>;
  async visualize(report: CoverageReport): string; // Terminal visualization
  async suggestTests(uncoveredCode: string[]): Promise<string[]>;
}
```

#### 4. Mastra Tools Integration

- `generate_tests` tool for agent
- `run_tests` tool for agent
- `analyze_coverage` tool for agent

#### 5. Enhanced Test Command (`src/commands/test.ts`)

```bash
my-cli test
  --generate         # Generate tests with AI
  --e2b              # Run in E2B sandbox
  --coverage         # Include coverage report
  --suggest          # Suggest missing test cases
  --watch            # Watch mode
```

### Testing Requirements

- Test generation for various code patterns
- E2B test execution
- Coverage report parsing
- Test suggestion quality

---

## 📋 Phase 4: Rich Terminal UI with Ink (Days 10-14)

### Objective

Build interactive TUI with split-view chat, dashboard, and real-time updates.

### Components to Build

#### 1. Main App Component (`src/tui/App.tsx`)

```tsx
interface AppState {
  view: 'dashboard' | 'chat' | 'files' | 'insights';
  session: Session;
  messages: Message[];
  cost: number;
}

export function App(): JSX.Element {
  // Main container with header, content, footer
}
```

#### 2. Dashboard Component (`src/tui/components/Dashboard.tsx`)

```tsx
export function Dashboard({ session, stats }: DashboardProps): JSX.Element {
  return (
    <Box flexDirection="column">
      <Header session={session} />
      <Stats stats={stats} />
      <ActivityLog limit={10} />
    </Box>
  );
}
```

**Shows:**

- Current session info
- Active model and mode
- Token usage and cost
- Recent activity
- Quick actions

#### 3. ChatView Component (`src/tui/components/ChatView.tsx`)

```tsx
export function ChatView({ messages, onSend }: ChatViewProps): JSX.Element {
  return (
    <Box flexDirection="row" height="100%">
      <Box width="60%" flexDirection="column">
        <MessageList messages={messages} />
        <TextInput onSubmit={onSend} />
      </Box>
      <Box width="40%">
        <OutputPane />
      </Box>
    </Box>
  );
}
```

**Features:**

- Split view (60/40 chat/output)
- Syntax highlighting for code blocks
- Streaming message display
- Auto-scroll
- Input history (↑/↓ arrows)

#### 4. FileBrowser Component (`src/tui/components/FileBrowser.tsx`)

```tsx
export function FileBrowser({ cwd, onSelect }: FileBrowserProps): JSX.Element {
  // Interactive file tree
  // Arrow keys to navigate
  // Enter to select
  // Shows file status (modified, added, deleted)
}
```

#### 5. CostMeter Widget (`src/tui/components/CostMeter.tsx`)

```tsx
export function CostMeter({ current, budget }: CostMeterProps): JSX.Element {
  const percentage = (current / budget) * 100;
  return (
    <Box>
      <Text>
        Cost: ${current.toFixed(4)} / ${budget.toFixed(2)}
      </Text>
      <ProgressBar percentage={percentage} color={getColor(percentage)} />
    </Box>
  );
}
```

#### 6. ProgressBar Component (`src/tui/components/ProgressBar.tsx`)

Reusable progress bar for operations (testing, indexing, etc.)

#### 7. State Management (`src/tui/hooks/useChatState.tsx`)

```tsx
export function useChatState() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (content: string) => {
    // Send to agent, stream response
  };

  return { messages, isTyping, sendMessage };
}
```

#### 8. TUI Command (`src/commands/tui.ts`)

```bash
my-cli tui
  --session <id>     # Resume session
  --mode <name>      # Start in specific mode
  --model <id>       # Use specific model
```

**Launches Ink app with:**

- Initial dashboard
- Tab to switch views (Dashboard, Chat, Files, Insights)
- Ctrl+C to exit gracefully
- All existing CLI commands work in TUI

### Testing Requirements

- Component rendering tests
- Keyboard interaction tests
- State management tests
- Integration with existing chat loop

---

## 📋 Phase 5: Agent Mode Implementations (Days 15-16)

### Objective

Integrate mode system with chat loop and add mode-specific behaviors.

### Components to Build

#### 1. Mode-Specific Agents

Create specialized agent configurations:

**Quick Fix Mode:**

- Uses GPT-4o-mini
- Max 3 steps
- Auto-applies simple changes
- Budget limit: $0.01

**Deep Dive Mode:**

- Uses Claude Sonnet 4.5
- Max 20 steps
- Asks for confirmation
- Budget limit: $1.00

**Learning Mode:**

- Uses Claude 3.5 Sonnet
- Explains every step
- Provides code examples
- Suggests further reading

**Review Mode:**

- Uses Claude 3.5 Sonnet
- Focuses on code quality, security, performance
- Generates detailed reports
- Suggests improvements

#### 2. Mode Command (`src/commands/mode.ts`)

```bash
my-cli mode list                    # List all modes
my-cli mode show <name>             # Show mode details
my-cli mode set <name>              # Switch to mode
my-cli mode create <name> [options] # Create custom mode
my-cli mode delete <name>           # Delete custom mode
my-cli mode reset                   # Reset to default
```

#### 3. Integration with Chat Loop

Update `src/lib/chat-loop-mastra.ts`:

```typescript
class MastraChatLoop {
  private modeManager: ModeManager;

  constructor(options: MastraChatLoopOptions) {
    this.modeManager = new ModeManager(config);
    // Apply mode config to agent
  }

  async switchMode(modeName: string) {
    this.modeManager.setMode(modeName);
    // Reinitialize agent with new mode config
  }
}
```

#### 4. Mode Indicators

- Display current mode in prompt
- Show mode info in TUI header
- Mode-specific color schemes

### Testing Requirements

- Test each mode with appropriate tasks
- Verify budget limits work
- Test mode switching mid-session
- Verify custom mode creation

---

## 📋 Phase 6: Analytics & Insights (Days 17-18)

### Objective

Generate AI-powered insights from usage data and visualize in terminal.

### Components to Build

#### 1. Insights Generator (`src/lib/analytics/insights-generator.ts`)

```typescript
interface Insight {
  category: 'productivity' | 'learning' | 'cost' | 'patterns';
  title: string;
  description: string;
  data: any;
  recommendations: string[];
}

class InsightsGenerator {
  async generateProductivityInsights(): Promise<Insight[]>;
  async generateLearningInsights(): Promise<Insight[]>;
  async generateCostInsights(): Promise<Insight[]>;
  async generatePatternInsights(): Promise<Insight[]>;
}
```

**Generates:**

- Most productive hours/days
- Learning progress (topics mastered)
- Cost optimization suggestions
- Common patterns and anti-patterns

#### 2. Analytics Tracker (`src/lib/analytics/tracker.ts`)

Extends existing usage tracker with:

- Daily stats aggregation
- Language/framework detection
- Productivity scoring
- Learning pattern tracking

#### 3. Visualizer (`src/lib/analytics/visualizer.ts`)

```typescript
class TerminalVisualizer {
  renderBarChart(data: ChartData): string;
  renderLineChart(data: ChartData): string;
  renderPieChart(data: ChartData): string;
  renderTable(data: TableData): string;
}
```

Uses ASCII/Unicode for terminal charts.

#### 4. Insights Command (`src/commands/insights.ts`)

```bash
my-cli insights
  --period <days>    # Analysis period (default: 30)
  --category <cat>   # Focus on specific category
  --export <file>    # Export to JSON/CSV
  --dashboard        # Launch interactive dashboard
```

#### 5. Insights Dashboard TUI (`src/tui/components/InsightsDashboard.tsx`)

Interactive dashboard showing:

- Productivity trends
- Learning progress
- Cost breakdown
- Usage patterns
- Recommendations

### Testing Requirements

- Test insight generation with sample data
- Verify visualizations render correctly
- Test data aggregation
- Validate recommendations

---

## 📋 Phase 7: Quality of Life Features (Days 19-21)

### Objective

Add convenience features for power users.

### Components to Build

#### 1. Keyboard Shortcuts (`src/lib/shortcuts/keyboard-handler.ts`)

```typescript
const shortcuts = {
  'Ctrl+E': exportSession,
  'Ctrl+T': runTests,
  'Ctrl+Q': checkQuality,
  'Ctrl+M': showModes,
  'Ctrl+S': saveSession,
  'Ctrl+I': showInsights,
  '/': focusSearch,
  '?': showHelp,
};
```

#### 2. Alias Manager (`src/lib/aliases/alias-manager.ts`)

```bash
my-cli alias add <name> <command>
my-cli alias remove <name>
my-cli alias list
my-cli alias show <name>

# Example:
my-cli alias add qf "chat --mode=quick-fix"
my-cli qf "fix the typo in README"
```

#### 3. Template System (`src/lib/templates/template-manager.ts`)

```bash
my-cli template list
my-cli template init <name> [path]
my-cli template create <name>
my-cli template delete <name>

# Built-in templates:
- react-ts: React + TypeScript + Vite
- node-cli: Node.js CLI with Commander
- express-api: Express REST API
- nextjs-app: Next.js app
```

#### 4. Favorites Manager (`src/lib/prompts/favorites-manager.ts`)

```bash
my-cli favorites add <name>    # Save last prompt
my-cli favorites list
my-cli favorites use <name>
my-cli favorites delete <name>

# Example:
my-cli favorites add explain-code
my-cli favorites use explain-code  # Runs saved prompt
```

#### 5. Session Exporter (`src/lib/export/session-exporter.ts`)

```typescript
class SessionExporter {
  async exportToMarkdown(sessionId: string): Promise<string>;
  async exportToHTML(sessionId: string): Promise<string>;
  async exportToJSON(sessionId: string): Promise<string>;
  async exportToPDF(sessionId: string): Promise<Buffer>;
}
```

```bash
my-cli export <session-id>
  --format <fmt>     # markdown, html, json, pdf
  --output <file>    # Output file path
  --include-code     # Include code blocks
  --include-cost     # Include cost breakdown
```

#### 6. Commands

- `src/commands/alias.ts`
- `src/commands/template.ts`
- `src/commands/export.ts`

### Testing Requirements

- Test keyboard shortcuts in TUI
- Verify alias expansion
- Test template scaffolding
- Verify exports in all formats

---

## File Structure Summary

```
src/
├── lib/
│   ├── quality/
│   │   ├── code-analyzer.ts ✅
│   │   ├── security-scanner.ts ⏳
│   │   └── smell-detector.ts ⏳
│   ├── testing/
│   │   ├── test-generator.ts ⏳
│   │   ├── test-runner.ts ⏳
│   │   └── coverage-analyzer.ts ⏳
│   ├── analytics/
│   │   ├── tracker.ts ⏳
│   │   ├── insights-generator.ts ⏳
│   │   └── visualizer.ts ⏳
│   ├── shortcuts/
│   │   └── keyboard-handler.ts ⏳
│   ├── aliases/
│   │   └── alias-manager.ts ⏳
│   ├── templates/
│   │   └── template-manager.ts ⏳
│   ├── prompts/
│   │   └── favorites-manager.ts ⏳
│   └── export/
│       └── session-exporter.ts ⏳
├── tui/
│   ├── App.tsx ⏳
│   ├── components/
│   │   ├── Dashboard.tsx ⏳
│   │   ├── ChatView.tsx ⏳
│   │   ├── FileBrowser.tsx ⏳
│   │   ├── CostMeter.tsx ⏳
│   │   ├── ProgressBar.tsx ⏳
│   │   └── InsightsDashboard.tsx ⏳
│   └── hooks/
│       └── useChatState.tsx ⏳
├── commands/
│   ├── check.ts ⏳
│   ├── test.ts (enhanced) ⏳
│   ├── tui.ts ⏳
│   ├── mode.ts ⏳
│   ├── insights.ts ⏳
│   ├── alias.ts ⏳
│   ├── template.ts ⏳
│   └── export.ts ⏳
└── mastra/
    └── tools/
        ├── quality-check.ts ⏳
        └── test-tools.ts ⏳
```

Legend: ✅ Complete | ⏳ Pending

---

## Dependencies to Add

### Phase 2

```json
{
  "eslint-formatter-codeframe": "^7.32.1",
  "@typescript-eslint/utils": "^8.46.0"
}
```

### Phase 3

```json
{
  "@vitest/coverage-v8": "^3.2.4"
}
```

### Phase 4

No new dependencies (Ink already installed)

### Phase 5

No new dependencies (uses existing systems)

### Phase 6

```json
{
  "cli-chart": "^1.2.0" // or similar for terminal charts
}
```

### Phase 7

```json
{
  "marked": "^14.1.2", // already installed
  "puppeteer": "^21.0.0" // for PDF export (optional)
}
```

---

## Implementation Priorities

### Must Have (MVP)

- Phase 2: Security scanner & check command
- Phase 4: Basic TUI (dashboard + chat view)
- Phase 5: Mode switching

### Should Have

- Phase 3: Test generation
- Phase 6: Basic insights
- Phase 7: Aliases and exports

### Nice to Have

- Phase 4: Advanced TUI features (file browser)
- Phase 6: Advanced visualizations
- Phase 7: Templates and shortcuts

---

## Success Criteria

### Phase 2

- [ ] Security scanner detects common vulnerabilities
- [ ] Check command runs without errors
- [ ] Report generation works in multiple formats

### Phase 3

- [ ] AI generates valid, runnable tests
- [ ] E2B test execution works
- [ ] Coverage reports are accurate

### Phase 4

- [ ] TUI renders correctly in terminal
- [ ] Chat view works with streaming
- [ ] Dashboard shows real-time stats

### Phase 5

- [ ] Mode switching works mid-session
- [ ] Each mode behaves as configured
- [ ] Budget limits are enforced

### Phase 6

- [ ] Insights are meaningful and actionable
- [ ] Visualizations render correctly
- [ ] Data aggregation is accurate

### Phase 7

- [ ] Aliases work correctly
- [ ] Templates scaffold projects
- [ ] Exports maintain formatting

---

## Next Steps

1. **Test Phase 1** (see PHASE1-TESTING.md)
2. **Start Phase 2** with security scanner
3. **Iterate based on testing feedback**
4. **Document as you build**
5. **Create PRs per phase** for easier review

---

**Last Updated**: 2025-01-07
**Status**: Phase 1 Complete, Phases 2-7 Pending
