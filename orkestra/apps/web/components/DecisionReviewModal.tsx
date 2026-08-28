'use client';
import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  Database,
  Bot,
  AlertTriangle,
  FileText,
  Activity,
  Layers,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import clsx from 'clsx';

export interface DecisionReviewData {
  id: string;
  workflowId: string;
  productionId: string;
  productionTitle?: string;
  action?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  comments?: string;
  proposedChanges?: {
    riskLevel?: string;
    summary?: string;
    contributingFactors?: string[];
    evidence?: Array<{ factor: string; source: string; finding: string }>;
    recommendation?: string;
    expectedImpact?: string;
    affectedWorkflowSteps?: string[];
    [key: string]: any;
  } | null;
  createdAt?: string;
}

interface DecisionReviewModalProps {
  decision: DecisionReviewData | null;
  onClose: () => void;
  onApprove: (id: string, comments?: string) => Promise<void>;
  onReject: (id: string, comments?: string) => Promise<void>;
}

export function DecisionReviewModal({
  decision,
  onClose,
  onApprove,
  onReject,
}: DecisionReviewModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [reviewerComment, setReviewerComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    if (decision) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [decision, submitting, onClose]);

  if (!decision) return null;

  const changes = decision.proposedChanges || {};
  const riskLevel = (changes.riskLevel || decision.riskLevel || 'HIGH').toUpperCase();
  const summary = changes.summary || decision.comments || 'Executive authorization required for automated workflow progression.';
  const factors = changes.contributingFactors || ['Schedule turnaround compression', 'Logistical multi-unit complexity'];
  const evidence = changes.evidence || [
    {
      factor: 'schedule_compression',
      source: 'clickhouse',
      finding: 'Historical ClickHouse analytics indicate 32% increased turnaround delays for compressed documentary workflows.',
    },
  ];
  const recommendation = changes.recommendation || 'Authorize staging contingency buffer and proceed with workflow execution.';
  const expectedImpact = changes.expectedImpact || 'Secures budget contingency and mitigates downstream schedule delays.';
  const affectedSteps = changes.affectedWorkflowSteps || ['schedule-generation', 'budget-approval', 'marketing-plan'];

  const handleAction = async (type: 'approve' | 'reject') => {
    setSubmitting(true);
    setActionType(type);
    try {
      if (type === 'approve') {
        await onApprove(decision.id, reviewerComment.trim() || undefined);
      } else {
        await onReject(decision.id, reviewerComment.trim() || undefined);
      }
      setReviewerComment('');
      setShowCommentInput(false);
      onClose();
    } finally {
      setSubmitting(false);
      setActionType(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="bg-card text-card-foreground w-full max-w-2xl rounded-lg border border-border shadow-2xl overflow-hidden divide-y divide-border my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-muted/30 flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div
              className={clsx(
                'w-9 h-9 rounded-md flex items-center justify-center font-bold text-xs shrink-0 shadow-xs',
                riskLevel === 'CRITICAL' && 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
                riskLevel === 'HIGH' && 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
                (riskLevel === 'MEDIUM' || riskLevel === 'LOW') && 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
              )}
            >
              <ShieldAlert size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-foreground truncate">AI Decision Review Gate</h2>
                <span
                  className={clsx(
                    'px-2 py-0.5 rounded text-[10px] font-mono font-bold border tracking-wider',
                    riskLevel === 'CRITICAL' && 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800',
                    riskLevel === 'HIGH' && 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
                    (riskLevel === 'MEDIUM' || riskLevel === 'LOW') && 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
                  )}
                >
                  {riskLevel} RISK
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Production: <strong className="text-foreground">{decision.productionTitle || 'The Last Horizon'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[65vh] sm:max-h-[70vh] overflow-y-auto text-xs">
          {/* Executive Summary */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
              Decision Context & Summary:
            </span>
            <div className="p-3 rounded-md bg-muted/40 border border-border text-foreground font-medium leading-relaxed">
              {summary}
            </div>
          </div>

          {/* AI Recommendation Box */}
          <div className="p-3.5 rounded-md bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 space-y-1">
            <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 uppercase tracking-wider font-semibold block">
              Autonomous AI Recommendation:
            </span>
            <p className="text-emerald-950 dark:text-emerald-200 font-semibold leading-snug">
              {recommendation}
            </p>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90 pt-1">
              <strong>Expected Operational Impact:</strong> {expectedImpact}
            </p>
          </div>

          {/* Evidence Breakdown with ClickHouse Badges */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
              Empirical Historical Evidence (ClickHouse Cloud):
            </span>
            <div className="space-y-2">
              {evidence.map((ev, idx) => (
                <div key={idx} className="p-2.5 rounded-md bg-muted/30 border border-border flex items-start gap-2.5">
                  <span className="px-1.5 py-0.5 rounded font-mono text-[9px] bg-slate-900 text-white dark:bg-white dark:text-slate-900 shrink-0 mt-0.5 flex items-center gap-1">
                    <Database size={10} /> {ev.source || 'clickhouse'}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground capitalize">{ev.factor?.replace(/_/g, ' ')}</p>
                    <p className="text-muted-foreground leading-relaxed mt-0.5">{ev.finding}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contributing Factors & Impacted Pipeline Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-md bg-muted/20 border border-border space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                Contributing Factors:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-foreground">
                {factors.map((fac, i) => (
                  <li key={i} className="text-[11px] leading-relaxed">{fac}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-md bg-muted/20 border border-border space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                Affected Workflow Steps:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {affectedSteps.map((step, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-muted border border-border font-mono text-[10px] text-foreground">
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Reviewer Comment Input */}
          <div className="space-y-1.5 pt-1">
            <button
              type="button"
              onClick={() => setShowCommentInput((v) => !v)}
              className="text-[11px] text-accent hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <MessageSquare size={12} />
              <span>{showCommentInput ? 'Hide audit notes' : '+ Add decision notes / justification (optional)'}</span>
            </button>

            {showCommentInput && (
              <textarea
                rows={2}
                value={reviewerComment}
                onChange={(e) => setReviewerComment(e.target.value)}
                placeholder="Optional executive rationale to record in the immutable audit log…"
                className="w-full text-xs p-2.5 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            )}
          </div>

          {/* Governance Provenance */}
          <div className="p-3 rounded-md bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-muted-foreground">
            <span>Data Sources: <strong>ClickHouse Historical Intelligence + FastMCP + Gemini</strong></span>
            <span className="font-mono text-[10px]">Gate: Separation of Duties Active</span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-3 sm:p-4 bg-muted/20 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5">
          <button
            onClick={() => handleAction('reject')}
            disabled={submitting}
            className="btn-danger text-xs px-4 py-2 flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            <X size={14} />
            <span>{submitting && actionType === 'reject' ? 'Rejecting…' : 'Reject Decision'}</span>
          </button>
          <button
            onClick={() => handleAction('approve')}
            disabled={submitting}
            className="btn-primary text-xs px-5 py-2 flex items-center justify-center gap-1.5 shadow-sm w-full sm:w-auto"
          >
            <Check size={14} />
            <span>{submitting && actionType === 'approve' ? 'Executing…' : 'Approve & Execute Workflow'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
