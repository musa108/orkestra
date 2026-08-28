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
  Filter,
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
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');

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

  // Live real-time socket refresh when approvals are requested or decided
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

  async function handleApprove(id: string, comments?: string) {
    await api.approve(id, comments);
    await load();
  }

  async function handleReject(id: string, comments?: string) {
    await api.reject(id, comments);
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

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground">Human-in-the-Loop Governance Gates</h1>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
              Review and authorize autonomous AI recommendations backed by ClickHouse empirical telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-muted border border-border text-foreground">
              {pendingList.length} Pending Actions
            </span>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-muted border border-border text-muted-foreground">
              {resolvedList.length} Resolved
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 border-b border-border pb-3 overflow-x-auto">
          <button
            onClick={() => setFilter('ALL')}
            className={clsx(
              'px-3 py-1.5 rounded-sm text-xs font-medium transition-colors cursor-pointer shrink-0',
              filter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            All Gates ({approvals?.length ?? 0})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={clsx(
              'px-3 py-1.5 rounded-sm text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5',
              filter === 'PENDING'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            <span>Pending Action</span>
            {pendingList.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
            <span className="text-[10px] font-mono">({pendingList.length})</span>
          </button>
          <button
            onClick={() => setFilter('RESOLVED')}
            className={clsx(
              'px-3 py-1.5 rounded-sm text-xs font-medium transition-colors cursor-pointer shrink-0',
              filter === 'RESOLVED'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            Resolved Audit History ({resolvedList.length})
          </button>
        </div>

        {/* Loading and Error States */}
        {loading && <LoadingState label="Loading approval governance queue…" />}
        {!loading && error && <ErrorState message={error} onRetry={load} />}

        {/* Empty State */}
        {!loading && !error && approvals && approvals.length === 0 && (
          <EmptyState
            title="All governance gates cleared"
            description="There are currently no active workflows paused waiting for human executive authorization."
          />
        )}

        {/* Pending Approvals Section */}
        {!loading && !error && (filter === 'ALL' || filter === 'PENDING') && pendingList.length > 0 && (
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
                    className="card-enterprise p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-amber-300 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm"
                  >
                    <div className="space-y-2 min-w-0 flex-1">
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

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
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
                        className="btn-primary text-xs px-4 py-2 flex items-center justify-center gap-1.5 shadow-sm w-full sm:w-auto cursor-pointer"
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
        {!loading && !error && (filter === 'ALL' || filter === 'RESOLVED') && resolvedList.length > 0 && (
          <div className="space-y-3 pt-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Governance Audit History ({resolvedList.length})
            </h2>

            <div className="card-enterprise divide-y divide-border overflow-hidden">
              {resolvedList.map((a) => (
                <div key={a.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground truncate">
                        {a.workflow?.production?.title || 'Production Gate'}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Status: <strong className={a.status === 'APPROVED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{a.status}</strong>
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{a.comments}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono">
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded font-bold text-[10px]',
                        a.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
                      )}
                    >
                      {a.status === 'APPROVED' ? 'Granted' : 'Denied'}
                    </span>
                    <span className="text-muted-foreground">
                      {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
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
