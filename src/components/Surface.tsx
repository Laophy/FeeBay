import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink-900">{title}</h1>
        {subtitle && <p className="text-ink-500 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Section({
  title,
  children,
  className = '',
  right,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  right?: ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-line bg-white shadow-card p-4 ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between mb-3">
          {title && (
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink-500 font-bold">
              {title}
            </div>
          )}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function Pill({
  label,
  value,
  accent = 'text-ink-900',
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-md bg-ink-100 px-2 py-1">
      <div className="text-[9px] uppercase tracking-widest text-ink-500 font-bold">{label}</div>
      <div className={`text-xs font-bold ${accent}`}>{value}</div>
    </div>
  );
}
