import React from 'react';
import { Menu, Plus, RefreshCw } from 'lucide-react';

export function Header({
  onOpenMobileMenu,
  onAddItem,
  onRefresh,
  refreshing = false,
  title = 'Inventory Overview',
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 transition-shadow">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            type="button"
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">{title}</h2>
            <p className="text-xs text-slate-500 hidden sm:block">
              Track stock levels, adjustments, and low-inventory alerts in real time
            </p>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60 transition-all shadow-2xs"
              title="Refresh inventory from server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          {/* Add Item Button */}
          {onAddItem && (
            <button
              onClick={onAddItem}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs sm:text-sm font-medium transition-all shadow-xs hover:shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
