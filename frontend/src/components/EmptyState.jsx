import React from 'react';
import { Package, Plus, FilterX } from 'lucide-react';

export function EmptyState({ onAddItem, isFiltered = false, onResetFilter }) {
  if (isFiltered) {
    return (
      <div className="text-center py-12 px-4 bg-white rounded-xl border border-slate-200">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-500 mb-3">
          <FilterX className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">No matching items found</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
          No inventory items matched your active search or status filter criteria.
        </p>
        {onResetFilter && (
          <button
            onClick={onResetFilter}
            type="button"
            className="mt-4 px-3.5 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-16 px-4 bg-white rounded-xl border border-slate-200">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 mb-4">
        <Package className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">No inventory items yet</h3>
      <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto">
        Your inventory is currently empty. Get started by registering your first item with an initial stock and low-stock threshold.
      </p>
      {onAddItem && (
        <button
          onClick={onAddItem}
          type="button"
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add First Item
        </button>
      )}
    </div>
  );
}

export default EmptyState;
