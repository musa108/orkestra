import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  subtext?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  trend,
  trendDirection = 'up',
  subtext,
}: StatCardProps) {
  const toneIconStyles = {
    default: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800',
    primary: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40',
    success: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
    warning: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40',
    danger: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40',
  };

  return (
    <div className="card-enterprise p-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground num-data">{value}</p>
        </div>

        {Icon && (
          <div className={clsx('p-2 rounded-sm shrink-0 border border-border/40', toneIconStyles[tone])}>
            <Icon size={18} />
          </div>
        )}
      </div>

      {(trend || subtext) && (
        <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-[11px]">
          {trend && (
            <div className="flex items-center gap-1 font-medium text-muted-foreground">
              {trendDirection === 'up' && <TrendingUp size={12} className="text-emerald-600 dark:text-emerald-400" />}
              {trendDirection === 'down' && <TrendingDown size={12} className="text-rose-600 dark:text-rose-400" />}
              {trendDirection === 'neutral' && <Minus size={12} className="text-muted-foreground" />}
              <span className="text-foreground font-semibold">{trend}</span>
            </div>
          )}
          {subtext && <span className="text-muted-foreground truncate">{subtext}</span>}
        </div>
      )}
    </div>
  );
}
