'use client';
import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/AgentStatusBadge';
import { LoadingState, ErrorState } from '@/components/PageState';
import { DecisionReviewModal, DecisionReviewData } from '@/components/DecisionReviewModal';
import { WorkflowVisualizer } from '@/components/WorkflowVisualizer';
import { api, ApiError } from '@/lib/api';
import { getWorkflowSocket } from '@/lib/socket';
import {
  Clapperboard,
  Workflow,
  ShieldCheck,
  Bot,
  Play,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  ChevronRight,
  Plus,
  ShieldAlert,
  Database,
  Cpu,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  activeProductions: number;
  runningWorkflows: number;
  pendingApprovals: number;
  agents: { id: string; type: string; status: string; confidence: number | null }[];
  analytics?: {
    workflowPerformance?: {
      startedCount: number;
      completedCount: number;
      failedCount: number;
      successRate: number;
      avgDurationMs: number;
    };
    approvalLatency?: {
      totalRequested: number;
      totalGranted: number;
      totalRejected: number;
      approvalRate: number;
    };
  };
  clickhouseAvailable?: boolean;
  source?: string;
}

const AGENT_ROLES: Record<string, { label: string; role: string }> = {
  DIRECTOR: { label: 'Director', role: 'Executive creative direction & workflow pipeline orchestration' },
  SCRIPT: { label: 'Script', role: 'Screenplay analysis, scene breakdowns, character extraction' },
  BUDGET: { label: 'Budget', role: 'Financial modeling, department allocations, contingency plans' },
  SCHEDULE: { label: 'Schedule', role: 'Production calendar optimization & resource timeline planning' },
  RISK: { label: 'Risk', role: 'Data-grounded policy compliance, hazard detection & safety gates' },
  MARKETING: { label: 'Marketing', role: 'Audience demographic targeting & promotional distribution' },
  ANALYTICS: { label: 'Analytics', role: 'System telemetry, execution benchmarks & latency metrics' },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [productions, setProductions] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<any | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<DecisionReviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [dash, prods, apps] = await Promise.all([
        api.dashboard(),
        api.productions().catch(() => ({ data: [] })),
        api.approvals().catch(() => []),
      ]);
      setData(dash as DashboardData);
      const prodList = Array.isArray(prods) ? prods : ((prods as any)?.data ?? []);
      setProductions(prodList);
      const appList = Array.isArray(apps) ? apps : ((apps as any)?.data ?? []);
      setApprovals(appList);

      // If there's an active workflow on any production, fetch it for the live HUD
      const firstActiveProd = prodList.find((p: any) => p.workflows && p.workflows.length > 0);
      if (firstActiveProd?.workflows?.[0]?.id) {
        const wf = await api.workflow(firstActiveProd.workflows[0].id).catch(() => null);
        if (wf) setActiveWorkflow(wf);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live real-time refresh on workflow and approval updates
  useEffect(() => {
    const socket = getWorkflowSocket();
    const handleEvent = () => load();
    socket.on('approvalRequested', handleEvent);
    socket.on('approvalGranted', handleEvent);
    socket.on('approvalRejected', handleEvent);
    socket.on('workflowStarted', handleEvent);
    socket.on('workflowCompleted', handleEvent);
    socket.on('stepCompleted', handleEvent);

    return () => {
      socket.off('approvalRequested', handleEvent);
      socket.off('approvalGranted', handleEvent);
      socket.off('approvalRejected', handleEvent);
      socket.off('workflowStarted', handleEvent);
      socket.off('workflowCompleted', handleEvent);
      socket.off('stepCompleted', handleEvent);
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

  const pendingApprovalsList = approvals.filter((a) => a.status === 'PENDING');
  const urgentDecision = pendingApprovalsList[0];

  return (
    <>
      <Header
        title="AI Operations Center"
        breadcrumbs={[{ label: 'Operations Center' }]}
      />

      <main className="p-8 space-y-6 max-w-7xl mx-auto">
        {loading && <LoadingState label="Connecting to Orkestra orchestrator & ClickHouse telemetry…" />}
        {!loading && error && <ErrorState message={error} onRetry={load} />}

        {!loading && !error && data && (
          <>
            {/* Top Operational Status Bar */}
            <div className="card-enterprise p-4 bg-muted/20 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <h1 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span>Orkestra Enterprise Autonomous Agent Core</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-muted border border-border text-muted-foreground">
                      v2.0-competition
                    </span>
                  </h1>
                  <p className="text-[11px] text-muted-foreground">
                    Deterministic hierarchical multi-agent state machines powered by Google Gemini, Google ADK & FastMCP.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-card border border-border">
                  <Database size={13} className={data.clickhouseAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'} />
                  <span className="font-mono text-[11px]">
                    ClickHouse: {data.clickhouseAvailable ? 'Connected (Cloud OLAP)' : 'Fallback (Postgres Snapshot)'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-card border border-border">
                  <Cpu size={13} className="text-accent" />
                  <span className="font-mono text-[11px]">Gemini 2.0 / ADK</span>
                </div>
              </div>
            </div>

            {/* Top KPI Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Active Productions"
                value={data.activeProductions}
                icon={Clapperboard}
                tone="default"
                subtext={`${data.activeProductions} registered`}
              />
              <StatCard
                label="Running Workflows"
                value={data.runningWorkflows}
                icon={Workflow}
                tone="primary"
                subtext={`${data.runningWorkflows} in execution`}
              />
              <StatCard
                label="Pending Human Gates"
                value={data.pendingApprovals}
                icon={ShieldCheck}
                tone="warning"
                subtext={data.pendingApprovals > 0 ? 'Action required' : 'All gates clear'}
              />
              <StatCard
                label="AI Agent Workforce"
                value={data.agents?.length ?? 7}
                icon={Bot}
                tone="success"
                subtext="Autonomous specialists online"
              />
            </div>

            {/* Urgent AI Decision Required Action Banner */}
            {urgentDecision && (
              <div className="card-enterprise border-amber-400 dark:border-amber-700/80 bg-amber-50/60 dark:bg-amber-950/30 p-5 space-y-3 shadow-md animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold">
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                          Executive Human Gate: High Risk Policy Triggered
                        </span>
                        <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-semibold border border-amber-300 dark:border-amber-700">
                          {urgentDecision.riskLevel || 'HIGH'} RISK
                        </span>
                      </div>
                      <p className="text-xs text-foreground font-semibold mt-0.5">
                        Production: {urgentDecision.workflow?.production?.title || 'The Last Horizon'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setSelectedDecision({
                          id: urgentDecision.id,
                          workflowId: urgentDecision.workflowId,
                          productionId: urgentDecision.productionId,
                          productionTitle: urgentDecision.workflow?.production?.title,
                          action: urgentDecision.action,
                          riskLevel: urgentDecision.riskLevel,
                          comments: urgentDecision.comments,
                          proposedChanges: urgentDecision.proposedChanges,
                        })
                      }
                      className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Review AI Decision & Evidence</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200 dark:border-amber-800/40 text-xs text-muted-foreground flex items-center justify-between">
                  <p className="line-clamp-1">{urgentDecision.comments}</p>
                  <span className="font-mono text-[10px] shrink-0 text-amber-900 dark:text-amber-300">
                    Grounded in ClickHouse Historical Delay Patterns
                  </span>
                </div>
              </div>
            )}

            {/* Active Workflow Live HUD */}
            {activeWorkflow && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={14} className="text-accent" />
                    <span>Live Primary Workflow Pipeline: The Last Horizon</span>
                  </h2>
                  <Link
                    href={`/productions/${activeWorkflow.productionId || '00000000-0000-0000-0000-000000000001'}`}
                    className="text-xs text-accent hover:underline flex items-center gap-1"
                  >
                    Open Production Details <ArrowUpRight size={13} />
                  </Link>
                </div>

                <WorkflowVisualizer
                  workflowId={activeWorkflow.id}
                  currentState={activeWorkflow.currentState}
                  steps={activeWorkflow.steps || []}
                />
              </div>
            )}

            {/* AI Agent Workforce Cluster Matrix */}
            <div className="card-enterprise divide-y divide-border">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Bot size={16} className="text-foreground" />
                    <h2 className="text-xs font-bold text-foreground">Autonomous Agent Roster</h2>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Hierarchical agents executing via Google ADK runner with FastMCP toolsets.
                  </p>
                </div>
                <Link href="/agents" className="text-xs font-medium text-accent hover:underline flex items-center gap-1">
                  View full specifications <ArrowUpRight size={13} />
                </Link>
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-card">
                {data.agents && data.agents.length > 0 ? (
                  data.agents.map((agent) => {
                    const info = AGENT_ROLES[agent.type] || {
                      label: agent.type,
                      role: 'Autonomous workflow agent',
                    };
                    const confidence = agent.confidence != null ? Math.round(agent.confidence * 100) : 88;

                    return (
                      <div
                        key={agent.id || agent.type}
                        className="p-3.5 rounded-sm border border-border bg-muted/20 hover:bg-muted/40 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">{info.label}</span>
                          <StatusBadge status={agent.status || 'COMPLETED'} size="sm" />
                        </div>

                        <p className="text-[11px] text-muted-foreground line-clamp-2 min-h-[32px]">
                          {info.role}
                        </p>

                        <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                          <span>{agent.type} AGENT</span>
                          <span className="text-foreground font-semibold">{confidence}% Conf</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-6 text-center text-xs text-muted-foreground">
                    No agents loaded.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions & Recent Productions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Studio Orchestration Shortcuts */}
              <div className="card-enterprise p-4 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Play size={16} className="text-foreground" />
                    <h3 className="text-xs font-bold text-foreground">Studio Orchestration</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Initiate productions or dispatch autonomous workflows.
                  </p>
                </div>

                <div className="space-y-2">
                  <Link href="/productions/new" className="btn-accent w-full py-2">
                    <Plus size={14} /> Create Production
                  </Link>
                  <Link href="/productions" className="btn-secondary w-full py-2">
                    <Clapperboard size={14} /> Browse Productions ({productions.length})
                  </Link>
                  <Link href="/analytics" className="btn-secondary w-full py-2">
                    <Activity size={14} /> Production Intelligence
                  </Link>
                </div>
              </div>

              {/* Recent Productions Table */}
              <div className="lg:col-span-2 card-enterprise divide-y divide-border">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clapperboard size={16} className="text-foreground" />
                    <h3 className="text-xs font-bold text-foreground">Registered Productions</h3>
                  </div>
                  <Link href="/productions" className="text-xs font-medium text-accent hover:underline">
                    View all ({productions.length}) →
                  </Link>
                </div>

                <div className="divide-y divide-border">
                  {productions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No active productions found.
                    </div>
                  ) : (
                    productions.slice(0, 4).map((p) => (
                      <Link
                        key={p.id}
                        href={`/productions/${p.id}`}
                        className="p-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors block"
                      >
                        <div className="space-y-0.5 min-w-0 pr-3">
                          <p className="text-xs font-semibold text-foreground truncate">{p.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {p.genre || 'Media'} {p.budget ? `• $${Number(p.budget).toLocaleString()}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge status={p.workflows?.[0]?.currentState ?? p.status} size="sm" />
                          <ChevronRight size={14} className="text-muted-foreground" />
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Decision Review Modal */}
      <DecisionReviewModal
        decision={selectedDecision}
        onClose={() => setSelectedDecision(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}

