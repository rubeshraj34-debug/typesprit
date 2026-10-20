import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';

export function Logo({ to = '/', light = false }: { to?: string; light?: boolean }) {
  return (
    <Link to={to} className="flex items-center gap-2 group" aria-label="TypeSprint home">
      <span className="grid place-items-center w-9 h-9 bg-accent border-2 border-ink shadow-brut-sm font-display text-ink text-lg group-hover:-rotate-6 transition-transform">
        T
      </span>
      <span className={`font-display text-xl tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
        Type<span className="text-accent">Sprint</span>
      </span>
    </Link>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden />;
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="min-h-[50vh] grid place-items-center" role="status">
      <div className="flex items-center gap-3 card-b px-5 py-3 font-mono text-sm">
        <Spinner className="w-4 h-4 text-accent" /> {label}
      </div>
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="border-2 border-ink bg-bad-soft p-4 flex items-start gap-3 shadow-brut-sm">
      <AlertTriangle className="w-5 h-5 text-bad shrink-0 mt-0.5" />
      <div className="flex-1 text-sm font-medium">{message}</div>
      {onRetry && (
        <button onClick={onRetry} className="btn bg-white text-xs py-1 px-3">
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="border-2 border-dashed border-ink/40 p-8 text-center bg-cream/60">
      <div className="mx-auto w-12 h-12 grid place-items-center border-2 border-ink bg-white shadow-brut-sm mb-3">{icon}</div>
      <h3 className="font-display text-lg">{title}</h3>
      <p className="text-muted text-sm mt-1 max-w-sm mx-auto">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatTile({ label, value, sub, accent = 'bg-white', icon }: { label: string; value: ReactNode; sub?: ReactNode; accent?: string; icon?: ReactNode }) {
  return (
    <div className={`card-b ${accent} p-4 flex flex-col gap-1 min-w-0`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[0.68rem] uppercase tracking-wider font-bold text-ink/70">{label}</span>
        {icon}
      </div>
      <div className="font-display text-2xl sm:text-3xl leading-none truncate">{value}</div>
      {sub && <div className="text-xs text-muted font-medium">{sub}</div>}
    </div>
  );
}

export function SectionTitle({ kicker, title, action }: { kicker?: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div>
        {kicker && <div className="font-mono text-xs uppercase tracking-widest text-accent font-bold">{kicker}</div>}
        <h2 className="font-display text-xl sm:text-2xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}
