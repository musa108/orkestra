'use client';
import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Bot,
  ChevronRight,
  Code,
  Copy,
  Check,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Database,
  Cpu,
  Layers,
  ArrowRight,
  Activity,
  Zap,
} from 'lucide-react';
import clsx from 'clsx';
import { StatusBadge } from './AgentStatusBadge';

export interface WorkflowStepItem {
  id: string;
  name: string;
  assignedAgent: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | string;
  output?: Record<string, any> | null;
  startedAt?: string;
  completedAt?: string;
}

interface WorkflowVisualizerProps {
  workflowId: string;
  currentState: string;
  steps: WorkflowStepItem[];
  onTriggerStep?: (stepName: string) => void;
}

/** Renders any agent output value as plain human-readable text instead of raw JSON. */
function ReadableValue({ value, depth = 0 }: { value: unknown; depth?: number }): React.ReactElement {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }
  if (typeof value === 'boolean') {
    return <span className="font-semibold">{value ? 'Yes' : 'No'}</span>;
  }
  if (typeof value === 'number') {
    return <span className="font-mono">{value.toLocaleString()}</span>;
  }
  if (typeof value === 'string') {
    return <span className="break-words leading-relaxed">{value}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">None</span>;
    const allPrimitive = value.every((v) => typeof v !== 'object' || v === null);
    if (allPrimitive) {
      return (
        <span className="break-words">
          {value.slice(0, 10).join(', ')}{value.length > 10 ? ` … +${value.length - 10} more` : ''}
        </span>
      );
    }
    return (
      <ul className="list-disc list-inside space-y-1 pl-1">
        {value.slice(0, 6).map((item, i) => {
          if (typeof item === 'object' && item !== null) {
            const entries = Object.entries(item as Record<string, unknown>);
            const label = entries
              .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
              .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
              .join(' · ');
            return <li key={i} className="text-[11px] text-foreground">{label || JSON.stringify(item)}</li>;
          }
          return <li key={i}><ReadableValue value={item} depth={depth + 1} /></li>;
        })}
        {value.length > 6 && <li className="text-muted-foreground text-[10px]">+{value.length - 6} more…</li>}
      </ul>
    );
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-muted-foreground">—</span>;
    if (depth >= 2) {
      return (
        <span className="break-words text-[11px]">
          {entries
            .filter(([, v]) => typeof v !== 'object' || v === null)
            .slice(0, 4)
            .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
            .join(' · ') || '…'}
        </span>
      );
    }
    return (
      <div className="space-y-1.5">
        {entries.slice(0, 8).map(([k, v]) => (
          <div key={k} className="text-xs">
            <span className="text-muted-foreground text-[10px] uppercase font-mono block">{k.replace(/_/g, ' ')}: </span>
            <div className="mt-0.5 text-foreground">
              <ReadableValue value={v} depth={depth + 1} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return <span>{String(value)}</span>;
}

export function WorkflowVisualizer({
  workflowId,
  currentState,
  steps = [],
  onTriggerStep,
}: WorkflowVisualizerProps) {
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'json'>('summary');

  const selectedStep = steps[selectedStepIndex] ?? steps[0] ?? null;

  const copyJson = () => {
    if (!selectedStep?.output) return;
    navigator.clipboard.writeText(JSON.stringify(selectedStep.output, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getStepStatus = (name: string) => {
    const step = steps.find((s) => s.name === name);
    return step?.status ?? 'PENDING';
  };

  return (
    <div className="card-enterprise overflow-hidden divide-y divide-border shadow-sm">
      {/* Header bar */}
      <div className="p-4 sm:p-5 bg-muted/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-mono font-bold text-xs shadow-sm shrink-0">
            DAG
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold text-foreground truncate">Execution Pipeline Graph</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-muted border border-border rounded text-muted-foreground">
                {steps.length} Stages
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              Google ADK / Gemini Multi-Agent System with MCP Tool Calling & ClickHouse Intelligence.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Status:</span>
          <StatusBadge status={currentState} size="sm" />
        </div>
      </div>

      {/* Visual Topological DAG Flow Diagram */}
      <div className="p-4 sm:p-5 bg-card/60 border-b border-border overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={13} />
            <span>Dependency Execution Topology</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground block md:hidden">
            ← Scroll horizontally →
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 min-w-[760px] justify-between text-xs py-1">
          {/* Node 1: Director */}
          <div className="flex flex-col items-center">
            <div className={clsx(
              'px-3 py-2 rounded-md border flex flex-col items-center gap-1 transition-all',
              getStepStatus('director-plan') === 'COMPLETED' && 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200',
              getStepStatus('director-plan') === 'RUNNING' && 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 animate-pulse text-blue-900 dark:text-blue-200',
              getStepStatus('director-plan') === 'PENDING' && 'border-border bg-muted/40 text-muted-foreground'
            )}>
              <span className="text-[10px] font-mono font-bold">DIRECTOR</span>
              <span className="text-xs font-semibold">Plan Brief</span>
            </div>
          </div>

          <ChevronRight size={16} className="text-muted-foreground/50 shrink-0" />

          {/* Node 2: Script */}
          <div className="flex flex-col items-center">
            <div className={clsx(
              'px-3 py-2 rounded-md border flex flex-col items-center gap-1 transition-all',
              getStepStatus('script-analysis') === 'COMPLETED' && 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200',
              getStepStatus('script-analysis') === 'RUNNING' && 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 animate-pulse text-blue-900 dark:text-blue-200',
              getStepStatus('script-analysis') === 'PENDING' && 'border-border bg-muted/40 text-muted-foreground'
            )}>
              <span className="text-[10px] font-mono font-bold">SCRIPT</span>
              <span className="text-xs font-semibold">Scene Analysis</span>
            </div>
          </div>

          <ChevronRight size={16} className="text-muted-foreground/50 shrink-0" />

          {/* Parallel Fan-out: Schedule & Budget */}
          <div className="flex flex-col gap-2">
            <div className={clsx(
              'px-3 py-1.5 rounded-md border flex items-center justify-between gap-2 transition-all',
              getStepStatus('schedule-generation') === 'COMPLETED' && 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200',
              getStepStatus('schedule-generation') === 'RUNNING' && 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 animate-pulse text-blue-900 dark:text-blue-200',
              getStepStatus('schedule-generation') === 'PENDING' && 'border-border bg-muted/40 text-muted-foreground'
            )}>
              <span className="text-[10px] font-mono font-bold">SCHEDULE</span>
              <span className="text-xs font-medium">Logistics & Calendar</span>
            </div>

            <div className={clsx(
              'px-3 py-1.5 rounded-md border flex items-center justify-between gap-2 transition-all',
              getStepStatus('budget-generation') === 'COMPLETED' && 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200',
              getStepStatus('budget-generation') === 'RUNNING' && 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 animate-pulse text-blue-900 dark:text-blue-200',
              getStepStatus('budget-generation') === 'PENDING' && 'border-border bg-muted/40 text-muted-foreground'
            )}>
              <span className="text-[10px] font-mono font-bold">BUDGET</span>
              <span className="text-xs font-medium">Financial Model</span>
            </div>
          </div>

          <ChevronRight size={16} className="text-muted-foreground/50 shrink-0" />

          {/* Node 4: Risk Agent (ClickHouse Intelligence) */}
          <div className="flex flex-col items-center">
            <div className={clsx(
              'px-3 py-2 rounded-md border flex flex-col items-center gap-1 transition-all',
              getStepStatus('risk-assessment') === 'COMPLETED' && 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200',
              getStepStatus('risk-assessment') === 'RUNNING' && 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 animate-pulse text-blue-900 dark:text-blue-200',
              getStepStatus('risk-assessment') === 'PENDING' && 'border-border bg-muted/40 text-muted-foreground'
            )}>
              <span className="text-[10px] font-mono font-bold flex items-center gap-1">
                <Database size={10} className="text-accent" /> RISK
              </span>
              <span className="text-xs font-semibold">ClickHouse Analysis</span>
            </div>
          </div>

          <ChevronRight size={16} className="text-muted-foreground/50 shrink-0" />

          {/* Node 5: Human Approval Gate */}
          <div className="flex flex-col items-center">
            <div className={clsx(
              'px-3 py-2 rounded-md border flex flex-col items-center gap-1 transition-all',
              getStepStatus('budget-approval') === 'COMPLETED' && 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200',
              currentState === 'WAITING_APPROVAL' && 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 shadow-sm animate-pulse',
              getStepStatus('budget-approval') === 'PENDING' && currentState !== 'WAITING_APPROVAL' && 'border-border bg-muted/40 text-muted-foreground'
            )}>
              <span className="text-[10px] font-mono font-bold flex items-center gap-1">
                <ShieldCheck size={11} className="text-amber-600 dark:text-amber-400" /> HUMAN GATE
              </span>
              <span className="text-xs font-semibold">AI Decision Review</span>
            </div>
          </div>

          <ChevronRight size={16} className="text-muted-foreground/50 shrink-0" />

          {/* Node 6: Marketing */}
          <div className="flex flex-col items-center">
            <div className={clsx(
              'px-3 py-2 rounded-md border flex flex-col items-center gap-1 transition-all',
              getStepStatus('marketing-plan') === 'COMPLETED' && 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200',
              getStepStatus('marketing-plan') === 'RUNNING' && 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 animate-pulse text-blue-900 dark:text-blue-200',
              getStepStatus('marketing-plan') === 'PENDING' && 'border-border bg-muted/40 text-muted-foreground'
            )}>
              <span className="text-[10px] font-mono font-bold">MARKETING</span>
              <span className="text-xs font-semibold">Campaign Strategy</span>
            </div>
          </div>

          <ChevronRight size={16} className="text-muted-foreground/50 shrink-0" />

          {/* Node 7: Analytics */}
          <div className="flex flex-col items-center">
            <div className={clsx(
              'px-3 py-2 rounded-md border flex flex-col items-center gap-1 transition-all',
              getStepStatus('analytics-summary') === 'COMPLETED' && 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200',
              getStepStatus('analytics-summary') === 'RUNNING' && 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 animate-pulse text-blue-900 dark:text-blue-200',
              getStepStatus('analytics-summary') === 'PENDING' && 'border-border bg-muted/40 text-muted-foreground'
            )}>
              <span className="text-[10px] font-mono font-bold">ANALYTICS</span>
              <span className="text-xs font-semibold">Telemetry Audit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Step Timeline Track */}
      <div className="p-3 sm:p-4 overflow-x-auto bg-muted/10">
        <div className="flex items-center gap-2 min-w-max">
          {steps.map((step, idx) => {
            const isSelected = selectedStepIndex === idx;
            const isDone = step.status === 'COMPLETED';
            const isRunning = step.status === 'RUNNING';
            const isFailed = step.status === 'FAILED';

            return (
              <div key={step.id || idx} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setSelectedStepIndex(idx)}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-md border text-left transition-all cursor-pointer group',
                    isSelected
                      ? 'bg-card border-slate-900 dark:border-slate-100 shadow-sm ring-1 ring-slate-900/10 dark:ring-white/10'
                      : 'bg-card/70 border-border hover:border-slate-400 dark:hover:border-slate-600',
                  )}
                >
                  <div
                    className={clsx(
                      'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0',
                      isDone && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
                      isRunning && 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 animate-pulse',
                      isFailed && 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
                      !isDone && !isRunning && !isFailed && 'bg-muted text-muted-foreground',
                    )}
                  >
                    {isDone ? <Check size={11} /> : idx + 1}
                  </div>

                  <div className="min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-foreground truncate max-w-[120px] sm:max-w-[140px]">{step.name}</p>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Bot size={10} />
                      <span className="truncate">{step.assignedAgent}</span>
                    </p>
                  </div>
                </button>

                {idx < steps.length - 1 && (
                  <ChevronRight size={14} className="text-muted-foreground/40 mx-1 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Inspector Panel */}
      {selectedStep && (
        <div className="p-4 sm:p-5 bg-card space-y-4">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-border gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold text-foreground">
                Step #{selectedStepIndex + 1}: {selectedStep.name}
              </span>
              <StatusBadge status={selectedStep.status} size="sm" />
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                Assigned Agent: <strong className="text-foreground font-mono">{selectedStep.assignedAgent}</strong>
              </span>
            </div>

            {selectedStep.output && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex bg-muted rounded-md p-0.5 border border-border text-[11px]">
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={clsx(
                      'px-2.5 py-1 rounded-xs font-medium transition-colors cursor-pointer',
                      activeTab === 'summary' ? 'bg-card text-foreground shadow-subtle' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Structured View
                  </button>
                  <button
                    onClick={() => setActiveTab('json')}
                    className={clsx(
                      'px-2.5 py-1 rounded-xs font-medium transition-colors cursor-pointer',
                      activeTab === 'json' ? 'bg-card text-foreground shadow-subtle' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Raw JSON
                  </button>
                </div>

                <button
                  onClick={copyJson}
                  className="btn-secondary px-2.5 py-1 text-[11px] cursor-pointer"
                  title="Copy JSON payload"
                >
                  {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Tab content */}
          {selectedStep.output ? (
            activeTab === 'summary' ? (
              <div className="space-y-4">
                {/* Telemetry Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-md bg-muted/30 border border-border text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-mono">Agent Identity</span>
                    <span className="font-mono font-medium text-foreground">{selectedStep.assignedAgent}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-mono">Inference Engine</span>
                    <span className="font-mono font-semibold text-accent">Gemini 2.0 / ADK</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-mono">Tool Integration</span>
                    <span className="font-mono font-medium text-foreground">FastMCP Streamable</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-mono">Analytical Store</span>
                    <span className="font-mono font-semibold text-foreground flex items-center gap-1">
                      <Database size={11} className="text-amber-500" /> ClickHouse OLAP
                    </span>
                  </div>
                </div>

                {/* If this is the Risk Agent step, display the dedicated high-impact risk card */}
                {selectedStep.assignedAgent === 'RISK' && selectedStep.output.riskLevel ? (
                  <div className="p-4 rounded-md border border-amber-300 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <ShieldAlert size={16} className="text-amber-700 dark:text-amber-400" />
                        <span className="text-xs font-bold text-foreground">Data-Grounded Risk Assessment</span>
                      </div>
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                        {selectedStep.output.riskLevel} RISK LEVEL
                      </span>
                    </div>

                    <p className="text-xs text-foreground font-medium leading-relaxed">
                      {selectedStep.output.summary}
                    </p>

                    {/* Evidence List */}
                    {Array.isArray(selectedStep.output.evidence) && selectedStep.output.evidence.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-amber-200/70 dark:border-amber-800/40">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                          Empirical Evidence (ClickHouse Historical Intelligence):
                        </span>
                        <div className="space-y-1.5">
                          {selectedStep.output.evidence.map((ev: any, i: number) => (
                            <div key={i} className="p-2.5 rounded bg-card/80 border border-border text-xs flex items-start gap-2">
                              <span className="px-1.5 py-0.5 rounded font-mono text-[9px] bg-slate-900 text-white dark:bg-white dark:text-slate-900 shrink-0 mt-0.5">
                                {ev.source || 'clickhouse'}
                              </span>
                              <div className="min-w-0">
                                <span className="font-semibold text-foreground mr-1">{ev.factor?.replace(/_/g, ' ')}:</span>
                                <span className="text-muted-foreground leading-relaxed">{ev.finding}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendation */}
                    {selectedStep.output.recommendation && (
                      <div className="pt-2 border-t border-amber-200/70 dark:border-amber-800/40 text-xs">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1">
                          System Recommendation:
                        </span>
                        <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200 font-medium">
                          {selectedStep.output.recommendation}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard Step Output Fields Grid */
                  <div className="space-y-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Structured Output Attributes
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(selectedStep.output).map(([k, v]) => (
                        <div key={k} className="p-3 rounded-md bg-muted/30 border border-border">
                          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide block mb-1">
                            {k.replace(/_/g, ' ')}
                          </span>
                          <div className="text-xs font-medium text-foreground">
                            <ReadableValue value={v} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-950 text-slate-100 rounded-md p-4 font-mono text-xs max-h-80 overflow-y-auto border border-border">
                <pre className="whitespace-pre-wrap break-all">{JSON.stringify(selectedStep.output, null, 2)}</pre>
              </div>
            )
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 border border-border rounded-md">
              <Clock size={20} className="mx-auto mb-2 text-muted-foreground/60" />
              <span className="font-medium text-foreground">Step awaiting agent execution in pipeline graph.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
