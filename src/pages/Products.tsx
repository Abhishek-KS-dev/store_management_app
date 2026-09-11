import React, { useState } from 'react';
import { Product } from '../types';
import { useData } from '../contexts/DataContext';
import { Search, Plus, Edit, Trash2, Filter, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Products: React.FC = () => {
  const { user } = useAuth();
  const { 
    products, 
    categories, 
    isProductsLoading, 
    isRefreshing, 
    error, 
    saveProduct, 
    deleteProduct, 
    refreshAll 
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', barcode: '', category: '', unit: 'pcs', purchasePrice: 0, sellingPrice: 0, stock: 0, minStock: 10, supplier: '', status: 'active'
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    let matchesStock = true;
    if (stockFilter === 'Low Stock') matchesStock = p.stock > 0 && p.stock <= p.minStock;
    if (stockFilter === 'Out of Stock') matchesStock = p.stock === 0;
    
    return matchesSearch && matchesCat && matchesStock;
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '', barcode: '', category: categories[0]?.name || '', unit: 'pcs', purchasePrice: 0, sellingPrice: 0, stock: 0, minStock: 10, supplier: '', status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.barcode || formData.purchasePrice === undefined || formData.sellingPrice === undefined) {
      alert("Please fill all required fields.");
      return;
    }

    setIsSaving(true);
    try {
      const productToSave: Product = {
        ...(formData as Product),
        id: editingProduct ? editingProduct.id : `NEW_${Date.now()}`
      };

      await saveProduct(productToSave, user?.username || 'owner');
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Error saving product: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to deactivate this product?")) {
      try {
        await deleteProduct(id, user?.username || 'owner');
      } catch (err: any) {
        alert(`Error deactivating product: ${err.message || 'Unknown error'}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            {products.length} products loaded from Google Sheets backend
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshAll(true)}
            disabled={isRefreshing}
            className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 font-medium transition text-sm disabled:opacity-50"
            title="Refresh latest data from Google Sheets"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-green-600' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          {user?.role === 'owner' && (
            <button 
              onClick={() => handleOpenModal()}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition text-sm"
            >
              <Plus size={18} /> Add Product
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or barcode..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select 
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <select 
            className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="All">All Stock Status</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
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
                <th className="px-6 py-4 font-medium">Barcode / ID</th>
                <th className="px-6 py-4 font-medium">Product Name</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium text-right">Price</th>
                <th className="px-6 py-4 font-medium text-center">Stock</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                {user?.role === 'owner' && <th className="px-6 py-4 font-medium text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isProductsLoading && products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-green-600 border-t-transparent mb-2"></div>
                    <div>Loading products from Google Sheets...</div>
                  </td>
                </tr>
              ) : filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-800">{product.barcode}</div>
                    <div className="text-xs text-gray-500">{product.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-800">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.supplier}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-bold text-gray-800">₹{product.sellingPrice}</div>
                    <div className="text-xs text-gray-500">Buy: ₹{product.purchasePrice}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      product.stock === 0 ? 'bg-red-100 text-red-700' : 
                      product.stock <= product.minStock ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {product.stock} {product.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${product.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}>
                      {product.status}
                    </span>
                  </td>
                  {user?.role === 'owner' && (
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleOpenModal(product)} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition">
                          <Edit size={16} />
                        </button>
                        {product.status === 'active' && (
                          <button onClick={() => handleDelete(product.id)} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No products found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <Trash2 size={24} className="hidden" /> {/* Placeholder for close icon space if needed, using custom close */}
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode *</label>
                  <input required type="text" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500">
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500">
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="L">L</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (₹) *</label>
                  <input required type="number" min="0" step="0.01" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: Number(e.target.value)})} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹) *</label>
                  <input required type="number" min="0" step="0.01" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                  <input type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} disabled={!!editingProduct} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 disabled:bg-gray-100" />
                  {editingProduct && <p className="text-xs text-gray-500 mt-1">Use Inventory tab to adjust stock.</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Alert</label>
                  <input type="number" min="0" value={formData.minStock} onChange={e => setFormData({...formData, minStock: Number(e.target.value)})} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input type="text" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500" />
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                  {isSaving && <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>}
                  {isSaving ? 'Saving to Google Sheets...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
