import { AlertCircle, Inbox, Loader2, RefreshCw } from 'lucide-react';

export function LoadingState({ label = 'Loading data…' }: { label?: string }) {
  return (
    <div className="card-enterprise p-12 flex flex-col items-center justify-center text-center">
      <Loader2 size={24} className="animate-spin text-muted-foreground mb-3" />
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="card-enterprise p-8 flex flex-col items-center text-center border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
      <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 mb-3">
        <AlertCircle size={20} />
      </div>
      <p className="text-xs font-semibold text-foreground">Action Failed</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 btn-secondary text-xs inline-flex items-center gap-1.5"
        >
          <RefreshCw size={12} />
          <span>Try again</span>
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card-enterprise p-12 flex flex-col items-center text-center">
      <div className="p-3 rounded-full bg-muted text-muted-foreground mb-3">
        <Inbox size={22} />
      </div>
      <p className="text-xs font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 max-w-md">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
