import React from 'react';

const colorMap = {
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-100',
    ring: 'ring-indigo-500/20',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-100',
    ring: 'ring-emerald-500/20',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-100',
    ring: 'ring-amber-500/20',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-rose-100',
    ring: 'ring-rose-500/20',
  },
};

export function StatCard({ title, value, icon: Icon, color = 'indigo', description }) {
  const styles = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-all hover:shadow-md hover:border-slate-300">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className={`p-2.5 rounded-lg ${styles.bg} ${styles.text}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight text-slate-900">{value}</span>
      </div>
      {description && (
        <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
          {description}
        </p>
      )}
    </div>
  );
}

export default StatCard;
