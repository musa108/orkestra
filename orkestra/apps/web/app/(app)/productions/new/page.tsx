'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { api, ApiError } from '@/lib/api';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function NewProductionPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    genre: '',
    description: '',
    budget: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const production: any = await api.createProduction({
        title: form.title.trim(),
        genre: form.genre.trim() || undefined,
        description: form.description.trim() || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
      });
      router.push(`/productions/${production.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create production.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header
        title="New Production"
        breadcrumbs={[
          { label: 'Productions', href: '/productions' },
          { label: 'New Production' },
        ]}
      />

      <main className="p-8 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-base font-bold text-foreground">Create Production</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure project specifications and narrative brief to initiate autonomous multi-agent orchestration.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-sm text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Main Production Form */}
        <form onSubmit={handleSubmit} className="card-enterprise p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground block">
              Production Title <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-enterprise"
              placeholder="Enter production title"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block">Genre / Format</label>
              <input
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                className="input-enterprise"
                placeholder="e.g. Documentary, Feature, Sci-Fi"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block">Target Budget (USD)</label>
              <input
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                type="number"
                className="input-enterprise"
                placeholder="e.g. 1500000"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground block">
              Screenplay Brief / Production Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-enterprise"
              rows={5}
              placeholder="Provide the screenplay brief, scene logline, and goals used by the Script and Director agents…"
            />
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between">
            <Link href="/productions" className="btn-secondary text-xs">
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading || !form.title.trim()}
              className="btn-accent text-xs px-4 py-2"
            >
              <Plus size={14} />
              <span>{loading ? 'Creating…' : 'Create Production'}</span>
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
