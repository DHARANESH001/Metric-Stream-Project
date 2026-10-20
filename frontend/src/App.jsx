import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import InventoryTable from './components/InventoryTable';
import InventoryForm from './components/InventoryForm';
import StockAdjustmentModal from './components/StockAdjustmentModal';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import useInventory from './hooks/useInventory';
import { computeStockStatus, STOCK_STATUS } from './utils/inventoryUtils';

export function App() {
  const {
    items,
    loading,
    refreshing,
    error,
    fetchItems,
    addItem,
    adjustStock,
  } = useInventory();

  // Navigation state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustModal, setAdjustModal] = useState({
    isOpen: false,
    item: null,
    action: 'increase',
  });

  // Notification Toast state
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 4500);
  };

  // Stock Adjustment Handlers
  const handleOpenIncrease = (item) => {
    setAdjustModal({
      isOpen: true,
      item,
      action: 'increase',
    });
  };

  const handleOpenDecrease = (item) => {
    setAdjustModal({
      isOpen: true,
      item,
      action: 'decrease',
    });
  };

  const handleConfirmAdjust = async (itemId, action, amount) => {
    const res = await adjustStock(itemId, action, amount);
    showToast('success', res.message || `Stock ${action}d by ${amount}. New stock: ${res.quantity}.`);
  };

  const handleCreateItem = async (itemData) => {
    const created = await addItem(itemData);
    showToast('success', `Item "${created.name}" created successfully with ${created.quantity} units.`);
  };

  // Filter items if low-stock tab is active
  const lowStockItems = items.filter((item) => {
    const status = computeStockStatus(item);
    return status === STOCK_STATUS.LOW_STOCK || status === STOCK_STATUS.OUT_OF_STOCK;
  });

  const getPageTitle = () => {
    if (activeTab === 'low-stock') return 'Low Stock Alerts';
    if (activeTab === 'inventory') return 'All Inventory Items';
    return 'Inventory Dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={getPageTitle()}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onAddItem={() => setIsAddModalOpen(true)}
          onRefresh={fetchItems}
          refreshing={refreshing}
        />

        {/* Global Toast Notification Banner */}
        {toast && (
          <div className="px-4 sm:px-6 lg:px-8 pt-4">
            <div
              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm shadow-xs transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
                toast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {toast.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span className="font-medium">{toast.message}</span>
              </div>
              <button
                onClick={() => setToast(null)}
                className="p-1 rounded-md hover:bg-black/5 text-current opacity-60 hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Page Views */}
        <main className="flex-1">
          {loading && items.length === 0 ? (
            <div className="p-6 max-w-7xl mx-auto">
              <LoadingState message="Connecting to inventory database..." />
            </div>
          ) : error && items.length === 0 ? (
            <div className="p-6 max-w-7xl mx-auto">
              <ErrorState message={error} onRetry={fetchItems} />
            </div>
          ) : activeTab === 'dashboard' ? (
            <Dashboard
              items={items}
              loading={loading}
              error={error}
              onRetry={fetchItems}
              onAddItem={() => setIsAddModalOpen(true)}
              onIncreaseStock={handleOpenIncrease}
              onDecreaseStock={handleOpenDecrease}
              onNavigateTab={setActiveTab}
            />
          ) : activeTab === 'inventory' ? (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Inventory Catalog</h3>
                  <p className="text-xs text-slate-500">Manage and adjust all stock records</p>
                </div>
              </div>
              <InventoryTable
                items={items}
                onIncreaseStock={handleOpenIncrease}
                onDecreaseStock={handleOpenDecrease}
                onAddItem={() => setIsAddModalOpen(true)}
              />
            </div>
          ) : (
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Low Stock & Out of Stock Items</h3>
                  <p className="text-xs text-slate-500">
                    Items that require replenishment ({lowStockItems.length} items flagged)
                  </p>
                </div>
              </div>
              <InventoryTable
                items={lowStockItems}
                onIncreaseStock={handleOpenIncrease}
                onDecreaseStock={handleOpenDecrease}
                onAddItem={() => setIsAddModalOpen(true)}
              />
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <InventoryForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateItem}
      />

      <StockAdjustmentModal
        isOpen={adjustModal.isOpen}
        item={adjustModal.item}
        action={adjustModal.action}
        onClose={() => setAdjustModal({ isOpen: false, item: null, action: 'increase' })}
        onConfirm={handleConfirmAdjust}
      />
    </div>
  );
}

export default App;
