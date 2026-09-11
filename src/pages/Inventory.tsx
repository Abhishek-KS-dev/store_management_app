import React, { useState } from 'react';
import { Product, StockAdjustment, AdjustmentType } from '../types';
import { useData } from '../contexts/DataContext';
import { Search, AlertTriangle, ArrowDownRight, ArrowUpRight, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

export const Inventory: React.FC = () => {
  const { user } = useAuth();
  const { 
    products, 
    isProductsLoading, 
    isRefreshing, 
    error, 
    addStockAdjustment, 
    refreshAll 
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('Stock Added');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');

  const activeProducts = products.filter(p => p.status === 'active');

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setAdjustmentType('Stock Added');
    setQuantity(0);
    setReason('');
    setIsModalOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date();
      const adjustment: StockAdjustment = {
        id: `ADJ${format(now, 'yyMMddHHmmss')}`,
        date: format(now, 'yyyy-MM-dd'),
        time: format(now, 'HH:mm:ss'),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        adjustmentType,
        quantity,
        reason
      };

      await addStockAdjustment(adjustment, user?.username || 'owner');
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Error updating stock: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = activeProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            {activeProducts.length} active inventory items loaded
          </p>
        </div>
        <button
          onClick={() => refreshAll(true)}
          disabled={isRefreshing}
          className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 font-medium transition text-sm disabled:opacity-50"
          title="Refresh latest data from Google Sheets"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-green-600' : ''} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search products by name or barcode..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex justify-between items-center text-sm">
          <span>{error}</span>
          <button onClick={() => refreshAll(true)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs font-medium">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                <th className="px-6 py-4 font-medium">Product Details</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium text-center">Current Stock</th>
                <th className="px-6 py-4 font-medium text-center">Min Stock</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                {user?.role === 'owner' && <th className="px-6 py-4 font-medium text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isProductsLoading && products.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === 'owner' ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-green-600 border-t-transparent mb-2"></div>
                    <div>Loading inventory from Google Sheets...</div>
                  </td>
                </tr>
              ) : filteredProducts.map((product) => {
                const isOutOfStock = product.stock === 0;
                const isLowStock = !isOutOfStock && product.stock <= product.minStock;
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-800">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.barcode}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-lg text-gray-800">{product.stock}</span>
                      <span className="text-xs text-gray-500 ml-1">{product.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">{product.minStock}</td>
                    <td className="px-6 py-4 text-center">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <AlertTriangle size={12} /> Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          <AlertTriangle size={12} /> Low Stock
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          In Stock
                        </span>
                      )}
                    </td>
                    {user?.role === 'owner' && (
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleOpenModal(product)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded transition"
                        >
                          Adjust
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={user?.role === 'owner' ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Adjust Stock</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSaveAdjustment} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Product</p>
                <p className="font-bold text-gray-800">{selectedProduct.name}</p>
                <p className="text-sm text-gray-600">Current Stock: <span className="font-bold">{selectedProduct.stock}</span> {selectedProduct.unit}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type *</label>
                <select 
                  value={adjustmentType} 
                  onChange={e => setAdjustmentType(e.target.value as AdjustmentType)} 
                  className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                >
                  <option value="Stock Added">Stock Added (Inward)</option>
                  <option value="Correction">Correction (Add)</option>
                  <option disabled>──────────</option>
                  <option value="Stock Removed">Stock Removed (Outward)</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    {['Stock Added', 'Correction'].includes(adjustmentType) ? (
                      <ArrowUpRight size={16} className="text-green-500" />
                    ) : (
                      <ArrowDownRight size={16} className="text-red-500" />
                    )}
                  </div>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    value={quantity || ''} 
                    onChange={e => setQuantity(Number(e.target.value))} 
                    className="w-full pl-10 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500" 
                    placeholder="Enter quantity"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Notes</label>
                <input 
                  type="text" 
                  value={reason} 
                  onChange={e => setReason(e.target.value)} 
                  className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500" 
                  placeholder="Optional note"
                />
              </div>
              
              <div className="pt-4 mt-6 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                  {isSaving && <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>}
                  {isSaving ? 'Updating Stock...' : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
