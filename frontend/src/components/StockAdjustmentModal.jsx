import React, { useState, useEffect } from 'react';
import { X, Loader2, ArrowUpRight, ArrowDownRight, AlertTriangle, AlertCircle } from 'lucide-react';

export function StockAdjustmentModal({ isOpen, onClose, item, action = 'increase', onConfirm }) {
  const [amount, setAmount] = useState('1');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const isIncrease = action === 'increase';

  useEffect(() => {
    if (isOpen) {
      setAmount('1');
      setError(null);
      setServerError(null);
      setSubmitting(false);
    }
  }, [isOpen, item, action]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen || !item) return null;

  const currentQty = Number(item.quantity) || 0;
  const numAmount = parseInt(amount, 10);
  const isValidInteger = !isNaN(numAmount) && Number.isInteger(Number(amount)) && numAmount > 0;

  // Compute preview
  let previewQty = currentQty;
  let isOverdraft = false;

  if (isValidInteger) {
    if (isIncrease) {
      previewQty = currentQty + numAmount;
    } else {
      previewQty = currentQty - numAmount;
      if (previewQty < 0) {
        isOverdraft = true;
      }
    }
  }

  const validate = () => {
    setError(null);
    if (!amount || isNaN(numAmount) || !Number.isInteger(Number(amount))) {
      setError('Adjustment amount must be a valid integer.');
      return false;
    }
    if (numAmount <= 0) {
      setError('Adjustment amount must be greater than zero.');
      return false;
    }
    if (!isIncrease && isOverdraft) {
      setError(`Cannot decrease stock by ${numAmount}. Current stock is ${currentQty}. Stock must never drop below zero.`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      await onConfirm(item.id, action, numAmount);
      onClose();
    } catch (err) {
      setServerError(err.message || 'Stock adjustment failed.');
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
            <div
              className={`p-2 rounded-lg ${
                isIncrease ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
              }`}
            >
              {isIncrease ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isIncrease ? 'Increase Stock' : 'Decrease Stock'}
              </h3>
              <p className="text-xs text-slate-500">
                Item #{item.id} — <span className="font-semibold text-slate-700">{item.name}</span>
              </p>
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

          {/* Current Stock Information Panel */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <div>
              <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Current Stock</span>
              <p className="text-2xl font-bold text-slate-900">{currentQty}</p>
            </div>
            <div>
              <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Low-Stock Alert</span>
              <p className="text-2xl font-bold text-slate-500">{item.low_stock_threshold}</p>
            </div>
          </div>

          {/* Adjustment Quantity Input */}
          <div>
            <label htmlFor="adjustAmount" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Quantity to {isIncrease ? 'Add' : 'Deduct'} <span className="text-rose-500">*</span>
            </label>
            <input
              id="adjustAmount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
                setServerError(null);
              }}
              disabled={submitting}
              autoFocus
              className={`w-full px-3.5 py-2.5 rounded-lg border text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                error || isOverdraft
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
              }`}
            />
            {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
          </div>

          {/* Preview State Card */}
          {isValidInteger && (
            <div
              className={`flex items-center justify-between p-3 rounded-lg border text-xs font-medium ${
                isOverdraft
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : previewQty <= item.low_stock_threshold
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isOverdraft ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <span>Projected Stock:</span>
                )}
                <span>
                  {isOverdraft ? 'Negative stock prohibited!' : `${currentQty} ${isIncrease ? '+' : '-'} ${numAmount} =`}
                </span>
              </div>
              <span className="text-sm font-bold">
                {isOverdraft ? 'Invalid' : `${previewQty} units`}
              </span>
            </div>
          )}

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
              disabled={submitting || isOverdraft}
              className={`inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-all shadow-xs disabled:opacity-50 ${
                isIncrease
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
              }`}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Applying...' : isIncrease ? 'Confirm Increase' : 'Confirm Decrease'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StockAdjustmentModal;
