'use client';
import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/AgentStatusBadge';
import { LoadingState, ErrorState } from '@/components/PageState';
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
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  activeProductions: number;
  runningWorkflows: number;
  pendingApprovals: number;
  agents: { id: string; type: string; status: string; confidence: number | null }[];
}

const AGENT_ROLES: Record<string, { label: string; role: string }> = {
  DIRECTOR: { label: 'Director', role: 'Executive creative direction & workflow pipeline orchestration' },
  SCRIPT: { label: 'Script', role: 'Screenplay analysis, scene breakdowns, character extraction' },
  BUDGET: { label: 'Budget', role: 'Financial modeling, department allocations, contingency plans' },
  SCHEDULE: { label: 'Schedule', role: 'Production calendar optimization & resource timeline planning' },
  RISK: { label: 'Risk', role: 'Policy compliance auditing, hazard detection, safety gates' },
  MARKETING: { label: 'Marketing', role: 'Audience demographic targeting & promotional distribution' },
  ANALYTICS: { label: 'Analytics', role: 'System telemetry, execution benchmarks, latency metrics' },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [productions, setProductions] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, prods, apps] = await Promise.all([
        api.dashboard(),
        api.productions().catch(() => ({ data: [] })),
        api.approvals().catch(() => []),
      ]);
      setData(dash as DashboardData);
      setProductions(Array.isArray(prods) ? prods : ((prods as any)?.data ?? []));
      setApprovals(Array.isArray(apps) ? apps : ((apps as any)?.data ?? []));
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

    return () => {
      socket.off('approvalRequested', handleEvent);
      socket.off('approvalGranted', handleEvent);
      socket.off('approvalRejected', handleEvent);
      socket.off('workflowStarted', handleEvent);
      socket.off('workflowCompleted', handleEvent);
    };
  }, [load]);

  async function handleQuickApproval(approvalId: string, action: 'approve' | 'reject') {
    try {
      if (action === 'approve') await api.approve(approvalId);
      else await api.reject(approvalId);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to process approval.');
    }
  }

  // Derive real recent activities from real productions and approvals
  const recentActivities: { title: string; desc: string; time: string; type: string }[] = [];

  approvals.slice(0, 3).forEach((a) => {
    recentActivities.push({
      title: a.workflow?.production?.title || 'Policy Gate',
      desc: a.comments,
      time: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'Recent',
      type: a.status === 'PENDING' ? 'ACTION_REQUIRED' : 'RESOLVED',
    });
  });

  productions.slice(0, 3).forEach((p) => {
    const currentState = p.workflows?.[0]?.currentState ?? p.status;
    recentActivities.push({
      title: p.title,
      desc: `State: ${currentState} • ${p.genre || 'Media'}`,
      time: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Active',
      type: 'PRODUCTION',
    });
  });

  return (
    <>
      <Header title="Dashboard" />

      <main className="p-8 space-y-6 max-w-7xl mx-auto">
        {loading && <LoadingState label="Loading workspace state & agent telemetry…" />}
        {!loading && error && <ErrorState message={error} onRetry={load} />}

        {!loading && !error && data && (
          <>
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
                value={data.agents?.length ?? 0}
                icon={Bot}
                tone="success"
                subtext={`${data.agents?.length ?? 0} agents active`}
              />
            </div>

            {/* Governance & Shortcuts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Human Governance Approval Card */}
              <div className="lg:col-span-2 card-enterprise divide-y divide-border">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-amber-600 dark:text-amber-400" />
                    <h2 className="text-xs font-bold text-foreground">Human Governance Queue</h2>
                  </div>
                  <Link href="/approvals" className="text-xs font-medium text-accent hover:underline flex items-center gap-1">
                    View full queue ({approvals.filter((a) => a.status === 'PENDING').length}) <ChevronRight size={13} />
                  </Link>
                </div>

                <div className="p-4 space-y-3">
                  {approvals.filter((a) => a.status === 'PENDING').length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground space-y-1">
                      <CheckCircle2 size={20} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-1" />
                      <p className="font-semibold text-foreground">No pending approval gates.</p>
                      <p>All active workflows are executing autonomously.</p>
                    </div>
                  ) : (
                    approvals
                      .filter((a) => a.status === 'PENDING')
                      .slice(0, 3)
                      .map((app) => (
                        <div
                          key={app.id}
                          className="p-3 rounded-sm bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                Approval Required
                              </span>
                              {app.workflow?.production?.title && (
                                <span className="text-xs font-semibold text-foreground truncate">
                                  {app.workflow.production.title}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-snug">{app.comments}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleQuickApproval(app.id, 'reject')}
                              className="btn-danger text-xs px-2.5 py-1"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleQuickApproval(app.id, 'approve')}
                              className="btn-primary text-xs px-3 py-1"
                            >
                              Approve
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Quick Launch & Studio Shortcuts */}
              <div className="card-enterprise p-4 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Play size={16} className="text-foreground" />
                    <h3 className="text-xs font-bold text-foreground">Studio Orchestration</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Initiate new production projects or dispatch workflows.
                  </p>
                </div>

                <div className="space-y-2">
                  <Link href="/productions/new" className="btn-accent w-full py-2">
                    <Plus size={14} /> Create Production
                  </Link>
                  <Link href="/productions" className="btn-secondary w-full py-2">
                    <Clapperboard size={14} /> Browse Productions
                  </Link>
                  <Link href="/analytics" className="btn-secondary w-full py-2">
                    <Activity size={14} /> System Analytics
                  </Link>
                </div>
              </div>
            </div>

            {/* AI Agent Workforce Cluster Matrix */}
            <div className="card-enterprise divide-y divide-border">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Bot size={16} className="text-foreground" />
                    <h2 className="text-xs font-bold text-foreground">AI Agent Roster</h2>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Autonomous agents registered in this environment.
                  </p>
                </div>
                <Link href="/agents" className="text-xs font-medium text-accent hover:underline flex items-center gap-1">
                  Agent details <ArrowUpRight size={13} />
                </Link>
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-card">
                {data.agents && data.agents.length > 0 ? (
                  data.agents.map((agent) => {
                    const info = AGENT_ROLES[agent.type] || {
                      label: agent.type,
                      role: 'Autonomous workflow agent',
                    };
                    const confidence = agent.confidence != null ? Math.round(agent.confidence * 100) : null;

                    return (
                      <div
                        key={agent.id || agent.type}
                        className="p-3 rounded-sm border border-border bg-muted/20 hover:bg-muted/40 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground">{info.label}</span>
                          <StatusBadge status={agent.status} size="sm" />
                        </div>

                        <p className="text-[11px] text-muted-foreground line-clamp-2 min-h-[32px]">
                          {info.role}
                        </p>

                        <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                          <span>{agent.type}</span>
                          {confidence != null && (
                            <span className="text-foreground font-semibold">{confidence}% Conf</span>
                          )}
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

            {/* Recent Productions & Activity Log Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Productions Table */}
              <div className="card-enterprise divide-y divide-border">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clapperboard size={16} className="text-foreground" />
                    <h3 className="text-xs font-bold text-foreground">Recent Productions</h3>
                  </div>
                  <Link href="/productions" className="text-xs font-medium text-accent hover:underline">
                    View all →
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

              {/* Realtime Activity Stream */}
              <div className="card-enterprise divide-y divide-border">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-foreground" />
                    <h3 className="text-xs font-bold text-foreground">Recent Workflow Events</h3>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">Audit Log</span>
                </div>

                <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                  {recentActivities.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      No recent workflow events logged yet.
                    </div>
                  ) : (
                    recentActivities.map((log, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-sm bg-muted/30 border border-border/80 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-semibold text-foreground truncate">{log.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{log.desc}</p>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">{log.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
