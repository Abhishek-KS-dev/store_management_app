import { Category, Product, Sale, StockAdjustment } from '../types';
import { appsScriptService } from './appsScriptService';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const dataService = {
  getProducts: async (): Promise<Product[]> => {
    return appsScriptService.getProducts();
  },
  
  saveProduct: async (product: Product, staffId: string = 'owner'): Promise<void> => {
    // Check if updating existing product or adding new product
    if (product.id && !product.id.startsWith('NEW_')) {
      await appsScriptService.updateProduct(product, staffId);
    } else {
      await appsScriptService.addProduct(product, staffId);
    }
  },

  deleteProduct: async (id: string, staffId: string = 'owner'): Promise<void> => {
    await appsScriptService.deactivateProduct(id, staffId);
  },

  getCategories: async (): Promise<Category[]> => {
    return appsScriptService.getCategories();
  },

  getSales: async (): Promise<Sale[]> => {
    return appsScriptService.getSales();
  },

  getSale: async (billId: string): Promise<Sale> => {
    return appsScriptService.getSale(billId);
  },

  getDashboardData: async () => {
    return appsScriptService.getDashboardData();
  },

  createSale: async (sale: Sale, staffId: string = 'owner'): Promise<Sale> => {
    return appsScriptService.createSale(
      sale.items,
      sale.discount,
      sale.paymentMethod,
      sale.amountReceived,
      staffId
    );
  },

  getStockHistory: async (): Promise<StockAdjustment[]> => {
    const res = await fetch('/api/stock-adjustments', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch stock history');
    return res.json();
  },

  addStockAdjustment: async (adjustment: StockAdjustment, staffId: string = 'owner'): Promise<void> => {
    // Update stock in Google Sheets via updateStock POST
    await appsScriptService.updateStock(
      adjustment.productId,
      adjustment.quantity,
      adjustment.adjustmentType,
      adjustment.reason || 'Manual Adjustment',
      staffId
    );

    // Also update local stock history backend endpoint if available
    try {
      await fetch('/api/stock-adjustments', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(adjustment)
      });
    } catch (e) {
      console.warn("Could not save local stock history entry:", e);
    }
  }
};



