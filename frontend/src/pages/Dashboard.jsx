import React, { useMemo } from 'react';
import {
  Boxes,
  PackageCheck,
  AlertTriangle,
  PackageX,
  Clock,
  ArrowRight,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import InventoryTable from '../components/InventoryTable';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { calculateDashboardStats, computeStockStatus, STOCK_STATUS, formatDate } from '../utils/inventoryUtils';

export function Dashboard({
  items = [],
  loading = false,
  error = null,
  onRetry,
  onAddItem,
  onIncreaseStock,
  onDecreaseStock,
  onNavigateTab,
}) {
  // Compute dashboard metrics dynamically from live inventory records
  const stats = useMemo(() => calculateDashboardStats(items), [items]);

  // Extract recent 4 items sorted by id descending
  const recentItems = useMemo(() => {
    return [...items].sort((a, b) => b.id - a.id).slice(0, 4);
  }, [items]);

  // Filter low-stock and out-of-stock items for attention banner
  const criticalItems = useMemo(() => {
    return items.filter((item) => {
      const status = computeStockStatus(item);
      return status === STOCK_STATUS.LOW_STOCK || status === STOCK_STATUS.OUT_OF_STOCK;
    });
  }, [items]);

  if (loading && items.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <LoadingState message="Connecting to inventory database..." />
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Critical Stock Alert Banner */}
      {criticalItems.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold">
                {criticalItems.length} {criticalItems.length === 1 ? 'item requires' : 'items require'} attention
              </h4>
              <p className="text-xs text-amber-700">
                Some items have reached their low-stock threshold or are completely out of stock.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('low-stock')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-semibold rounded-lg self-start sm:self-auto transition-colors"
          >
            <span>Review Alerts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Items"
          value={stats.totalItems}
          icon={Boxes}
          color="indigo"
          description="Distinct catalog items"
        />
        <StatCard
          title="Total Units in Stock"
          value={stats.totalUnits.toLocaleString()}
          icon={PackageCheck}
          color="emerald"
          description="Total physical units"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          color="amber"
          description="At or below alert threshold"
        />
        <StatCard
          title="Out of Stock"
          value={stats.outOfStockCount}
          icon={PackageX}
          color="rose"
          description="Zero quantity remaining"
        />
      </div>

      {/* Recent Inventory Quick Overview (when items exist) */}
      {recentItems.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Recent Inventory Additions
              </h3>
            </div>
            <span className="text-2xs font-semibold text-slate-400">Latest 4 records</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentItems.map((item) => {
              const status = computeStockStatus(item);

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="font-mono text-2xs text-slate-400">#{item.id}</span>
                    <StatusBadge status={status} />
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm truncate" title={item.name}>
                    {item.name}
                  </h4>
                  <div className="mt-2 flex items-baseline justify-between text-xs text-slate-500">
                    <span>
                      Stock: <strong className="text-slate-800 font-bold">{item.quantity}</strong>
                    </span>
                    <span>
                      Alert: <strong className="text-slate-600 font-medium">{item.low_stock_threshold}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Inventory Management Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">All Inventory Items</h3>
          <span className="text-xs text-slate-500">Live database sync</span>
        </div>

        <InventoryTable
          items={items}
          onIncreaseStock={onIncreaseStock}
          onDecreaseStock={onDecreaseStock}
          onAddItem={onAddItem}
        />
      </section>
    </div>
  );
}

export default Dashboard;
