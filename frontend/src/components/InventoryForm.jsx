import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, PlusCircle } from 'lucide-react';

export function InventoryForm({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [initialQuantity, setInitialQuantity] = useState('0');
  const [threshold, setThreshold] = useState('0');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setInitialQuantity('0');
      setThreshold('0');
      setErrors({});
      setServerError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    // Validate Name
    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'Item name is required and cannot be whitespace.';
    }

    // Validate Initial Quantity
    const qtyNum = Number(initialQuantity);
    if (initialQuantity === '' || isNaN(qtyNum) || !Number.isInteger(qtyNum)) {
      newErrors.initialQuantity = 'Initial quantity must be a valid integer.';
    } else if (qtyNum < 0) {
      newErrors.initialQuantity = 'Initial quantity cannot be negative.';
    }

    // Validate Low-Stock Threshold
    const thrNum = Number(threshold);
    if (threshold === '' || isNaN(thrNum) || !Number.isInteger(thrNum)) {
      newErrors.threshold = 'Threshold must be a valid integer.';
    } else if (thrNum < 0) {
      newErrors.threshold = 'Threshold cannot be negative.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        initial_quantity: parseInt(initialQuantity, 10),
        low_stock_threshold: parseInt(threshold, 10),
      });
      onClose();
    } catch (err) {
      setServerError(err.message || 'Failed to create inventory item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={() => !submitting && onClose()}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Inventory Item</h3>
              <p className="text-xs text-slate-500">Register a new product in the counter database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {serverError && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Item Name */}
          <div>
            <label htmlFor="itemName" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Item Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="itemName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ergonomic Office Chair"
              disabled={submitting}
              className={`w-full px-3.5 py-2 rounded-lg border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.name
                  ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.name}</p>}
          </div>

          {/* Quantities Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Initial Quantity */}
            <div>
              <label htmlFor="initialQty" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Initial Stock <span className="text-rose-500">*</span>
              </label>
              <input
                id="initialQty"
                type="number"
                min="0"
                step="1"
                value={initialQuantity}
                onChange={(e) => setInitialQuantity(e.target.value)}
                disabled={submitting}
                className={`w-full px-3.5 py-2 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition-all ${
                  errors.initialQuantity
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
                }`}
              />
              {errors.initialQuantity && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.initialQuantity}</p>
              )}
            </div>

            {/* Low-Stock Threshold */}
            <div>
              <label htmlFor="stockThreshold" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Alert Threshold <span className="text-rose-500">*</span>
              </label>
              <input
                id="stockThreshold"
                type="number"
                min="0"
                step="1"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                disabled={submitting}
                className={`w-full px-3.5 py-2 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition-all ${
                  errors.threshold
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
                }`}
              />
              {errors.threshold && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.threshold}</p>
              )}
            </div>
          </div>

          <p className="text-2xs text-slate-400">
            * Items with stock less than or equal to their alert threshold are automatically flagged as low stock.
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-all shadow-xs"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InventoryForm;
