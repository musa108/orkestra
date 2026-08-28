'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  ChevronRight,
  Activity,
  Layers,
  Lock,
  Cpu,
  Database,
  Eye,
  Check,
  X,
  Sparkles,
  Terminal,
  Clock,
  Menu,
  Sun,
  Moon,
  Workflow as WorkflowIcon,
  Clapperboard,
  Sliders,
  FileCheck,
  ArrowUpRight,
} from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '@/lib/theme';
import { OrkestraMark } from '@/components/Sidebar';
import { isAuthed } from '@/lib/api';

// ── AGENTS DATA (Matches real backend agents) ────────────────────────────────
const AGENTS = [
  {
    type: 'DIRECTOR',
    name: 'Director Agent',
    role: 'Creative & Executive Lead',
    status: 'ONLINE',
    tools: ['Screenplay Context Engine', 'State Transition Dispatcher', 'Creative Tone Analyzer'],
    goal: 'Decomposes production brief into structured creative directives and downstream agent tasks.',
    constraints: ['Must preserve producer brief tone', 'Cannot alter budget ceilings'],
  },
  {
    type: 'SCRIPT',
    name: 'Script Agent',
    role: 'Screenplay & Scene Breakdown',
    status: 'ONLINE',
    tools: ['Fountain / PDF Parser', 'Scene Entity Extractor', 'Dialogue Density Calculator'],
    goal: 'Extracts scenes, characters, locations, day/night tags, and emotional arcs from script assets.',
    constraints: ['Must flag pyrotechnic/stunt scenes for safety', 'Preserves dialogue verbatim'],
  },
  {
    type: 'BUDGET',
    name: 'Budget Agent',
    role: 'Financial Intelligence',
    status: 'ONLINE',
    tools: ['Line Item Calculator', 'Tax Credit Modeling', 'Department Matrix Estimator'],
    goal: 'Generates departmental line-item estimates and calculates state/country tax incentives.',
    constraints: ['Cannot approve expenditures > $50,000 autonomously', 'Read-only financial ledger access'],
  },
  {
    type: 'SCHEDULE',
    name: 'Schedule Agent',
    role: 'Logistics & Shoot Timeline',
    status: 'ONLINE',
    tools: ['Day-Out-Of-Days Generator', 'Weather Matrix Predictor', 'Unit Stripboard Engine'],
    goal: 'Optimizes production shoot calendars, cast availability matrices, and multi-unit shoot sequences.',
    constraints: ['Adheres to SAG-AFTRA 12-hour turnaround rules', 'Flags weather-dependent exterior shoots'],
  },
  {
    type: 'RISK',
    name: 'Risk Agent',
    role: 'Safety & Compliance Gatekeeper',
    status: 'ONLINE',
    tools: ['Stunt Hazard Classifier', 'Insurance Policy Rules Engine', 'Weather Risk Modeler'],
    goal: 'Evaluates budget variances, stunt safety hazards, animal welfare policies, and regulatory insurance gates.',
    constraints: ['Mandatory human escalation for high-risk hazards', 'Audits all department safety compliance'],
  },
  {
    type: 'MARKETING',
    name: 'Marketing Agent',
    role: 'Audience & Release Strategy',
    status: 'ONLINE',
    tools: ['Demographic Indexer', 'Festival Submission Calendar', 'Trailer Sentiment Analyzer'],
    goal: 'Formulates audience demographic targets, distribution release windows, and teaser campaign strategies.',
    constraints: ['Adheres to MPA rating guidelines', 'Requires executive review for trailer releases'],
  },
  {
    type: 'ANALYTICS',
    name: 'Analytics Agent',
    role: 'Telemetry & Evaluation',
    status: 'ONLINE',
    tools: ['Step Latency Tracker', 'Token Cost Accountant', 'Evaluation Benchmark Engine'],
    goal: 'Aggregates multi-agent telemetry, token usage, step latencies, and workflow outcome reliability.',
    constraints: ['Read-only event telemetry stream access', 'Calculates real-time agent confidence scores'],
  },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [authed, setAuthed] = useState(false);

  // Hero Interactive Simulation States
  const [simStep, setSimStep] = useState<number>(0);
  const [simApproved, setSimApproved] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthed(isAuthed());
  }, []);

  // Step advancement timer for the hero orchestration visual
  useEffect(() => {
    if (simApproved === null && simStep >= 4) return; // Paused at approval gate
    const timer = setInterval(() => {
      setSimStep((prev) => (prev >= 5 ? 0 : prev + 1));
      if (simStep === 5) setSimApproved(null);
    }, 4000);
    return () => clearInterval(timer);
  }, [simStep, simApproved]);

  const handleSimDecision = (approved: boolean) => {
    setSimApproved(approved);
    setSimStep(5);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-slate-900">
      {/* ── 1. NAVBAR ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand Wordmark */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-subtle group-hover:scale-105 transition-transform">
              <OrkestraMark size={18} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-foreground">ORKESTRA</span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider -mt-1">
                AI Orchestration
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-muted-foreground">
            <a href="#workflow" className="hover:text-foreground transition-colors">
              Workflow
            </a>
            <a href="#agents" className="hover:text-foreground transition-colors">
              AI Workforce
            </a>
            <a href="#governance" className="hover:text-foreground transition-colors">
              Governance
            </a>
            <a href="#security" className="hover:text-foreground transition-colors">
              Authorization
            </a>
            <a href="#observability" className="hover:text-foreground transition-colors">
              Observability
            </a>
            <a href="#architecture" className="hover:text-foreground transition-colors">
              Architecture
            </a>
          </nav>

          {/* Action CTAs & Theme Switcher */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              type="button"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              className="p-2 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>

            {authed ? (
              <Link href="/dashboard" className="btn-primary">
                Open Dashboard <ChevronRight size={13} />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 transition-colors"
                >
                  Sign in
                </Link>
                <Link href="/login" className="btn-primary">
                  Launch Orkestra <ArrowUpRight size={13} />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded text-muted-foreground hover:text-foreground"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-foreground"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-card p-6 space-y-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-3 text-sm font-medium">
              <a
                href="#workflow"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Workflow
              </a>
              <a
                href="#agents"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                AI Workforce
              </a>
              <a
                href="#governance"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Governance & Safety
              </a>
              <a
                href="#security"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Authorization
              </a>
              <a
                href="#architecture"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Architecture
              </a>
            </nav>
            <div className="pt-4 border-t border-border flex flex-col gap-2">
              <Link href="/login" className="btn-primary w-full py-2.5 text-center">
                Launch Orkestra
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── 2. HERO SECTION ────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 border-b border-border overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative space-y-12">
          {/* Hero Typography */}
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-mono font-medium text-foreground"> 
              <span>ENTERPRISE AI ORCHESTRATION</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.08] uppercase">
              Direct the vision.
              <br />
              <span className="text-muted-foreground">Let AI orchestrate</span>
              <br />
              the execution.
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl font-normal">
              Orkestra is an intelligent operating system for complex production workflows—connecting
              autonomous AI agents, enterprise data, and human decisions into one coordinated system.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/login" className="btn-primary px-5 py-2.5 text-xs">
                Launch Orkestra <ArrowRight size={14} />
              </Link>
              <a href="#workflow" className="btn-secondary px-5 py-2.5 text-xs">
                Explore the Workflow ↓
              </a>
            </div>
          </div>

          {/* ── 3. HERO LIVE ORCHESTRATION DAG VISUALIZER ───────────────────── */}
          <div className="card-enterprise overflow-hidden shadow-2xl border border-border bg-card">
            {/* Visualizer Top Bar */}
            <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-foreground">Live Orchestrator Pipeline</span>
                <span className="text-muted-foreground text-[11px]">· Production: The Last Horizon</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground">
                  Inference: Gemini 3.6 Flash
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
                  STATE: {simStep === 4 ? 'WAITING APPROVAL' : 'RUNNING'}
                </span>
              </div>
            </div>

            {/* Pipeline Stage Visualizer */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-3 bg-card border-b border-border">
              {/* Stage 1: Director */}
              <div
                className={clsx(
                  'p-3 rounded-sm border transition-all text-xs space-y-1.5',
                  simStep >= 1
                    ? 'bg-muted/60 border-slate-400 dark:border-slate-600'
                    : 'bg-card border-border opacity-60',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">01. DIRECTOR</span>
                  {simStep >= 1 ? (
                    <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Clock size={13} className="text-muted-foreground" />
                  )}
                </div>
                <p className="font-semibold text-foreground">Production Plan</p>
                <p className="text-[11px] text-muted-foreground">Decomposes brief into 8 acts</p>
              </div>

              {/* Stage 2: Script */}
              <div
                className={clsx(
                  'p-3 rounded-sm border transition-all text-xs space-y-1.5',
                  simStep >= 2
                    ? 'bg-muted/60 border-slate-400 dark:border-slate-600'
                    : 'bg-card border-border opacity-60',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">02. SCRIPT</span>
                  {simStep >= 2 ? (
                    <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Clock size={13} className="text-muted-foreground" />
                  )}
                </div>
                <p className="font-semibold text-foreground">Scene Breakdown</p>
                <p className="text-[11px] text-muted-foreground">14 scenes · 3 lead actors</p>
              </div>

              {/* Stage 3: Budget & Schedule (Parallel) */}
              <div
                className={clsx(
                  'p-3 rounded-sm border transition-all text-xs space-y-1.5',
                  simStep >= 3
                    ? 'bg-muted/60 border-slate-400 dark:border-slate-600'
                    : 'bg-card border-border opacity-60',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">03. BUDGET + SCHEDULE</span>
                  {simStep >= 3 ? (
                    <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Clock size={13} className="text-muted-foreground" />
                  )}
                </div>
                <p className="font-semibold text-foreground">Financial & Logistics</p>
                <p className="text-[11px] text-muted-foreground">$1.85M · 24 shoot days</p>
              </div>

              {/* Stage 4: Risk Gate */}
              <div
                className={clsx(
                  'p-3 rounded-sm border transition-all text-xs space-y-1.5',
                  simStep >= 4
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/60'
                    : 'bg-card border-border opacity-60',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-amber-800 dark:text-amber-300 font-semibold">
                    04. RISK AUDIT
                  </span>
                  {simStep >= 4 ? (
                    <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Clock size={13} className="text-muted-foreground" />
                  )}
                </div>
                <p className="font-semibold text-foreground">Safety Analysis</p>
                <p className="text-[11px] text-muted-foreground">Stunt buffer required</p>
              </div>

              {/* Stage 5: Human Gate */}
              <div
                className={clsx(
                  'p-3 rounded-sm border transition-all text-xs space-y-1.5',
                  simStep === 4
                    ? 'bg-amber-100/60 dark:bg-amber-900/40 border-amber-400 ring-2 ring-amber-400/20 animate-pulse'
                    : simStep > 4
                      ? simApproved
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300'
                      : 'bg-card border-border opacity-60',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">05. GOVERNANCE</span>
                  <ShieldCheck size={13} className="text-foreground" />
                </div>
                <p className="font-semibold text-foreground">Human Approval</p>
                <p className="text-[11px] text-muted-foreground">
                  {simStep === 4
                    ? 'Action Required'
                    : simStep > 4
                      ? simApproved
                        ? 'Authorized'
                        : 'Rejected'
                      : 'Pending Gate'}
                </p>
              </div>
            </div>

            {/* Interactive Human-In-The-Loop Live Prompt */}
            <div className="p-5 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Active Step: {simStep === 4 ? 'Human-in-the-Loop Sign-off' : 'Multi-Agent Autonomous Execution'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {simStep === 4
                      ? 'Risk Agent flagged a $180,000 location stunt contingency'
                      : 'Specialist agents executing deterministic sub-tasks over WebSocket'}
                  </span>
                </div>
                <p className="text-xs text-foreground font-medium">
                  {simStep === 4 ? (
                    <span>
                      Producer approval required before advancing to <strong>Marketing Strategy</strong> and{' '}
                      <strong>Telemetry Summary</strong>.
                    </span>
                  ) : simStep === 5 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ✓ Approval recorded by human producer. Pipeline resumed and completed successfully.
                    </span>
                  ) : (
                    <span>AI agents running with strict tool boundary constraints.</span>
                  )}
                </p>
              </div>

              {simStep === 4 && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSimDecision(false)}
                    className="btn-danger text-xs px-3 py-1.5"
                  >
                    <X size={13} /> Reject
                  </button>
                  <button
                    onClick={() => handleSimDecision(true)}
                    className="btn-primary text-xs px-4 py-1.5"
                  >
                    <Check size={13} /> Authorize & Proceed
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. PRODUCT CAPABILITY STRIP ────────────────────────────────────── */}
      <section className="py-6 border-b border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-6 text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white" />
            <span>Autonomous Agents</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white" />
            <span>Workflow Orchestration</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white" />
            <span>Human-in-the-Loop Approvals</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white" />
            <span>Real-Time Observability</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white" />
            <span>Enterprise Authorization</span>
          </div>
        </div>
      </section>

      {/* ── 5. PROBLEM SECTION ─────────────────────────────────────────────── */}
      <section className="py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <div className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              The Orchestration Challenge
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground uppercase">
              Enterprise work doesn't happen in one system.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Production workflows span people, applications, databases, financial ledgers, and
              operational safety decisions. While single-prompt AI can generate text or summarize an
              isolated document, coordinating a multi-department operation is where real complexity
              explodes.
            </p>
            <div className="p-4 rounded-sm bg-muted/40 border border-border text-xs text-foreground space-y-1.5">
              <span className="font-semibold block text-foreground">The Fundamental Truth:</span>
              <p className="text-muted-foreground leading-relaxed">
                AI is powerful individually. <strong>Orchestration makes it useful at enterprise scale.</strong>
              </p>
            </div>
          </div>

          {/* Fragmentation vs Orchestration Graphic */}
          <div className="card-enterprise p-6 space-y-4">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide block pb-2 border-b border-border">
              Fragmented Silos → Unified State Machine
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-sm bg-muted/40 border border-border">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">01. Financials</span>
                <p className="font-medium text-foreground mt-0.5">Budget & Tax Credits</p>
              </div>
              <div className="p-3 rounded-sm bg-muted/40 border border-border">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">02. Logistics</span>
                <p className="font-medium text-foreground mt-0.5">Shoot Stripboards</p>
              </div>
              <div className="p-3 rounded-sm bg-muted/40 border border-border">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">03. Screenplay</span>
                <p className="font-medium text-foreground mt-0.5">Scene Entity Data</p>
              </div>
              <div className="p-3 rounded-sm bg-muted/40 border border-border">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">04. Compliance</span>
                <p className="font-medium text-foreground mt-0.5">SAG-AFTRA & Safety</p>
              </div>
            </div>

            <div className="p-3 rounded-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs flex items-center justify-between font-mono">
              <span>ORKESTRA STATE MACHINE</span>
              <span className="text-[10px]">COORDINATED AS ONE</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. THE ORKESTRA SOLUTION ───────────────────────────────────────── */}
      <section id="workflow" className="py-20 border-b border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="max-w-2xl space-y-3">
            <div className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              The Architecture Model
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground uppercase">
              One workflow. Many intelligent actors.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Every production flows through a deterministic Directed Acyclic Graph (DAG). Agents
              never directly mutate database states—they execute specialist tasks within authorized
              boundaries and return structured outputs for the orchestration engine to persist.
            </p>
          </div>

          {/* Workflow DAG Architecture Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-enterprise p-6 space-y-3">
              <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center font-mono text-xs font-bold text-foreground">
                01
              </div>
              <h3 className="text-sm font-bold text-foreground">Human Direction</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The producer initiates the project with a high-level creative brief, budget parameters,
                and milestone constraints.
              </p>
            </div>

            <div className="card-enterprise p-6 space-y-3">
              <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center font-mono text-xs font-bold text-foreground">
                02
              </div>
              <h3 className="text-sm font-bold text-foreground">Autonomous Agent Execution</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Specialist agents (Director, Script, Budget, Schedule, Risk, Marketing) execute in
                sequence and parallel, invoking bound MCP tools.
              </p>
            </div>

            <div className="card-enterprise p-6 space-y-3">
              <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center font-mono text-xs font-bold text-foreground">
                03
              </div>
              <h3 className="text-sm font-bold text-foreground">Human Governance Gate</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Critical decisions (budget approvals, stunt safety classifications) halt execution until
                explicitly authorized by a human operator.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. AI AGENT WORKFORCE (FEATURE 1) ──────────────────────────────── */}
      <section id="agents" className="py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <div className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                Autonomous Workforce
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground uppercase">
                Orchestrate Specialized AI Agents
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Seven dedicated agent roles built with domain-specific system prompts, tool bindings, and
                strict operational constraints.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-muted border border-border text-foreground self-start">
              7 Active Agent Archetypes
            </span>
          </div>

          {/* Interactive Agent Inspector Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Agent Selector List */}
            <div className="space-y-2 lg:col-span-1">
              {AGENTS.map((agent) => {
                const isSelected = selectedAgent.type === agent.type;
                return (
                  <button
                    key={agent.type}
                    type="button"
                    onClick={() => setSelectedAgent(agent)}
                    className={clsx(
                      'w-full text-left p-3.5 rounded-sm border transition-all flex items-center justify-between cursor-pointer',
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-subtle'
                        : 'bg-card border-border hover:bg-muted/70 text-foreground',
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Bot size={16} className={isSelected ? 'text-white dark:text-slate-900' : 'text-muted-foreground'} />
                      <div className="min-w-0">
                        <p className="text-xs truncate">{agent.name}</p>
                        <p className={clsx('text-[10px] truncate font-normal', isSelected ? 'text-white/70 dark:text-slate-900/70' : 'text-muted-foreground')}>
                          {agent.role}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={14} className={isSelected ? 'text-white dark:text-slate-900' : 'text-muted-foreground'} />
                  </button>
                );
              })}
            </div>

            {/* Selected Agent Inspector Card */}
            <div className="card-enterprise p-6 lg:col-span-2 space-y-6">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
                    Agent Contract & Capabilities
                  </span>
                  <h3 className="text-lg font-bold text-foreground mt-0.5">{selectedAgent.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{selectedAgent.role}</p>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>ONLINE</span>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="font-semibold text-foreground block mb-1">Primary Operational Goal:</span>
                  <p className="text-muted-foreground leading-relaxed">{selectedAgent.goal}</p>
                </div>

                <div>
                  <span className="font-semibold text-foreground block mb-2">Bound MCP Tools & Adapters:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAgent.tools.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-mono px-2 py-1 rounded bg-muted text-foreground border border-border"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-foreground block mb-1.5">Hard Governance Constraints:</span>
                  <ul className="space-y-1">
                    {selectedAgent.constraints.map((c, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-muted-foreground">
                        <Check size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. HUMAN + AI GOVERNANCE (FEATURE 2) ───────────────────────────── */}
      <section id="governance" className="py-20 border-b border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="max-w-3xl space-y-3">
            <div className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              Controlled Autonomy
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground uppercase">
              Autonomous where it should be.
              <br />
              Human where it matters.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Orkestra is designed around controlled autonomy. Agents analyze, coordinate, calculate,
              and execute permitted actions—but high-risk financial, legal, and safety decisions remain
              strictly under human governance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* AI Domain */}
            <div className="card-enterprise p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <Bot size={18} className="text-foreground" />
                <h3 className="text-sm font-bold text-foreground uppercase">AI Agent Capabilities</h3>
              </div>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Parse complex 120-page screenplays into structured JSON data</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Calculate multi-unit departmental line-item estimates</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Optimize cast day-out-of-days matrices under SAG-AFTRA constraints</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Execute permitted read and calculation tools autonomously</span>
                </li>
              </ul>
            </div>

            {/* Human Domain */}
            <div className="card-enterprise p-6 space-y-4 border-slate-400 dark:border-slate-600">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <ShieldCheck size={18} className="text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-foreground uppercase">Human Producer Authority</h3>
              </div>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Authorize or reject critical budget contingency thresholds</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Sign off on high-hazard stunt and location safety assessments</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Override agent recommendations at any point during workflow execution</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Maintain full legal, creative, and regulatory executive control</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. SECURITY & AUTHORIZATION ────────────────────────────────────── */}
      <section id="security" className="py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <div className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              Zero-Trust Agent Security
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground uppercase">
              Autonomy needs boundaries.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Every agent operates within defined capabilities and authorization policies. If an agent
              attempts to invoke an unauthorized tool, the central authorization service intercepts and
              blocks the action before execution.
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              Enforced via ToolAuthorizationService with immutable audit logging on every tool attempt.
            </p>
          </div>

          {/* Capability Matrix Mockup */}
          <div className="card-enterprise p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-bold text-foreground">Budget Agent Capability Policy</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                Enforced by Policy Engine
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold uppercase block mb-1">
                  ✓ Permitted Autonomous Capabilities
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 font-mono text-[11px]">
                  <span className="p-2 rounded bg-muted/60 border border-border">budget.read</span>
                  <span className="p-2 rounded bg-muted/60 border border-border">budget.calculate</span>
                  <span className="p-2 rounded bg-muted/60 border border-border">budget.recommend</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-semibold uppercase block mb-1">
                  ✕ Restricted (Human Action Only)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[11px]">
                  <span className="p-2 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    budget.approve
                  </span>
                  <span className="p-2 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    payment.execute
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. OBSERVABILITY & TELEMETRY ──────────────────────────────────── */}
      <section id="observability" className="py-20 border-b border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          <div className="max-w-2xl space-y-2">
            <div className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              Real-Time Telemetry
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground uppercase">
              If AI is running your work, you should be able to see it.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Follow workflows, agent execution, human decisions, and system latency from a single
              centralized operational interface.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-enterprise p-4 space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">Active AI Workforce</span>
              <p className="text-2xl font-bold text-foreground font-mono">7 Agents</p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">100% Operational</span>
            </div>
            <div className="card-enterprise p-4 space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">State Machine Latency</span>
              <p className="text-2xl font-bold text-foreground font-mono">~180ms</p>
              <span className="text-[10px] text-muted-foreground font-mono">Asynchronous execution</span>
            </div>
            <div className="card-enterprise p-4 space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">Inference Engine</span>
              <p className="text-2xl font-bold text-foreground font-mono">Gemini 3.6</p>
              <span className="text-[10px] text-accent font-mono">Flash Intelligence</span>
            </div>
            <div className="card-enterprise p-4 space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">Human Governance</span>
              <p className="text-2xl font-bold text-foreground font-mono">100%</p>
              <span className="text-[10px] text-muted-foreground font-mono">Auditable policy gates</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 11. TECHNICAL ARCHITECTURE ─────────────────────────────────────── */}
      <section id="architecture" className="py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="max-w-2xl space-y-2">
            <div className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              System Design
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground uppercase">
              Built for the Enterprise.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              A robust, decoupled architecture separating UI presentation, deterministic orchestration,
              AI inference, and persistence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="card-enterprise p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-foreground" />
                <h3 className="font-bold text-foreground">01. Web Dashboard</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Next.js 15 App Router with real-time Socket.io state machine updates, command palette,
                and dark mode theme engine.
              </p>
            </div>

            <div className="card-enterprise p-5 space-y-3">
              <div className="flex items-center gap-2">
                <WorkflowIcon size={16} className="text-foreground" />
                <h3 className="font-bold text-foreground">02. Orchestration Core</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                NestJS execution engine controlling deterministic DAG state transitions, retries, and
                human approval pauses.
              </p>
            </div>

            <div className="card-enterprise p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-foreground" />
                <h3 className="font-bold text-foreground">03. Intelligence Layer</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Google Cloud Agent Builder + Gemini 3.6 Flash inference with domain agent contracts and
                structured JSON output validation.
              </p>
            </div>

            <div className="card-enterprise p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-foreground" />
                <h3 className="font-bold text-foreground">04. Data & Audit Trail</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                PostgreSQL with Prisma ORM for relational state tracking, plus Model Context Protocol
                (MCP) tools for external integrations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 12. WHY ORKESTRA (FROM TASKS TO OPERATIONS) ────────────────────── */}
      <section className="py-20 border-b border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="max-w-2xl space-y-2">
            <div className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
              The Evolution
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground uppercase">
              From AI Tasks to AI Operations.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Traditional AI Wrapper */}
            <div className="p-6 rounded-sm bg-card border border-border space-y-3">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
                Traditional AI Tools (1-Shot Wrappers)
              </span>
              <div className="font-mono text-xs text-muted-foreground space-y-2 py-3 border-y border-border">
                <p>User Prompt</p>
                <p className="text-foreground">↓</p>
                <p>Single LLM Response</p>
                <p className="text-foreground">↓</p>
                <p className="text-rose-600 dark:text-rose-400">Manual Copy-Paste into Disconnected Tools</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Requires constant human glue, lacks state tracking, and cannot handle complex cross-department dependencies.
              </p>
            </div>

            {/* Orkestra Orchestration */}
            <div className="p-6 rounded-sm bg-slate-900 text-white dark:bg-white dark:text-slate-900 space-y-3 shadow-xl">
              <span className="text-[10px] font-mono text-white/70 dark:text-slate-900/70 uppercase tracking-wide">
                Orkestra Enterprise AI Operations
              </span>
              <div className="font-mono text-xs space-y-2 py-3 border-y border-white/20 dark:border-slate-900/20">
                <p>Production Goal</p>
                <p>↓</p>
                <p>Multi-Agent DAG Coordination + MCP Tools</p>
                <p>↓</p>
                <p className="text-emerald-400 dark:text-emerald-700 font-semibold">
                  Human Approval Gate → Autonomous Execution → Realtime Telemetry
                </p>
              </div>
              <p className="text-xs text-white/80 dark:text-slate-900/80">
                End-to-end operational operating system with complete governance, reliability, and auditable state machine persistence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 13. FINAL CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground uppercase">
            Direct your next production.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Bring your workflows, autonomous agents, enterprise data, and human decisions into one
            coordinated operating system.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/login" className="btn-primary px-6 py-3 text-xs">
              Launch Orkestra <ArrowRight size={14} />
            </Link>
            <Link href="/login" className="btn-secondary px-6 py-3 text-xs">
              Sign in to Studio
            </Link>
          </div>
        </div>
      </section>

      {/* ── 14. FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="py-12 bg-card text-muted-foreground text-xs border-t border-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-mono font-bold text-[10px]">
              <OrkestraMark size={14} />
            </div>
            <span className="font-bold text-foreground text-xs">ORKESTRA</span>
            <span className="text-[11px] text-muted-foreground">· Enterprise AI Orchestration Platform</span>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <a href="#workflow" className="hover:text-foreground transition-colors">
              Workflow
            </a>
            <a href="#agents" className="hover:text-foreground transition-colors">
              AI Workforce
            </a>
            <a href="#governance" className="hover:text-foreground transition-colors">
              Governance
            </a>
            <a href="#architecture" className="hover:text-foreground transition-colors">
              Architecture
            </a>
            <Link href="/login" className="hover:text-foreground transition-colors font-medium">
              Launch
            </Link>
          </div>

          <p className="text-[11px] text-muted-foreground font-mono">
            © 2026 Orkestra · Google Cloud + Gemini
          </p>
        </div>
      </footer>
    </div>
  );
}
