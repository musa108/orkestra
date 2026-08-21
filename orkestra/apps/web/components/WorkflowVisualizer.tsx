'use client';
import React from 'react';
import { useState } from 'react';
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
} from 'lucide-react';
import clsx from 'clsx';
import { StatusBadge } from './AgentStatusBadge';

export interface WorkflowStepItem {
  id: string;
  name: string;
  assignedAgent: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
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
    return <span>{value ? 'Yes' : 'No'}</span>;
  }
  if (typeof value === 'number') {
    return <span>{value.toLocaleString()}</span>;
  }
  if (typeof value === 'string') {
    return <span className="break-words">{value}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">None</span>;
    // Arrays of primitives — render as a comma-separated summary
    const allPrimitive = value.every((v) => typeof v !== 'object' || v === null);
    if (allPrimitive) {
      return (
        <span className="break-words">
          {value.slice(0, 10).join(', ')}{value.length > 10 ? ` … +${value.length - 10} more` : ''}
        </span>
      );
    }
    // Arrays of objects — summarize each item on its own line
    return (
      <ul className="list-disc list-inside space-y-0.5 pl-1">
        {value.slice(0, 6).map((item, i) => {
          // Grab the first meaningful string field to use as the label
          if (typeof item === 'object' && item !== null) {
            const entries = Object.entries(item as Record<string, unknown>);
            const label = entries
              .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
              .slice(0, 2)
              .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
              .join(' · ');
            return <li key={i} className="truncate text-[11px]">{label || JSON.stringify(item)}</li>;
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
      // Deeply nested — flatten to a compact readable string, no curly brackets
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
      <div className="space-y-1">
        {entries.slice(0, 8).map(([k, v]) => (
          <div key={k}>
            <span className="text-muted-foreground text-[10px]">{k.replace(/_/g, ' ')}: </span>
            <ReadableValue value={v} depth={depth + 1} />
          </div>
        ))}
        {entries.length > 8 && <span className="text-muted-foreground text-[10px]">+{entries.length - 8} more fields…</span>}
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

  return (
    <div className="card-enterprise overflow-hidden divide-y divide-border">
      {/* Header bar */}
      <div className="p-4 bg-muted/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-sm bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-mono font-bold text-xs">
            DAG
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-foreground">Orchestration Step Pipeline</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-muted border border-border rounded text-muted-foreground">
                {steps.length} Steps
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Deterministic workflow state machine executed by autonomous Google ADK / Gemini agents.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Pipeline Status:</span>
          <StatusBadge status={currentState} size="sm" />
        </div>
      </div>

      {/* Horizontal Step Timeline Track */}
      <div className="p-4 overflow-x-auto bg-card">
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
                    'flex items-center gap-2.5 px-3 py-2 rounded-sm border text-left transition-all cursor-pointer group',
                    isSelected
                      ? 'bg-muted border-slate-400 dark:border-slate-600 shadow-subtle'
                      : 'bg-card border-border hover:border-slate-300 dark:hover:border-slate-700',
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
                    {idx + 1}
                  </div>

                  <div className="min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-foreground truncate max-w-[130px]">{step.name}</p>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Bot size={10} />
                      <span className="truncate">{step.assignedAgent}</span>
                    </p>
                  </div>
                </button>

                {idx < steps.length - 1 && (
                  <ChevronRight size={14} className="text-muted-foreground/50 mx-1 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Inspector Panel */}
      {selectedStep && (
        <div className="p-4 bg-muted/20 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-foreground">
                Step #{selectedStepIndex + 1}: {selectedStep.name}
              </span>
              <StatusBadge status={selectedStep.status} size="sm" />
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                Assigned Agent: <strong className="text-foreground font-mono">{selectedStep.assignedAgent}</strong>
              </span>
            </div>

            {selectedStep.output && (
              <div className="flex items-center gap-2">
                <div className="flex bg-muted rounded-sm p-0.5 border border-border text-[11px]">
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={clsx(
                      'px-2 py-0.5 rounded-xs font-medium transition-colors',
                      activeTab === 'summary' ? 'bg-card text-foreground shadow-subtle' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Summary
                  </button>
                  <button
                    onClick={() => setActiveTab('json')}
                    className={clsx(
                      'px-2 py-0.5 rounded-xs font-medium transition-colors',
                      activeTab === 'json' ? 'bg-card text-foreground shadow-subtle' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Raw JSON
                  </button>
                </div>

                <button
                  onClick={copyJson}
                  className="btn-secondary px-2 py-1 text-[11px]"
                  title="Copy JSON output"
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
              <div className="bg-card border border-border rounded-sm p-4 text-xs space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-3 border-b border-border text-[11px]">
                  <div>
                    <span className="text-muted-foreground block">Execution Agent</span>
                    <span className="font-mono font-medium text-foreground">{selectedStep.assignedAgent}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Step State</span>
                    <span className="font-mono font-medium text-foreground">{selectedStep.status}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Inference Engine</span>
                    <span className="font-mono font-medium text-accent">Gemini 3.6 Flash</span>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Structured Output Fields
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(selectedStep.output).map(([k, v]) => (
                      <div key={k} className="p-2 rounded-sm bg-muted/40 border border-border">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">{k.replace(/_/g, ' ')}</span>
                        <div className="text-xs font-medium text-foreground mt-0.5">
                          <ReadableValue value={v} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 text-slate-100 rounded-sm p-3 font-mono text-xs max-h-56 overflow-y-auto">
                <pre>{JSON.stringify(selectedStep.output, null, 2)}</pre>
              </div>
            )
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground bg-card border border-border rounded-sm">
              <Clock size={18} className="mx-auto mb-1.5 text-muted-foreground/60" />
              <span>Step output is pending execution.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
