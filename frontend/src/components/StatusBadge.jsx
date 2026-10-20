import React from 'react';
import { STOCK_STATUS } from '../utils/inventoryUtils';

export function StatusBadge({ status }) {
  let badgeClasses = 'bg-slate-100 text-slate-700 ring-slate-500/10';
  let dotClasses = 'bg-slate-400';

  if (status === STOCK_STATUS.IN_STOCK) {
    badgeClasses = 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    dotClasses = 'bg-emerald-500';
  } else if (status === STOCK_STATUS.LOW_STOCK) {
    badgeClasses = 'bg-amber-50 text-amber-700 ring-amber-600/20';
    dotClasses = 'bg-amber-500';
  } else if (status === STOCK_STATUS.OUT_OF_STOCK) {
    badgeClasses = 'bg-rose-50 text-rose-700 ring-rose-600/20';
    dotClasses = 'bg-rose-500';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${badgeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClasses}`} aria-hidden="true" />
      {status}
    </span>
  );
}

export default StatusBadge;
