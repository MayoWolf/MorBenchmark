import type { ReactNode } from 'react';

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`rounded border border-white/10 bg-field-panel ${className}`}>{children}</section>;
}

export function PanelHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-white/10 px-4 py-3">
      {eyebrow && <p className="text-[11px] font-medium uppercase tracking-wide text-blue-300">{eyebrow}</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {children}
      </div>
    </div>
  );
}
