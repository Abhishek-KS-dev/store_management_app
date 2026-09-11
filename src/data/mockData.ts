import { Category, Product, Sale, StockAdjustment } from '../types';

export const mockCategories: Category[] = [
  { id: 'C001', name: 'Grains & Pulses', status: 'active' },
  { id: 'C002', name: 'Spices & Condiments', status: 'active' },
  { id: 'C003', name: 'Dairy & Bakery', status: 'active' },
  { id: 'C004', name: 'Beverages', status: 'active' },
  { id: 'C005', name: 'Personal Care', status: 'active' },
  { id: 'C006', name: 'Home Care', status: 'active' },
];

export const mockProducts: Product[] = [
  { id: 'P001', barcode: '890123456701', name: 'India Gate Basmati Rice 5kg', category: 'Grains & Pulses', unit: 'pcs', purchasePrice: 450, sellingPrice: 520, stock: 45, minStock: 10, supplier: 'KRBL Ltd', status: 'active' },
  { id: 'P002', barcode: '890123456702', name: 'Aashirvaad Whole Wheat Atta 5kg', category: 'Grains & Pulses', unit: 'pcs', purchasePrice: 200, sellingPrice: 235, stock: 60, minStock: 15, supplier: 'ITC Ltd', status: 'active' },
  { id: 'P003', barcode: '890123456703', name: 'Madhur Pure & Hygienic Sugar 1kg', category: 'Grains & Pulses', unit: 'pcs', purchasePrice: 42, sellingPrice: 48, stock: 120, minStock: 20, supplier: 'Shree Renuka Sugars', status: 'active' },
  { id: 'P004', barcode: '890123456704', name: 'Tata Salt 1kg', category: 'Spices & Condiments', unit: 'pcs', purchasePrice: 20, sellingPrice: 24, stock: 150, minStock: 30, supplier: 'Tata Consumer', status: 'active' },
  { id: 'P005', barcode: '890123456705', name: 'Amul Taaza Toned Milk 1L', category: 'Dairy & Bakery', unit: 'pcs', purchasePrice: 62, sellingPrice: 68, stock: 25, minStock: 10, supplier: 'Amul', status: 'active' },
  { id: 'P006', barcode: '890123456706', name: 'Britannia Good Day Cashew 600g', category: 'Dairy & Bakery', unit: 'pcs', purchasePrice: 95, sellingPrice: 120, stock: 40, minStock: 15, supplier: 'Britannia', status: 'active' },
  { id: 'P007', barcode: '890123456707', name: 'Taj Mahal Tea 500g', category: 'Beverages', unit: 'pcs', purchasePrice: 280, sellingPrice: 330, stock: 35, minStock: 10, supplier: 'HUL', status: 'active' },
  { id: 'P008', barcode: '890123456708', name: 'Nescafe Classic Coffee 50g', category: 'Beverages', unit: 'pcs', purchasePrice: 130, sellingPrice: 150, stock: 50, minStock: 15, supplier: 'Nestle', status: 'active' },
  { id: 'P009', barcode: '890123456709', name: 'Fortune Sunlite Refined Sunflower Oil 1L', category: 'Grains & Pulses', unit: 'pcs', purchasePrice: 115, sellingPrice: 135, stock: 80, minStock: 20, supplier: 'Adani Wilmar', status: 'active' },
  { id: 'P010', barcode: '890123456710', name: 'Dove Cream Beauty Bathing Bar 3x100g', category: 'Personal Care', unit: 'pcs', purchasePrice: 135, sellingPrice: 160, stock: 65, minStock: 15, supplier: 'HUL', status: 'active' },
  { id: 'P011', barcode: '890123456711', name: 'Head & Shoulders Anti Dandruff Shampoo 650ml', category: 'Personal Care', unit: 'pcs', purchasePrice: 420, sellingPrice: 510, stock: 30, minStock: 10, supplier: 'P&G', status: 'active' },
  { id: 'P012', barcode: '890123456712', name: 'Colgate Strong Teeth Toothpaste 500g', category: 'Personal Care', unit: 'pcs', purchasePrice: 190, sellingPrice: 225, stock: 85, minStock: 20, supplier: 'Colgate-Palmolive', status: 'active' },
  { id: 'P013', barcode: '890123456713', name: 'Surf Excel Easy Wash Detergent Powder 1kg', category: 'Home Care', unit: 'pcs', purchasePrice: 105, sellingPrice: 124, stock: 110, minStock: 25, supplier: 'HUL', status: 'active' },
  { id: 'P014', barcode: '890123456714', name: 'Coca Cola 2.25L', category: 'Beverages', unit: 'pcs', purchasePrice: 75, sellingPrice: 90, stock: 5, minStock: 15, supplier: 'Coca Cola India', status: 'active' }, // Low stock example
  { id: 'P015', barcode: '890123456715', name: 'Everest Garam Masala 100g', category: 'Spices & Condiments', unit: 'pcs', purchasePrice: 60, sellingPrice: 72, stock: 0, minStock: 10, supplier: 'Everest', status: 'active' }, // Out of stock example
];

export const mockSales: Sale[] = [];
export const mockStockHistory: StockAdjustment[] = [];
