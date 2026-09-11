export type ProductStatus = 'active' | 'inactive';

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  supplier: string;
  status: ProductStatus;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Card';

export interface SaleItem {
  productId: string;
  barcode: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  date: string;
  time: string;
  totalItems: number;
  subtotal: number;
  discount: number;
  finalTotal: number;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  change: number;
  items: SaleItem[];
}

export type AdjustmentType = 'Stock Added' | 'Stock Removed' | 'Damaged' | 'Expired' | 'Correction';

export interface StockAdjustment {
  id: string;
  date: string;
  time: string;
  productId: string;
  productName: string;
  adjustmentType: AdjustmentType;
  quantity: number;
  reason: string;
}

export interface Category {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}
