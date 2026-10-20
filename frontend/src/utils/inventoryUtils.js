/**
 * Inventory Counter utility functions for stock calculations and formatting.
 */

export const STOCK_STATUS = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
};

/**
 * Computes the 3-state stock classification according to business rules:
 * - Out of Stock: quantity === 0
 * - Low Stock: quantity > 0 && quantity <= threshold
 * - In Stock: quantity > threshold
 *
 * @param {Object} item - Inventory item with quantity and low_stock_threshold
 * @returns {string} One of STOCK_STATUS values
 */
export function computeStockStatus(item) {
  if (!item) return STOCK_STATUS.OUT_OF_STOCK;
  const quantity = Number(item.quantity) || 0;
  const threshold = Number(item.low_stock_threshold) || 0;

  if (quantity === 0) {
    return STOCK_STATUS.OUT_OF_STOCK;
  }
  if (quantity <= threshold) {
    return STOCK_STATUS.LOW_STOCK;
  }
  return STOCK_STATUS.IN_STOCK;
}

/**
 * Aggregates dashboard statistics dynamically from live inventory records.
 *
 * @param {Array} items - List of inventory item objects
 * @returns {Object} { totalItems, totalUnits, lowStockCount, outOfStockCount }
 */
export function calculateDashboardStats(items = []) {
  if (!Array.isArray(items)) {
    return {
      totalItems: 0,
      totalUnits: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    };
  }

  let totalUnits = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const item of items) {
    const qty = Number(item.quantity) || 0;
    const threshold = Number(item.low_stock_threshold) || 0;
    totalUnits += qty;

    if (qty === 0) {
      outOfStockCount += 1;
    } else if (qty <= threshold) {
      lowStockCount += 1;
    }
  }

  return {
    totalItems: items.length,
    totalUnits,
    lowStockCount,
    outOfStockCount,
  };
}

/**
 * Formats ISO date string into readable local timestamp.
 *
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateStr;
  }
}
