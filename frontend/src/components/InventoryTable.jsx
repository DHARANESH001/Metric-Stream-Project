import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  AlertTriangle,
  X,
  Package,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import EmptyState from './EmptyState';
import { computeStockStatus, STOCK_STATUS, formatDate } from '../utils/inventoryUtils';

export function InventoryTable({
  items = [],
  onIncreaseStock,
  onDecreaseStock,
  onAddItem,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState('id'); // 'id' | 'name' | 'quantity'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  // Filter and sort items dynamically
  const filteredAndSortedItems = useMemo(() => {
    return items
      .filter((item) => {
        // Name Search
        const matchesName = item.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
        if (!matchesName) return false;

        // Status Filter
        if (statusFilter === 'ALL') return true;
        const status = computeStockStatus(item);
        if (statusFilter === 'IN_STOCK') return status === STOCK_STATUS.IN_STOCK;
        if (statusFilter === 'LOW_STOCK') return status === STOCK_STATUS.LOW_STOCK;
        if (statusFilter === 'OUT_OF_STOCK') return status === STOCK_STATUS.OUT_OF_STOCK;
        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortField === 'quantity') {
          comparison = a.quantity - b.quantity;
        } else {
          comparison = a.id - b.id;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [items, searchTerm, statusFilter, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
    );
  };

  const isFiltered = searchTerm.trim() !== '' || statusFilter !== 'ALL';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Control Bar: Search and Filters */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search inventory by name..."
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Items' },
            { id: 'IN_STOCK', label: 'In Stock' },
            { id: 'LOW_STOCK', label: 'Low Stock' },
            { id: 'OUT_OF_STOCK', label: 'Out of Stock' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === pill.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Content */}
      {filteredAndSortedItems.length === 0 ? (
        <EmptyState
          onAddItem={onAddItem}
          isFiltered={isFiltered}
          onResetFilter={() => {
            setSearchTerm('');
            setStatusFilter('ALL');
          }}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-4 w-20">
                    <button
                      onClick={() => handleSort('id')}
                      className="group inline-flex items-center gap-1.5 hover:text-slate-800"
                    >
                      ID {getSortIcon('id')}
                    </button>
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    <button
                      onClick={() => handleSort('name')}
                      className="group inline-flex items-center gap-1.5 hover:text-slate-800"
                    >
                      Item Name {getSortIcon('name')}
                    </button>
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    <button
                      onClick={() => handleSort('quantity')}
                      className="group inline-flex items-center gap-1.5 hover:text-slate-800"
                    >
                      Available Stock {getSortIcon('quantity')}
                    </button>
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Alert Threshold
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Stock Status
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-right">
                    Stock Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAndSortedItems.map((item) => {
                  const status = computeStockStatus(item);
                  const isLow = status !== STOCK_STATUS.IN_STOCK;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                        #{item.id}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                          <span>{item.name}</span>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold text-base ${
                              item.quantity === 0
                                ? 'text-rose-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-slate-900'
                            }`}
                          >
                            {item.quantity}
                          </span>
                          <span className="text-xs text-slate-400">units</span>
                        </div>
                      </td>

                      {/* Low-Stock Threshold */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {item.low_stock_threshold}
                          </span>
                        </div>
                      </td>

                      {/* Stock Status Badge */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Increase */}
                          <button
                            onClick={() => onIncreaseStock(item)}
                            type="button"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200 transition-colors border border-emerald-200/60"
                            title="Increase stock quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>

                          {/* Decrease */}
                          <button
                            onClick={() => onDecreaseStock(item)}
                            type="button"
                            disabled={item.quantity === 0}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:bg-indigo-200 disabled:opacity-40 disabled:pointer-events-none transition-colors border border-indigo-200/60"
                            title={item.quantity === 0 ? 'Item is out of stock' : 'Decrease stock quantity'}
                          >
                            <Minus className="w-3.5 h-3.5" />
                            <span>Deduct</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredAndSortedItems.map((item) => {
              const status = computeStockStatus(item);

              return (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-2xs text-slate-400">#{item.id}</span>
                      <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                    </div>
                    <StatusBadge status={status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 text-2xs uppercase font-medium">Stock</span>
                      <p className="font-bold text-base text-slate-900">{item.quantity} units</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-2xs uppercase font-medium">Threshold</span>
                      <p className="font-semibold text-base text-slate-600">{item.low_stock_threshold}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onIncreaseStock(item)}
                      type="button"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 border border-emerald-200/60 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Increase
                    </button>
                    <button
                      onClick={() => onDecreaseStock(item)}
                      type="button"
                      disabled={item.quantity === 0}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 disabled:opacity-40 disabled:pointer-events-none border border-indigo-200/60 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                      Decrease
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table Footer */}
          <div className="px-4 py-3 bg-slate-50/75 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>
              Showing <strong className="text-slate-700">{filteredAndSortedItems.length}</strong> of{' '}
              <strong className="text-slate-700">{items.length}</strong> items
            </span>
            {isFiltered && (
              <span className="text-indigo-600 font-medium">Filtered results</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default InventoryTable;
