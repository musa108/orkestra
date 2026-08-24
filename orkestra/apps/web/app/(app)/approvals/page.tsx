'use client';
import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { LoadingState, ErrorState, EmptyState } from '@/components/PageState';
import { DecisionReviewModal, DecisionReviewData } from '@/components/DecisionReviewModal';
import { api, ApiError } from '@/lib/api';
import {
  ShieldCheck,
  Check,
  X,
  AlertOctagon,
  Clock,
  ShieldAlert,
  AlertTriangle,
  Info,
  ChevronRight,
  Database,
  FileText,
} from 'lucide-react';
import clsx from 'clsx';
import { getWorkflowSocket } from '@/lib/socket';

interface Approval {
  id: string;
  workflowId: string;
  productionId: string;
  status: string;
  comments: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  action?: string;
  proposedChanges?: any;
  createdAt: string;
  workflow?: { production: { title: string } };
}

const RISK_BADGES: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  LOW: {
    label: 'Low Risk',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/40',
    icon: Info,
  },
  MEDIUM: {
    label: 'Medium Risk',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/40',
    icon: AlertTriangle,
  },
  HIGH: {
    label: 'High Risk',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/40',
    icon: ShieldAlert,
  },
  CRITICAL: {
    label: 'Critical Hazard',
    bg: 'bg-red-100 dark:bg-red-950/80',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700',
    icon: AlertOctagon,
  },
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[] | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<DecisionReviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setError(null);
    api.approvals()
      .then((r: any) => setApprovals(Array.isArray(r) ? r : (r?.data ?? [])))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load approvals.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live real-time socket refresh when approvals are requested or granted
  useEffect(() => {
    const socket = getWorkflowSocket();
    const handleEvent = () => load();
    socket.on('approvalRequested', handleEvent);
    socket.on('approvalGranted', handleEvent);
    socket.on('approvalRejected', handleEvent);
    socket.on('workflowCompleted', handleEvent);

    return () => {
      socket.off('approvalRequested', handleEvent);
      socket.off('approvalGranted', handleEvent);
      socket.off('approvalRejected', handleEvent);
      socket.off('workflowCompleted', handleEvent);
    };
  }, [load]);

  async function handleApprove(id: string) {
    await api.approve(id);
    await load();
  }

  async function handleReject(id: string) {
    await api.reject(id);
    await load();
  }

  const pendingList = approvals?.filter((a) => a.status === 'PENDING') ?? [];
  const resolvedList = approvals?.filter((a) => a.status !== 'PENDING') ?? [];

  return (
    <>
      <Header
        title="Approvals & Safety Gates"
        breadcrumbs={[{ label: 'Governance & Safety' }]}
      />

      <main className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-bold text-foreground">Human-in-the-Loop Governance Gates</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review and authorize autonomous AI recommendations backed by ClickHouse historical telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-muted border border-border text-foreground">
              {pendingList.length} Pending Actions
            </span>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && <LoadingState label="Loading approval governance queue…" />}
        {!loading && error && <ErrorState message={error} onRetry={load} />}

        {/* Empty State */}
        {!loading && !error && approvals && approvals.length === 0 && (
          <EmptyState
            title="All governance gates cleared"
            description="There are currently no active workflows paused waiting for human producer authorization."
          />
        )}

        {/* Pending Approvals Section */}
        {!loading && !error && pendingList.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Pending Producer Authorization ({pendingList.length})
            </h2>

            <div className="space-y-3">
              {pendingList.map((a) => {
                const risk = RISK_BADGES[a.riskLevel ?? 'HIGH'] || RISK_BADGES.HIGH;
                const RiskIcon = risk.icon;

                return (
                  <div
                    key={a.id}
                    className="card-enterprise p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-amber-300 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={clsx(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border',
                            risk.bg,
                            risk.text,
                            risk.border,
                          )}
                        >
                          <RiskIcon size={12} />
                          <span>{risk.label}</span>
                        </span>

                        {a.workflow?.production?.title && (
                          <span className="text-xs font-semibold text-foreground">
                            Production: <strong className="underline">{a.workflow.production.title}</strong>
                          </span>
                        )}

                        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                          <Database size={11} className="text-amber-500" /> ClickHouse Historical Analysis
                        </span>
                      </div>

                      <p className="text-xs text-foreground font-medium leading-relaxed max-w-3xl">
                        {a.comments}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() =>
                          setSelectedDecision({
                            id: a.id,
                            workflowId: a.workflowId,
                            productionId: a.productionId,
                            productionTitle: a.workflow?.production?.title,
                            action: a.action,
                            riskLevel: a.riskLevel,
                            comments: a.comments,
                            proposedChanges: a.proposedChanges,
                          })
                        }
                        className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-sm"
                      >
                        <span>Review AI Decision</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resolved Approvals History */}
        {!loading && !error && resolvedList.length > 0 && (
          <div className="space-y-3 pt-4">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Governance Audit History ({resolvedList.length})
            </h2>

            <div className="card-enterprise divide-y divide-border">
              {resolvedList.map((a) => (
                <div key={a.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate">
                        {a.workflow?.production?.title || 'Production Gate'}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Status: <strong className={a.status === 'APPROVED' ? 'text-emerald-600' : 'text-red-600'}>{a.status}</strong>
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{a.comments}</p>
                  </div>

                  <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                    {a.status === 'APPROVED' ? 'Granted' : 'Denied'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Full AI Decision Review Modal */}
      <DecisionReviewModal
        decision={selectedDecision}
        onClose={() => setSelectedDecision(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}
