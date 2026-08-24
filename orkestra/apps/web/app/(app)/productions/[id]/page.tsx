'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/AgentStatusBadge';
import { LoadingState, ErrorState } from '@/components/PageState';
import { WorkflowVisualizer } from '@/components/WorkflowVisualizer';
import { DecisionReviewModal, DecisionReviewData } from '@/components/DecisionReviewModal';
import { api, ApiError } from '@/lib/api';
import { getWorkflowSocket } from '@/lib/socket';
import {
  Play,
  Check,
  X,
  ShieldCheck,
  Clock,
  DollarSign,
  Film,
  FileText,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  name: string;
  assignedAgent: string;
  status: any;
  output: any;
}

interface WorkflowData {
  id: string;
  currentState: string;
  steps: WorkflowStep[];
  approvals: { id: string; status: string; comments: string; riskLevel?: string }[];
}

interface Production {
  id: string;
  title: string;
  description: string | null;
  genre: string | null;
  budget: string | null;
  workflows: { id: string; currentState: string }[];
}

export default function ProductionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [production, setProduction] = useState<Production | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<DecisionReviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const loadProduction = useCallback(async () => {
    try {
      setError(null);
      const p: any = await api.production(id);
      setProduction(p);
      if (p.workflows?.[0]) {
        const w: any = await api.workflow(p.workflows[0].id);
        setWorkflow(w);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load production project.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProduction();
  }, [loadProduction]);

  useEffect(() => {
    if (!workflow?.id) return;
    const socket = getWorkflowSocket();
    socket.emit('joinWorkflow', workflow.id);
    const refresh = () => loadProduction();

    const events = [
      'workflowStarted',
      'stepStarted',
      'stepCompleted',
      'approvalRequested',
      'approvalGranted',
      'workflowCompleted',
      'workflowFailed',
    ];
    events.forEach((evt) => socket.on(evt, refresh));

    return () => {
      socket.emit('leaveWorkflow', workflow.id);
      socket.removeAllListeners();
    };
  }, [workflow?.id, loadProduction]);

  async function handleStart() {
    setStarting(true);
    try {
      await api.startWorkflow(id, production?.description ?? undefined);
      await loadProduction();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to start AI workflow.');
    } finally {
      setStarting(false);
    }
  }

  async function decide(approvalId: string, action: 'approve' | 'reject') {
    try {
      if (action === 'approve') await api.approve(approvalId);
      else await api.reject(approvalId);
      await loadProduction();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to record approval decision.');
    }
  }

  if (loading) {
    return (
      <>
        <Header title="Production Details" />
        <main className="p-8 max-w-7xl mx-auto">
          <LoadingState label="Loading production workspace & workflow data…" />
        </main>
      </>
    );
  }

  if (error && !production) {
    return (
      <>
        <Header title="Production Details" />
        <main className="p-8 max-w-7xl mx-auto">
          <ErrorState message={error} onRetry={loadProduction} />
        </main>
      </>
    );
  }

  if (!production) return null;

  const pendingApprovals = workflow?.approvals?.filter((a) => a.status === 'PENDING') ?? [];

  return (
    <>
      <Header
        title={production.title}
        breadcrumbs={[
          { label: 'Productions', href: '/productions' },
          { label: production.title },
        ]}
      />

      <main className="p-8 space-y-6 max-w-7xl mx-auto">
        {error && <ErrorState message={error} onRetry={loadProduction} />}

        {/* Executive Project Header Card */}
        <div className="card-enterprise p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-foreground truncate">{production.title}</h1>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                  {production.genre || 'Documentary'}
                </span>
                {workflow && <StatusBadge status={workflow.currentState} size="md" />}
              </div>

              <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
                {production.description ||
                  'Enterprise media project managed via Orkestra autonomous state machine workflow.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!workflow ? (
                <button
                  onClick={handleStart}
                  disabled={starting}
                  className="btn-accent text-xs px-4 py-2"
                >
                  <Play size={14} />
                  <span>{starting ? 'Initializing Agents…' : 'Launch AI Workflow'}</span>
                </button>
              ) : (
                <button
                  onClick={loadProduction}
                  className="btn-secondary text-xs px-3 py-2"
                  title="Refresh state"
                >
                  <RefreshCw size={13} />
                  <span>Sync Telemetry</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Target Budget</span>
              <span className="font-mono font-semibold text-foreground">
                {production.budget ? `$${Number(production.budget).toLocaleString()}` : '—'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Orchestrator Engine</span>
              <span className="font-mono font-semibold text-accent">Gemini 1.5 Pro</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Total Agent Steps</span>
              <span className="font-mono font-semibold text-foreground">
                {workflow?.steps?.length ?? 0} Steps
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Human Policy Gates</span>
              <span className="font-mono font-semibold text-foreground">
                {workflow?.approvals?.length ?? 0} ({pendingApprovals.length} Pending)
              </span>
            </div>
          </div>
        </div>

        {/* Human Governance Approval Banner (Urgent Action) */}
        {pendingApprovals.length > 0 && (
          <div className="card-enterprise border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs">
                <ShieldCheck size={16} />
                <span>Executive AI Decision Review Gate: Human Producer Authorization Required</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                ClickHouse Historical Intelligence Grounded
              </span>
            </div>

            <div className="space-y-3">
              {pendingApprovals.map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 rounded-sm bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {a.riskLevel || 'HIGH'} Risk Gate
                      </span>
                      <span className="text-xs text-foreground font-semibold">Budget Authorization & Risk Mitigation</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.comments}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setSelectedDecision({
                          id: a.id,
                          workflowId: workflow!.id,
                          productionId: production.id,
                          productionTitle: production.title,
                          riskLevel: a.riskLevel,
                          comments: a.comments,
                        })
                      }
                      className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Review AI Decision & Evidence</span>
                      <ShieldCheck size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Orchestration Pipeline */}
        {workflow ? (
          <WorkflowVisualizer
            workflowId={workflow.id}
            currentState={workflow.currentState}
            steps={workflow.steps as any}
          />
        ) : (
          <div className="card-enterprise p-12 text-center text-xs text-muted-foreground space-y-3">
            <Film size={28} className="mx-auto text-muted-foreground/60" />
            <div>
              <p className="font-semibold text-foreground text-sm">No workflow initialized yet</p>
              <p className="mt-1">
                Click "Launch AI Workflow" above to begin autonomous script analysis, budget estimation, and scheduling.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Full AI Decision Review Modal */}
      <DecisionReviewModal
        decision={selectedDecision}
        onClose={() => setSelectedDecision(null)}
        onApprove={(id) => decide(id, 'approve')}
        onReject={(id) => decide(id, 'reject')}
      />
    </>
  );
}
