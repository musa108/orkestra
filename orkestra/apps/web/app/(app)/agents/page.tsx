'use client';
import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/AgentStatusBadge';
import { LoadingState, ErrorState } from '@/components/PageState';
import { api, ApiError } from '@/lib/api';
import { Bot, Wrench } from 'lucide-react';

interface AgentInfo {
  desc: string;
  role: string;
  tools: string[];
}

const AGENT_DESCRIPTIONS: Record<string, AgentInfo> = {
  DIRECTOR: {
    desc: 'Coordinates overall production vision, validates scene aesthetics, and orchestrates downstream agent workflows.',
    role: 'Creative & Executive Lead',
    tools: ['Screenplay Context Engine', 'State Transition Dispatcher', 'Creative Tone Analyzer'],
  },
  SCRIPT: {
    desc: 'Extracts scenes, characters, dialogues, emotional arcs, and location requirements from raw scripts.',
    role: 'Screenplay & Scene Breakdown',
    tools: ['Fountain / PDF Parser', 'Scene Entity Extractor', 'Dialogue Density Calculator'],
  },
  BUDGET: {
    desc: 'Generates departmental line-item estimates, SAG-AFTRA rate calculations, and financial contingency buffers.',
    role: 'Financial Intelligence',
    tools: ['Line Item Calculator', 'Tax Credit Modeling', 'Department Matrix Estimator'],
  },
  SCHEDULE: {
    desc: 'Optimizes production shoot calendars, cast availability matrices, and multi-unit logistics.',
    role: 'Logistics & Shoot Timeline',
    tools: ['Day-Out-Of-Days Generator', 'Weather Matrix Predictor', 'Unit Stripboard Engine'],
  },
  RISK: {
    desc: 'Evaluates budget variances, stunt safety hazards, animal welfare policies, and regulatory insurance gates.',
    role: 'Safety & Compliance Gatekeeper',
    tools: ['Stunt Hazard Classifier', 'Insurance Policy Rules Engine', 'Weather Risk Modeler'],
  },
  MARKETING: {
    desc: 'Formulates audience demographic targets, distribution release windows, and teaser campaign strategies.',
    role: 'Audience & Release Strategy',
    tools: ['Demographic Indexer', 'Festival Submission Calendar', 'Trailer Sentiment Analyzer'],
  },
  ANALYTICS: {
    desc: 'Aggregates multi-agent telemetry, token usage, step latencies, and workflow outcome reliability.',
    role: 'Telemetry & Evaluation',
    tools: ['Step Latency Tracker', 'Token Cost Accountant', 'Evaluation Benchmark Engine'],
  },
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.agents()
      .then((r: any) => setAgents(Array.isArray(r) ? r : []))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load agent cluster.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Header
        title="AI Agents"
        breadcrumbs={[{ label: 'AI Agents' }]}
      />

      <main className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Cluster Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-bold text-foreground">Autonomous Agent Workforce</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Specialized AI agents registered in the database for deterministic state orchestration.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-muted border border-border text-foreground">
              {agents?.length ?? 0} Agents Registered
            </span>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && <LoadingState label="Inspecting agent cluster health & model bindings…" />}
        {!loading && error && <ErrorState message={error} onRetry={load} />}

        {/* Agent Grid */}
        {!loading && !error && agents && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => {
              const type = agent.type;
              const info = AGENT_DESCRIPTIONS[type] || {
                desc: 'Autonomous agent managed by Orkestra orchestration engine.',
                role: 'Workflow Agent',
                tools: ['State Machine Adapter'],
              };
              const confidence = agent.confidence != null ? Math.round(agent.confidence * 100) : null;

              return (
                <div
                  key={agent.id || type}
                  className="card-enterprise p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-semibold uppercase text-muted-foreground block">
                          {info.role}
                        </span>
                        <h2 className="text-sm font-bold text-foreground mt-0.5">
                          {type.charAt(0) + type.slice(1).toLowerCase()} Agent
                        </h2>
                      </div>
                      <StatusBadge status={agent.status} size="sm" />
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {info.desc}
                    </p>

                    {/* Tools list */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Wrench size={11} /> Bound Tools & Adapters
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {info.tools.map((tool, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-foreground border border-border"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer Metrics */}
                  <div className="pt-3 border-t border-border flex items-center justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">Type: {agent.type}</span>
                    {confidence != null && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {confidence}% Confidence
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
