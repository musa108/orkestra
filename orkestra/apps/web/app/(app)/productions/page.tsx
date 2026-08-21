'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/AgentStatusBadge';
import { LoadingState, ErrorState, EmptyState } from '@/components/PageState';
import { api, ApiError } from '@/lib/api';
import {
  Plus,
  Clapperboard,
  Search,
  LayoutGrid,
  List,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';

interface Production {
  id: string;
  title: string;
  description?: string | null;
  genre: string | null;
  status: string;
  budget: string | null;
  createdAt?: string;
  workflows: { currentState: string }[];
}

export default function ProductionsPage() {
  const [productions, setProductions] = useState<Production[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.productions()
      .then((r: any) => setProductions(r.data ?? []))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load productions.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = (productions || []).filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
      (p.genre && p.genre.toLowerCase().includes(search.toLowerCase()));

    const currentStatus = (p.workflows?.[0]?.currentState ?? p.status).toUpperCase();
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && currentStatus !== 'COMPLETED' && currentStatus !== 'FAILED') ||
      (statusFilter === 'COMPLETED' && currentStatus === 'COMPLETED');

    return matchSearch && matchStatus;
  });

  return (
    <>
      <Header title="Productions" />

      <main className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-bold text-foreground">Media Productions</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Production projects managed by Orkestra's multi-agent orchestration pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/productions/new" className="btn-accent text-xs">
              <Plus size={14} /> Create Production
            </Link>
          </div>
        </div>

        {/* Filter and View Toggles Bar */}
        <div className="card-enterprise p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter by title, genre, or keyword…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-enterprise pl-8 py-1.5 text-xs"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-card border border-border rounded-sm px-2.5 py-1.5 text-xs text-foreground outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active & In-Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-muted p-0.5 rounded-sm border border-border">
            <button
              onClick={() => setViewMode('table')}
              className={clsx(
                'p-1.5 rounded-xs text-xs font-medium transition-colors',
                viewMode === 'table' ? 'bg-card text-foreground shadow-subtle' : 'text-muted-foreground hover:text-foreground',
              )}
              title="Table View"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-1.5 rounded-xs text-xs font-medium transition-colors',
                viewMode === 'grid' ? 'bg-card text-foreground shadow-subtle' : 'text-muted-foreground hover:text-foreground',
              )}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && <LoadingState label="Loading production registry…" />}
        {!loading && error && <ErrorState message={error} onRetry={load} />}

        {/* Empty State */}
        {!loading && !error && productions && productions.length === 0 && (
          <EmptyState
            title="No productions registered."
            description="Create your first project to initiate autonomous multi-agent orchestration."
            action={
              <Link href="/productions/new" className="btn-accent">
                <Plus size={14} /> Create Production
              </Link>
            }
          />
        )}

        {/* Table View */}
        {!loading && !error && filtered && filtered.length > 0 && viewMode === 'table' && (
          <div className="card-enterprise overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Production Title & Brief</th>
                  <th className="py-3 px-4">Genre</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Workflow State</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const state = p.workflows?.[0]?.currentState ?? p.status;
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="py-3.5 px-4 max-w-sm">
                        <Link href={`/productions/${p.id}`} className="font-semibold text-foreground hover:text-accent transition-colors block truncate">
                          {p.title}
                        </Link>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {p.description || 'No description provided.'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-foreground bg-muted px-2 py-0.5 rounded text-[11px]">
                          {p.genre || 'Media'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono num-data text-foreground">
                        {p.budget ? `$${Number(p.budget).toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={state} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/productions/${p.id}`}
                          className="btn-secondary text-[11px] px-2.5 py-1 inline-flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ChevronRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Grid View */}
        {!loading && !error && filtered && filtered.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const state = p.workflows?.[0]?.currentState ?? p.status;
              return (
                <Link
                  key={p.id}
                  href={`/productions/${p.id}`}
                  className="card-interactive p-5 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-foreground group-hover:text-accent transition-colors line-clamp-1">
                        {p.title}
                      </h3>
                      <StatusBadge status={state} size="sm" />
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                      {p.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded text-[11px]">
                      {p.genre || 'Media'}
                    </span>
                    <span className="font-mono font-semibold text-foreground">
                      {p.budget ? `$${Number(p.budget).toLocaleString()}` : '—'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
