'use client';
import { useState, useEffect } from 'react';
import { Search, Bell, ChevronRight, Check } from 'lucide-react';
import { CommandPalette } from '@/components/CommandPalette';
import { api } from '@/lib/api';
import Link from 'next/link';

interface HeaderProps {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function Header({ title, breadcrumbs }: HeaderProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    api.notifications()
      .then((res: any) => {
        setNotifications(Array.isArray(res) ? res : res?.data ?? []);
      })
      .catch(() => {
        setNotifications([]);
      });
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleMarkRead(id: string) {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // Ignore
    }
  }

  return (
    <>
      <header className="sticky top-0 z-10 bg-card/90 backdrop-blur-md border-b border-border px-8 py-3.5 flex items-center justify-between">
        {/* Left: Breadcrumbs & Page Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground transition-colors font-medium">
              Orkestra
            </Link>
            <ChevronRight size={12} className="text-muted-foreground/60" />
            {breadcrumbs && breadcrumbs.length > 0 ? (
              breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {b.href ? (
                    <Link href={b.href} className="hover:text-foreground transition-colors font-medium">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-semibold">{b.label}</span>
                  )}
                  {i < breadcrumbs.length - 1 && <ChevronRight size={12} className="text-muted-foreground/60" />}
                </span>
              ))
            ) : (
              <span className="text-foreground font-semibold">{title}</span>
            )}
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/40 dark:text-emerald-300 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Cluster Operational</span>
          </div>
        </div>

        {/* Right: Search, Notifications, and Status */}
        <div className="flex items-center gap-3">
          {/* Quick Command Search Palette Trigger */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-muted/60 hover:bg-muted border border-border text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer min-w-[200px]"
          >
            <Search size={13} />
            <span className="flex-1 text-left">Quick search or command…</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-card border border-border rounded text-muted-foreground">
              ⌘K
            </kbd>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen((v) => !v)}
              className="relative p-2 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors cursor-pointer"
              title="Audit Notifications"
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </button>

            {notificationsOpen && (
              <div
                className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-md shadow-elevated p-3 z-50 space-y-2 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-semibold text-foreground">Notifications</span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {unreadCount} unread
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.read && handleMarkRead(n.id)}
                        className={`p-2 rounded-sm text-left space-y-0.5 cursor-pointer transition-colors ${
                          n.read ? 'bg-muted/20 hover:bg-muted/40' : 'bg-muted/60 hover:bg-muted/80 font-medium'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-foreground">{n.title || n.type || 'Notification'}</p>
                          <span className="text-[10px] text-muted-foreground">
                            {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug">{n.message || n.body || ''}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-border flex justify-end">
                  <Link
                    href="/approvals"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-[11px] font-medium text-accent hover:underline"
                  >
                    View governance queue →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
