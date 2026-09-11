import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Product, Category, Sale, StockAdjustment, PaymentMethod } from '../types';
import { appsScriptService, DashboardSummary } from '../services/appsScriptService';
import { useAuth } from './AuthContext';

interface DataContextType {
  products: Product[];
  categories: Category[];
  sales: Sale[];
  dashboardSummary: DashboardSummary | null;
  
  isProductsLoading: boolean;
  isCategoriesLoading: boolean;
  isSalesLoading: boolean;
  isDashboardLoading: boolean;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  
  error: string | null;
  
  fetchProducts: (force?: boolean) => Promise<Product[]>;
  fetchCategories: (force?: boolean) => Promise<Category[]>;
  fetchSales: (force?: boolean) => Promise<Sale[]>;
  fetchDashboardData: (force?: boolean) => Promise<DashboardSummary>;
  refreshAll: (force?: boolean) => Promise<void>;
  
  saveProduct: (product: Product, staffId?: string) => Promise<Product>;
  deleteProduct: (id: string, staffId?: string) => Promise<void>;
  addStockAdjustment: (adjustment: StockAdjustment, staffId?: string) => Promise<void>;
  createSale: (cartItems: any[], discount: number, paymentMethod: PaymentMethod, amountReceived: number, staffId?: string) => Promise<Sale>;
  getSale: (billId: string) => Promise<Sale>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Pending promise references for deduplicating concurrent requests
let pendingProductsPromise: Promise<Product[]> | null = null;
let pendingCategoriesPromise: Promise<Category[]> | null = null;
let pendingSalesPromise: Promise<Sale[]> | null = null;
let pendingDashboardPromise: Promise<DashboardSummary> | null = null;

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);

  const [productsLoaded, setProductsLoaded] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [salesLoaded, setSalesLoaded] = useState(false);
  const [dashboardLoaded, setDashboardLoaded] = useState(false);

  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [isSalesLoading, setIsSalesLoading] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Helper to calculate or update dashboard summary from current state
  const recalculateDashboardSummary = useCallback((updatedProducts: Product[], updatedSales: Sale[]) => {
    const activeProds = updatedProducts.filter(p => p.status === 'active');
    const lowStock = activeProds.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
    const outOfStock = activeProds.filter(p => p.stock === 0).length;

    // Today's sales
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySalesList = updatedSales.filter(s => s.date === todayStr);
    const todayTotal = todaySalesList.reduce((acc, s) => acc + s.finalTotal, 0);

    setDashboardSummary(prev => ({
      todaySales: todayTotal,
      todayBills: todaySalesList.length,
      totalProducts: activeProds.length,
      lowStockProducts: lowStock,
      outOfStockProducts: outOfStock,
      ...(prev || {})
    }));
  }, []);

  const fetchProducts = useCallback(async (force: boolean = false): Promise<Product[]> => {
    if (productsLoaded && !force && !pendingProductsPromise) {
      return products;
    }

    if (pendingProductsPromise) {
      return pendingProductsPromise;
    }

    if (!productsLoaded) {
      setIsProductsLoading(true);
    }

    pendingProductsPromise = (async () => {
      try {
        const data = await appsScriptService.getProducts();
        setProducts(data);
        setProductsLoaded(true);
        setError(null);
        return data;
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to fetch products');
        throw err;
      } finally {
        setIsProductsLoading(false);
        pendingProductsPromise = null;
      }
    })();

    return pendingProductsPromise;
  }, [productsLoaded, products]);

  const fetchCategories = useCallback(async (force: boolean = false): Promise<Category[]> => {
    if (categoriesLoaded && !force && !pendingCategoriesPromise) {
      return categories;
    }

    if (pendingCategoriesPromise) {
      return pendingCategoriesPromise;
    }

    if (!categoriesLoaded) {
      setIsCategoriesLoading(true);
    }

    pendingCategoriesPromise = (async () => {
      try {
        const data = await appsScriptService.getCategories();
        setCategories(data);
        setCategoriesLoaded(true);
        return data;
      } catch (err: any) {
        console.warn('Error fetching categories:', err);
        return categories;
      } finally {
        setIsCategoriesLoading(false);
        pendingCategoriesPromise = null;
      }
    })();

    return pendingCategoriesPromise;
  }, [categoriesLoaded, categories]);

  const fetchSales = useCallback(async (force: boolean = false): Promise<Sale[]> => {
    if (salesLoaded && !force && !pendingSalesPromise) {
      return sales;
    }

    if (pendingSalesPromise) {
      return pendingSalesPromise;
    }

    if (!salesLoaded) {
      setIsSalesLoading(true);
    }

    pendingSalesPromise = (async () => {
      try {
        const data = await appsScriptService.getSales();
        setSales(data);
        setSalesLoaded(true);
        return data;
      } catch (err: any) {
        console.error('Error fetching sales:', err);
        setError(err.message || 'Failed to fetch sales');
        throw err;
      } finally {
        setIsSalesLoading(false);
        pendingSalesPromise = null;
      }
    })();

    return pendingSalesPromise;
  }, [salesLoaded, sales]);

  const fetchDashboardData = useCallback(async (force: boolean = false): Promise<DashboardSummary> => {
    if (dashboardLoaded && !force && !pendingDashboardPromise && dashboardSummary) {
      return dashboardSummary;
    }

    if (pendingDashboardPromise) {
      return pendingDashboardPromise;
    }

    if (!dashboardLoaded) {
      setIsDashboardLoading(true);
    }

    pendingDashboardPromise = (async () => {
      try {
        const data = await appsScriptService.getDashboardData();
        setDashboardSummary(data);
        setDashboardLoaded(true);
        return data;
      } catch (err: any) {
        console.warn('Error fetching dashboard summary:', err);
        // Fallback calculations if dashboard endpoint fails
        if (products.length > 0 || sales.length > 0) {
          recalculateDashboardSummary(products, sales);
        }
        throw err;
      } finally {
        setIsDashboardLoading(false);
        pendingDashboardPromise = null;
      }
    })();

    return pendingDashboardPromise;
  }, [dashboardLoaded, dashboardSummary, products, sales, recalculateDashboardSummary]);

  const refreshAll = useCallback(async (force: boolean = true): Promise<void> => {
    setIsRefreshing(true);
    setError(null);
    try {
      await Promise.allSettled([
        fetchProducts(force),
        fetchCategories(force),
        fetchSales(force),
        fetchDashboardData(force)
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchProducts, fetchCategories, fetchSales, fetchDashboardData]);

  // Initial load on login / app boot
  useEffect(() => {
    if (user && !productsLoaded && !salesLoaded) {
      setIsInitialLoading(true);
      refreshAll(false).finally(() => {
        setIsInitialLoading(false);
      });
    }
  }, [user, productsLoaded, salesLoaded, refreshAll]);

  // Mutation: Save Product
  const saveProduct = async (product: Product, staffId: string = user?.username || 'owner'): Promise<Product> => {
    let saved: Product;
    if (product.id && !product.id.startsWith('NEW_')) {
      saved = await appsScriptService.updateProduct(product, staffId);
      setProducts(prev => prev.map(p => p.id === saved.id ? saved : p));
    } else {
      saved = await appsScriptService.addProduct(product, staffId);
      setProducts(prev => [saved, ...prev]);
    }

    // Refresh products in background or update state
    setProductsLoaded(true);
    // Invalidate dashboard summary
    fetchDashboardData(true).catch(() => {});
    return saved;
  };

  // Mutation: Delete/Deactivate Product
  const deleteProduct = async (id: string, staffId: string = user?.username || 'owner'): Promise<void> => {
    await appsScriptService.deactivateProduct(id, staffId);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'inactive' } : p));
    fetchDashboardData(true).catch(() => {});
  };

  // Mutation: Add Stock Adjustment
  const addStockAdjustment = async (adjustment: StockAdjustment, staffId: string = user?.username || 'owner'): Promise<void> => {
    await appsScriptService.updateStock(
      adjustment.productId,
      adjustment.quantity,
      adjustment.adjustmentType,
      adjustment.reason || 'Manual Adjustment',
      staffId
    );

    // Update local products stock
    setProducts(prev => prev.map(p => {
      if (p.id !== adjustment.productId) return p;
      let newStock = p.stock;
      if (adjustment.adjustmentType === 'Stock Added') {
        newStock += adjustment.quantity;
      } else if (adjustment.adjustmentType === 'Stock Removed' || adjustment.adjustmentType === 'Damaged' || adjustment.adjustmentType === 'Expired') {
        newStock = Math.max(0, newStock - adjustment.quantity);
      }
      return { ...p, stock: newStock };
    }));

    fetchDashboardData(true).catch(() => {});
  };

  // Mutation: Create Sale (Complete Sale)
  const createSale = async (
    cartItems: any[],
    discount: number,
    paymentMethod: PaymentMethod,
    amountReceived: number,
    staffId: string = user?.username || 'owner'
  ): Promise<Sale> => {
    const createdSale = await appsScriptService.createSale(cartItems, discount, paymentMethod, amountReceived, staffId);

    // Update sales state
    setSales(prev => [createdSale, ...prev]);

    // Update stock for sold products in shared state
    setProducts(prev => prev.map(prod => {
      const soldItem = cartItems.find(item => item.productId === prod.id || item.Product_ID === prod.id);
      if (!soldItem) return prod;
      const soldQty = Number(soldItem.quantity || soldItem.Quantity || 0);
      return {
        ...prod,
        stock: Math.max(0, prod.stock - soldQty)
      };
    }));

    // Update dashboard summary
    setDashboardSummary(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        todaySales: prev.todaySales + createdSale.finalTotal,
        todayBills: prev.todayBills + 1
      };
    });

    // Fire background fetch to ensure full sync
    fetchProducts(true).catch(() => {});
    fetchDashboardData(true).catch(() => {});

    return createdSale;
  };

  const getSale = async (billId: string): Promise<Sale> => {
    // Check if sale exists in local cache first with items
    const cached = sales.find(s => s.id === billId);
    if (cached && cached.items && cached.items.length > 0) {
      return cached;
    }
    const fresh = await appsScriptService.getSale(billId);
    setSales(prev => prev.map(s => s.id === fresh.id ? fresh : s));
    return fresh;
  };

  return (
    <DataContext.Provider
      value={{
        products,
        categories,
        sales,
        dashboardSummary,
        isProductsLoading,
        isCategoriesLoading,
        isSalesLoading,
        isDashboardLoading,
        isInitialLoading,
        isRefreshing,
        error,
        fetchProducts,
        fetchCategories,
        fetchSales,
        fetchDashboardData,
        refreshAll,
        saveProduct,
        deleteProduct,
        addStockAdjustment,
        createSale,
        getSale
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
