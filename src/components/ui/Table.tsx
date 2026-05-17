import type { ReactNode } from 'react';

export function TableShell({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function DataTable({ children }: { children: ReactNode }) {
  return <table className="min-w-full divide-y divide-white/10 text-sm">{children}</table>;
}

export function StickyHeader({ children }: { children: ReactNode }) {
  return <thead className="sticky top-0 z-10 bg-field-rail text-left text-xs uppercase tracking-wide text-slate-500">{children}</thead>;
}
