import { API_CONFIG } from '../config/apiConfig';
import { Product, Category, ProductStatus, Sale, SaleItem, PaymentMethod } from '../types';

export const APPS_SCRIPT_URL = API_CONFIG.APPS_SCRIPT_URL;

export interface AppsScriptProduct {
  Product_ID?: string;
  Barcode?: string | number;
  Product_Name?: string;
  Category?: string;
  Unit?: string;
  Purchase_Price?: number | string;
  Selling_Price?: number | string;
  Current_Stock?: number | string;
  Minimum_Stock?: number | string;
  Supplier?: string;
  Status?: string;
}

export function mapAppsScriptToProduct(item: AppsScriptProduct): Product {
  const statusStr = String(item.Status || 'Active').toLowerCase();
  return {
    id: String(item.Product_ID || ''),
    barcode: String(item.Barcode || ''),
    name: String(item.Product_Name || ''),
    category: String(item.Category || ''),
    unit: String(item.Unit || 'pcs'),
    purchasePrice: Number(item.Purchase_Price || 0),
    sellingPrice: Number(item.Selling_Price || 0),
    stock: Number(item.Current_Stock || 0),
    minStock: Number(item.Minimum_Stock || 0),
    supplier: String(item.Supplier || ''),
    status: (statusStr === 'inactive' ? 'inactive' : 'active') as ProductStatus,
  };
}

export function mapAppsScriptToSale(item: any): Sale {
  const itemsList = Array.isArray(item.items) ? item.items.map((i: any) => ({
    productId: String(i.Product_ID || i.productId || i.id || ''),
    barcode: String(i.Barcode || i.barcode || ''),
    name: String(i.Product_Name || i.name || i.productName || ''),
    quantity: Number(i.Quantity || i.quantity || 0),
    unitPrice: Number(i.Unit_Price || i.unitPrice || i.price || 0),
    subtotal: Number(i.Subtotal || i.subtotal || 0)
  })) : [];

  return {
    id: String(item.Bill_ID || item.id || item.Bill_No || item.BillNo || ''),
    date: String(item.Date || item.date || ''),
    time: String(item.Time || item.time || ''),
    totalItems: Number(item.Total_Items || item.totalItems || itemsList.reduce((acc: number, cur: any) => acc + cur.quantity, 0)),
    subtotal: Number(item.Subtotal || item.subtotal || 0),
    discount: Number(item.Discount || item.discount || 0),
    finalTotal: Number(item.Final_Total || item.finalTotal || item.total || 0),
    paymentMethod: (item.Payment_Method || item.paymentMethod || 'Cash') as PaymentMethod,
    amountReceived: Number(item.Amount_Received || item.amountReceived || 0),
    change: Number(item.Change || item.change || 0),
    items: itemsList
  };
}

async function postToAppsScript(payload: any): Promise<any> {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || result.message || 'Operation failed on Apps Script backend');
  }

  return result;
}

