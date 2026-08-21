import clsx from 'clsx';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const normalized = (status || 'IDLE').toUpperCase();

  const config: Record<
    string,
    { label: string; dot: string; bg: string; text: string; border: string }
  > = {
    RUNNING: {
      label: 'Running',
      dot: 'bg-blue-500 animate-pulse',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800/50',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      dot: 'bg-blue-500 animate-pulse',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800/50',
    },
    WAITING: {
      label: 'Waiting',
      dot: 'bg-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800/50',
    },
    PENDING: {
      label: 'Pending',
      dot: 'bg-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-800/60',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-700',
    },
    APPROVAL_REQUIRED: {
      label: 'Approval Gate',
      dot: 'bg-amber-500 animate-pulse',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-700',
    },
    COMPLETED: {
      label: 'Completed',
      dot: 'bg-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800/50',
    },
    READY: {
      label: 'Ready',
      dot: 'bg-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800/50',
    },
    ACTIVE: {
      label: 'Active',
      dot: 'bg-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800/50',
    },
    FAILED: {
      label: 'Failed',
      dot: 'bg-red-500',
      bg: 'bg-red-50 dark:bg-red-950/40',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800/50',
    },
    REJECTED: {
      label: 'Rejected',
      dot: 'bg-red-500',
      bg: 'bg-red-50 dark:bg-red-950/40',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800/50',
    },
    IDLE: {
      label: 'Idle',
      dot: 'bg-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-800/60',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-700',
    },
  };

  const current = config[normalized] || {
    label: normalized,
    dot: 'bg-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800/60',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  };

  return (
    <span
      className={clsx(
        'badge-enterprise inline-flex items-center gap-1.5 font-medium border shrink-0',
        current.bg,
        current.text,
        current.border,
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', current.dot)} />
      <span>{current.label}</span>
    </span>
  );
}
