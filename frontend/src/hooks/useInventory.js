import { useState, useEffect, useCallback } from 'react';
import inventoryService from '../services/inventoryService';

export function useInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async (isBackground = false) => {
    if (isBackground) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await inventoryService.getItems();
      setItems(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(false);
  }, [fetchItems]);

  const addItem = async (itemData) => {
    const created = await inventoryService.createItem(itemData);
    await fetchItems(true);
    return created;
  };

  const adjustStock = async (itemId, action, amount) => {
    let result;
    if (action === 'increase') {
      result = await inventoryService.increaseStock(itemId, amount);
    } else if (action === 'decrease') {
      result = await inventoryService.decreaseStock(itemId, amount);
    } else {
      throw new Error(`Invalid stock action: ${action}`);
    }
    await fetchItems(true);
    return result;
  };

  return {
    items,
    loading,
    refreshing,
    error,
    fetchItems: () => fetchItems(true),
    addItem,
    adjustStock,
  };
}

export default useInventory;