export interface DashboardSummary {
  todaySales: number;
  todayBills: number;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export const appsScriptService = {
  getProducts: async (): Promise<Product[]> => {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=products`);
    if (!res.ok) throw new Error('Failed to fetch products from Google Sheets');
    const result = await res.json();
    if (!result.success || !Array.isArray(result.data)) {
      throw new Error(result.error || 'Invalid products response from Google Sheets');
    }
    return result.data.map(mapAppsScriptToProduct);
  },

  addProduct: async (product: Partial<Product>, staffId: string = 'owner'): Promise<Product> => {
    const payload = {
      action: 'addProduct',
      data: {
        Product_Name: product.name || '',
        Barcode: product.barcode || '',
        Category: product.category || '',
        Unit: product.unit || 'pcs',
        Purchase_Price: Number(product.purchasePrice || 0),
        Selling_Price: Number(product.sellingPrice || 0),
        Current_Stock: Number(product.stock || 0),
        Minimum_Stock: Number(product.minStock || 0),
        Supplier: product.supplier || '',
        Staff_ID: staffId
      }
    };

    const result = await postToAppsScript(payload);
    return mapAppsScriptToProduct(result.data || {});
  },

  updateProduct: async (product: Product, staffId: string = 'owner'): Promise<Product> => {
    const payload = {
      action: 'updateProduct',
      data: {
        Product_ID: product.id,
        Product_Name: product.name,
        Barcode: product.barcode,
        Category: product.category,
        Unit: product.unit,
        Purchase_Price: Number(product.purchasePrice),
        Selling_Price: Number(product.sellingPrice),
        Current_Stock: Number(product.stock),
        Minimum_Stock: Number(product.minStock),
        Supplier: product.supplier,
        Status: product.status === 'inactive' ? 'Inactive' : 'Active',
        Staff_ID: staffId
      }
    };

    const result = await postToAppsScript(payload);
    return mapAppsScriptToProduct(result.data || product);
  },

  deactivateProduct: async (productId: string, staffId: string = 'owner'): Promise<void> => {
    const payload = {
      action: 'deactivateProduct',
      data: {
        Product_ID: productId,
        Staff_ID: staffId
      }
    };

    await postToAppsScript(payload);
  },

  updateStock: async (productId: string, quantity: number, adjustmentType: string, reason: string, staffId: string = 'owner'): Promise<void> => {
    const payload = {
      action: 'updateStock',
      data: {
        Product_ID: productId,
        Quantity: Number(quantity),
        Adjustment_Type: adjustmentType,
        Reason: reason,
        Staff_ID: staffId
      }
    };

    await postToAppsScript(payload);
  },

  createSale: async (cartItems: SaleItem[], discount: number, paymentMethod: PaymentMethod, amountReceived: number, staffId: string = 'owner'): Promise<Sale> => {
    const items = cartItems.map(item => ({
      Product_ID: item.productId,
      productId: item.productId,
      Barcode: item.barcode,
      barcode: item.barcode,
      Product_Name: item.name,
      name: item.name,
      Quantity: Number(item.quantity),
      quantity: Number(item.quantity),
      Unit_Price: Number(item.unitPrice),
      unitPrice: Number(item.unitPrice),
      Subtotal: Number(item.subtotal),
      subtotal: Number(item.subtotal)
    }));

    const payload = {
      action: 'createSale',
      data: {
        items,
        Discount: Number(discount || 0),
        discount: Number(discount || 0),
        Payment_Method: paymentMethod,
        paymentMethod: paymentMethod,
        Amount_Received: Number(amountReceived || 0),
        amountReceived: Number(amountReceived || 0),
        Staff_ID: staffId,
        staffId: staffId
      }
    };

    const result = await postToAppsScript(payload);
    const saleData = result.data || {};
    
    // Ensure items exist in returned sale data if backend didn't echo them
    if (!saleData.items || !Array.isArray(saleData.items) || saleData.items.length === 0) {
      saleData.items = cartItems;
    }

    return mapAppsScriptToSale(saleData);
  },

  getSales: async (): Promise<Sale[]> => {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=sales`);
    if (!res.ok) throw new Error('Failed to fetch sales history from Google Sheets');
    const result = await res.json();
    if (!result.success || !Array.isArray(result.data)) {
      throw new Error(result.error || 'Invalid sales response from Google Sheets');
    }
    return result.data.map(mapAppsScriptToSale);
  },

  getSale: async (billId: string): Promise<Sale> => {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=sale&billId=${encodeURIComponent(billId)}`);
    if (!res.ok) throw new Error(`Failed to fetch bill ${billId} from Google Sheets`);
    const result = await res.json();
    if (!result.success || !result.data) {
      throw new Error(result.error || `Bill ${billId} not found`);
    }
    return mapAppsScriptToSale(result.data);
  },

  getDashboardData: async (): Promise<DashboardSummary> => {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=dashboard`);
    if (!res.ok) throw new Error('Failed to fetch dashboard data from Google Sheets');
    const result = await res.json();
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Invalid dashboard response from Google Sheets');
    }
    return {
      todaySales: Number(result.data.todaySales || 0),
      todayBills: Number(result.data.todayBills || 0),
      totalProducts: Number(result.data.totalProducts || 0),
      lowStockProducts: Number(result.data.lowStockProducts || 0),
      outOfStockProducts: Number(result.data.outOfStockProducts || 0)
    };
  },

  getCategories: async (): Promise<Category[]> => {
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=categories`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          return result.data.map((item: any, index: number) => ({
            id: String(item.Category_ID || item.id || `C${index + 1}`),
            name: String(item.Category_Name || item.name || item),
            status: 'active' as const
          }));
        }
      }
    } catch (e) {
      console.warn("Could not fetch categories from Google Sheets, using defaults:", e);
    }

    return [
      { id: '1', name: 'Fruits & Vegetables', status: 'active' },
      { id: '2', name: 'Dairy & Bakery', status: 'active' },
      { id: '3', name: 'Snacks & Beverages', status: 'active' },
      { id: '4', name: 'Staples & Grocery', status: 'active' },
      { id: '5', name: 'Personal Care', status: 'active' },
      { id: '6', name: 'Household', status: 'active' }
    ];
  }
};

