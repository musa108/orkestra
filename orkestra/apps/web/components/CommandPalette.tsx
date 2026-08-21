'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, LayoutDashboard, Clapperboard, Bot, ShieldCheck, BarChart3, Settings, Plus, X } from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && open) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const actions = [
    { label: 'Go to Dashboard Overview', category: 'Navigation', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'View All Productions', category: 'Navigation', icon: Clapperboard, href: '/productions' },
    { label: 'Create New Production Project', category: 'Quick Action', icon: Plus, href: '/productions/new' },
    { label: 'Inspect AI Agent Roster (7 Agents)', category: 'Workforce', icon: Bot, href: '/agents' },
    { label: 'Review Human Approval Gates', category: 'Governance', icon: ShieldCheck, href: '/approvals' },
    { label: 'System Telemetry & Analytics', category: 'Intelligence', icon: BarChart3, href: '/analytics' },
    { label: 'Studio & AI Provider Settings', category: 'Management', icon: Settings, href: '/settings' },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div
        className="w-full max-w-lg bg-card text-card-foreground border border-border rounded-lg shadow-elevated overflow-hidden divide-y divide-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command, production, or jump to page…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No matching actions found.</p>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => handleSelect(item.href)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-sm text-xs text-left hover:bg-muted/80 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={15} className="text-muted-foreground group-hover:text-foreground" />
                    <span className="font-medium text-foreground">{item.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-muted/40 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Navigate with <kbd className="px-1 py-0.5 bg-card border border-border rounded text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 bg-card border border-border rounded text-[10px]">↓</kbd></span>
          <span>Press <kbd className="px-1 py-0.5 bg-card border border-border rounded text-[10px]">ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
