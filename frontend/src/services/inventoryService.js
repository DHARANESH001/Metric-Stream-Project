import api from './api';

export const inventoryService = {
  /**
   * Fetch all inventory items.
   * @param {Object} [params] - Optional query params like { skip: 0, limit: 100 }
   * @returns {Promise<Array>} List of items
   */
  async getItems(params = {}) {
    const response = await api.get('/items', { params });
    return response.data;
  },

  /**
   * Fetch a single item by ID.
   * @param {number} itemId
   * @returns {Promise<Object>} Item record
   */
  async getItem(itemId) {
    const response = await api.get(`/items/${itemId}`);
    return response.data;
  },

  /**
   * Create a new inventory item.
   * @param {Object} payload - { name: string, initial_quantity: number, low_stock_threshold: number }
   * @returns {Promise<Object>} Created item record
   */
  async createItem(payload) {
    const response = await api.post('/items', {
      name: payload.name.trim(),
      initial_quantity: Number(payload.initial_quantity) || 0,
      low_stock_threshold: Number(payload.low_stock_threshold) || 0,
    });
    return response.data;
  },

  /**
   * Increase item stock quantity.
   * @param {number} itemId
   * @param {number} amount - Strictly positive integer
   * @returns {Promise<Object>} StockAdjustmentResponse
   */
  async increaseStock(itemId, amount) {
    const response = await api.post(`/items/${itemId}/increase`, {
      amount: Number(amount),
    });
    return response.data;
  },

  /**
   * Decrease item stock quantity.
   * @param {number} itemId
   * @param {number} amount - Strictly positive integer <= current stock
   * @returns {Promise<Object>} StockAdjustmentResponse
   */
  async decreaseStock(itemId, amount) {
    const response = await api.post(`/items/${itemId}/decrease`, {
      amount: Number(amount),
    });
    return response.data;
  },

  /**
   * Check low-stock threshold status for an item.
   * @param {number} itemId
   * @returns {Promise<Object>} StockStatusResponse
   */
  async getStockStatus(itemId) {
    const response = await api.get(`/items/${itemId}/stock-status`);
    return response.data;
  },
};

export default inventoryService;
