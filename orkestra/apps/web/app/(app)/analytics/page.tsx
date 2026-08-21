'use client';
import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/AgentStatusBadge';
import { LoadingState } from '@/components/PageState';
import { api } from '@/lib/api';
import {
  BarChart3,
  Bot,
  Workflow,
  ShieldCheck,
  Clapperboard,
  Activity,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.dashboard().catch(() => null),
      api.agents().catch(() => []),
      api.approvals().catch(() => []),
    ]).then(([dash, ags, apps]) => {
      setDashboard(dash);
      setAgents(Array.isArray(ags) ? ags : []);
      setApprovals(Array.isArray(apps) ? apps : ((apps as any)?.data ?? []));
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <>
        <Header title="Analytics" />
        <main className="p-8 max-w-7xl mx-auto">
          <LoadingState label="Loading live system telemetry…" />
        </main>
      </>
    );
  }

  const activeProductions = dashboard?.activeProductions ?? 0;
  const runningWorkflows = dashboard?.runningWorkflows ?? 0;
  const pendingApprovals = dashboard?.pendingApprovals ?? 0;
  const totalAgents = agents.length;

  const approvedCount = approvals.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = approvals.filter((a) => a.status === 'REJECTED').length;
  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;
  const totalApprovals = approvals.length;

  return (
    <>
      <Header
        title="Analytics & Telemetry"
        breadcrumbs={[{ label: 'Analytics' }]}
      />

      <main className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header Summary */}
        <div>
          <h1 className="text-base font-bold text-foreground">System Telemetry & Telemetrics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time status and operational metrics from the active Postgres & state machine database.
          </p>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Productions"
            value={activeProductions}
            icon={Clapperboard}
            tone="default"
            subtext="Registered projects"
          />
          <StatCard
            label="Running Workflows"
            value={runningWorkflows}
            icon={Workflow}
            tone="primary"
            subtext="In-flight state machines"
          />
          <StatCard
            label="Pending Policy Gates"
            value={pendingApprovals}
            icon={ShieldCheck}
            tone="warning"
            subtext="Waiting human review"
          />
          <StatCard
            label="Active AI Agents"
            value={totalAgents}
            icon={Bot}
            tone="success"
            subtext="Cluster workforce"
          />
        </div>

        {/* Middle Section: Agent Confidence & Approval Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent Benchmark Table */}
          <div className="card-enterprise lg:col-span-2 divide-y divide-border">
            <div className="p-4 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold text-foreground">Agent Workforce Status</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Live state and confidence metrics for registered autonomous agents.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-muted rounded text-muted-foreground">
                {totalAgents} Agents
              </span>
            </div>

            <div className="p-4 space-y-3.5">
              {agents.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No agents registered.</p>
              ) : (
                agents.map((ag) => {
                  const conf = ag.confidence != null ? Math.round(ag.confidence * 100) : null;
                  return (
                    <div key={ag.id || ag.type} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{ag.type}</span>
                          <StatusBadge status={ag.status} size="sm" />
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground font-mono text-[11px]">
                          {conf != null && (
                            <strong className="text-foreground font-bold">{conf}% Confidence</strong>
                          )}
                        </div>
                      </div>

                      {conf != null && (
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-slate-900 dark:bg-slate-100 h-1.5 rounded-full"
                            style={{ width: `${conf}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Real Governance & Policy Distribution */}
          <div className="card-enterprise p-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity size={16} className="text-foreground" />
                <h3 className="text-xs font-bold text-foreground">Governance Decisions Breakdown</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Summary of human-in-the-loop decisions recorded in this system.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-sm bg-muted/40 border border-border space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground text-[11px] font-medium">Approved Gates</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{approvedCount}</span>
                </div>
                {totalApprovals > 0 && (
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full"
                      style={{ width: `${(approvedCount / totalApprovals) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="p-3 rounded-sm bg-muted/40 border border-border space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground text-[11px] font-medium">Pending Review</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{pendingCount}</span>
                </div>
                {totalApprovals > 0 && (
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full"
                      style={{ width: `${(pendingCount / totalApprovals) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="p-3 rounded-sm bg-muted/40 border border-border space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground text-[11px] font-medium">Rejected Gates</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{rejectedCount}</span>
                </div>
                {totalApprovals > 0 && (
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-rose-500 h-1.5 rounded-full"
                      style={{ width: `${(rejectedCount / totalApprovals) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 rounded-sm bg-muted/60 border border-border text-xs text-muted-foreground">
              <span>Data queried live from database telemetry endpoints.</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
