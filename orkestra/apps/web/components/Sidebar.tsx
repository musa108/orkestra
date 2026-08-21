'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard,
  Clapperboard,
  Bot,
  ShieldCheck,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import clsx from 'clsx';
import { api, clearAccessToken } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { getWorkflowSocket } from '@/lib/socket';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  badge?: string | number;
  badgeTone?: 'default' | 'accent' | 'warning' | 'success';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<{ firstName?: string; lastName?: string; email?: string } | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [agentCount, setAgentCount] = useState<number | null>(null);

  const loadData = useCallback(() => {
    api.dashboard().then((d: any) => {
      if (typeof d?.pendingApprovals === 'number') {
        setPendingCount(d.pendingApprovals);
      }
      if (Array.isArray(d?.agents)) {
        setAgentCount(d.agents.length);
      }
    }).catch(() => void 0);
  }, []);

  useEffect(() => {
    api.me().then((u: any) => setUser(u)).catch(() => void 0);
    loadData();
  }, [loadData]);

  useEffect(() => {
    const socket = getWorkflowSocket();
    const handleEvent = () => loadData();
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
  }, [loadData]);

  async function handleLogout() {
    try {
      await api.logout();
    } finally {
      clearAccessToken();
      router.replace('/login');
    }
  }

  const sections: NavSection[] = [
    {
      title: 'Orchestration',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/productions', label: 'Productions', icon: Clapperboard },
      ],
    },
    {
      title: 'Workforce & Safety',
      items: [
        {
          href: '/agents',
          label: 'AI Agents',
          icon: Bot,
          badge: agentCount !== null ? `${agentCount} Active` : undefined,
          badgeTone: 'success',
        },
        {
          href: '/approvals',
          label: 'Approvals & Gates',
          icon: ShieldCheck,
          badge: pendingCount && pendingCount > 0 ? `${pendingCount}` : undefined,
          badgeTone: 'warning',
        },
      ],
    },
    {
      title: 'Intelligence',
      items: [
        { href: '/analytics', label: 'Analytics & Telemetry', icon: BarChart3 },
      ],
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-card border-r border-border h-screen sticky top-0 flex flex-col justify-between z-20 select-none">
      {/* Top section */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
        {/* Workspace Brand Header */}
        <div className="p-3 border-b border-border">
          <button
            type="button"
            className="w-full flex items-center justify-between p-2 rounded-sm hover:bg-muted/80 transition-colors text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-subtle">
                <OrkestraMark size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-foreground truncate">Orkestra</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">AI Orchestration</p>
              </div>
            </div>
            <ChevronDown size={14} className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="p-3 space-y-5 flex-1">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              <h2 className="px-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                {section.title}
              </h2>
              <div className="space-y-0.5 pt-1">
                {section.items.map(({ href, label, icon: Icon, badge, badgeTone }) => {
                  const active = href === '/dashboard' ? pathname === '/dashboard' : pathname?.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={clsx(
                        'flex items-center justify-between px-2.5 py-1.5 rounded-sm text-xs font-medium transition-all group',
                        active
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-subtle'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={15}
                          className={clsx(
                            'shrink-0 transition-colors',
                            active
                              ? 'text-white dark:text-slate-900'
                              : 'text-muted-foreground group-hover:text-foreground',
                          )}
                        />
                        <span className="truncate">{label}</span>
                      </div>
                      {badge && (
                        <span
                          className={clsx(
                            'text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full shrink-0',
                            active
                              ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                              : badgeTone === 'warning'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : badgeTone === 'success'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Live Cluster Heartbeat Pill */}
        <div className="p-3 mx-3 mb-2 bg-muted/60 border border-border/80 rounded-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Orchestrator Cluster</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">READY</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Autonomous agent workforce operational.
          </p>
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-border space-y-2 bg-card">
        {/* Settings & Theme Row */}
        <div className="flex items-center justify-between gap-1">
          <Link
            href="/settings"
            className={clsx(
              'flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-sm text-xs font-medium transition-colors',
              pathname?.startsWith('/settings')
                ? 'bg-muted text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
            )}
          >
            <Settings size={14} />
            <span>Settings</span>
          </Link>

          <button
            onClick={toggleTheme}
            type="button"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>
        </div>

        {/* User Card */}
        {user ? (
          <div className="flex items-center justify-between p-2 rounded-sm bg-muted/40 border border-border">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-semibold text-[11px] shrink-0">
                {(user.firstName?.[0] || 'U') + (user.lastName?.[0] || '')}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {user.firstName || 'User'} {user.lastName || ''}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 rounded-sm text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <div className="h-10 bg-muted/40 rounded-sm animate-pulse" />
        )}
      </div>
    </aside>
  );
}

export function OrkestraMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="4" r="2.25" fill="currentColor" />
      <circle cx="4" cy="17" r="2" fill="currentColor" />
      <circle cx="12" cy="20" r="2" fill="currentColor" />
      <circle cx="20" cy="17" r="2" fill="currentColor" />
      <path
        d="M12 6.5V12M12 12L5.5 15.5M12 12V18M12 12L18.5 15.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
