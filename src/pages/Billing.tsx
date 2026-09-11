import React, { useState } from 'react';
import { Product, Sale, SaleItem, PaymentMethod } from '../types';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, Minus, Trash2, Printer, CreditCard, Banknote, Smartphone, Receipt, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export const Billing: React.FC = () => {
  const { user } = useAuth();
  const { products, createSale } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountReceived, setAmountReceived] = useState<number | ''>('');
  
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const activeProducts = products.filter(p => p.status === 'active');

  const filteredProducts = searchTerm 
    ? activeProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.barcode.includes(searchTerm)
      )
    : [];

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert('Cannot add more than available stock!');
        return;
      }
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      if (product.stock <= 0) {
        alert('Product is out of stock!');
        return;
      }
      setCart([...cart, {
        productId: product.id,
        barcode: product.barcode,
        name: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice,
        subtotal: product.sellingPrice
      }]);
    }
    setSearchTerm('');
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return item; // Handled by remove
        if (newQuantity > product.stock) {
          alert('Cannot exceed available stock!');
          return item;
        }
        return { ...item, quantity: newQuantity, subtotal: newQuantity * item.unitPrice };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const finalTotal = Math.max(0, subtotal - discount);
  const change = typeof amountReceived === 'number' ? Math.max(0, amountReceived - finalTotal) : 0;

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }
    if (paymentMethod === 'Cash' && (amountReceived === '' || amountReceived < finalTotal)) {
      alert('Please enter a valid amount received for Cash payment.');
      return;
    }

    setIsCompleting(true);
    setError(null);

    const now = new Date();
    const newSalePayload: Sale = {
      id: `INV${format(now, 'yyMMddHHmmss')}`,
      date: format(now, 'yyyy-MM-dd'),
      time: format(now, 'HH:mm:ss'),
      totalItems: cart.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      discount,
      finalTotal,
      paymentMethod,
      amountReceived: typeof amountReceived === 'number' ? amountReceived : finalTotal,
      change,
      items: cart
    };

    try {
      const createdSale = await createSale(
        cart,
        discount,
        paymentMethod,
        typeof amountReceived === 'number' ? amountReceived : finalTotal,
        user?.username || 'owner'
      );
      
      // Ensure all fields are properly mapped for receipt
      const saleForReceipt: Sale = {
        ...newSalePayload,
        ...createdSale,
        id: createdSale.id || newSalePayload.id,
        items: (createdSale.items && createdSale.items.length > 0) ? createdSale.items : cart
      };

      setLastSale(saleForReceipt);
      setShowReceipt(true);
      
      // Reset form on success only
      setCart([]);
      setDiscount(0);
      setSearchTerm('');
      setAmountReceived('');
      setPaymentMethod('Cash');
    } catch (err: any) {
      console.error("Sale completion failed:", err);
      setError(err.message || 'Failed to complete sale on Google Sheets backend.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (showReceipt && lastSale) {
    return (
      <div className="max-w-md mx-auto bg-white text-black p-8 rounded-xl shadow-sm border border-gray-100 print-section">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">AJWA STORE</h2>
          <p className="text-gray-500 text-sm">123 Market Street, City</p>
          <p className="text-gray-500 text-sm">Ph: +91 98765 43210</p>
          <div className="border-b border-dashed border-gray-300 my-4"></div>
          
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Receipt No:</span>
            <span className="font-medium">{lastSale.id}</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="text-gray-600">Date & Time:</span>
            <span>{lastSale.date} {lastSale.time}</span>
          </div>
          
          <div className="border-b border-dashed border-gray-300 my-4"></div>
          
          <table className="w-full text-left text-sm mb-4">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 font-medium text-center">Qty</th>
                <th className="pb-2 font-medium text-right">Price</th>
                <th className="pb-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {lastSale.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2 pr-2">{item.name}</td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">₹{item.unitPrice}</td>
                  <td className="py-2 text-right font-medium">₹{item.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-b border-dashed border-gray-300 my-4"></div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>₹{lastSale.subtotal}</span>
            </div>
            {lastSale.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-₹{lastSale.discount}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-gray-200">
              <span>Total:</span>
              <span>₹{lastSale.finalTotal}</span>
            </div>
          </div>
          
          <div className="border-b border-dashed border-gray-300 my-4"></div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Payment Method:</span>
              <span>{lastSale.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount Received:</span>
              <span>₹{lastSale.amountReceived}</span>
            </div>
            <div className="flex justify-between">
              <span>Change:</span>
              <span>₹{lastSale.change}</span>
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm font-medium text-gray-800">
            Thank you for shopping with us!
          </div>
        </div>

        <div className="flex gap-4 mt-8 no-print">
          <button 
            onClick={handlePrint}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 flex justify-center items-center gap-2"
          >
            <Printer size={18} /> Print
          </button>
          <button 
            onClick={() => setShowReceipt(false)}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
          >
            New Sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)]">
      {/* Products & Search Section */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products by name or barcode..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {searchTerm ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map(product => (
                <div 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`bg-white p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-green-500 hover:shadow-md transition flex flex-col justify-between h-32
                    ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div>
                    <h3 className="font-medium text-gray-800 text-sm line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{product.barcode}</p>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <span className="font-bold text-green-700">₹{product.sellingPrice}</span>
                    <span className={`text-xs ${product.stock <= product.minStock ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                      Stock: {product.stock}
                    </span>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No products found.
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <Search size={48} className="text-gray-300" />
              <p>Type to search and add products</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart & Checkout Section */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-green-50 border-b border-green-100 flex justify-between items-center">
          <h2 className="font-bold text-green-800 text-lg">Current Bill</h2>
          <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
            {cart.length} Items
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              Cart is empty
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex flex-col border-b border-gray-100 pb-3 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm text-gray-800 pr-2">{item.name}</span>
                  <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">₹{item.unitPrice}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-gray-100 rounded-lg">
                      <button 
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="p-1 text-gray-600 hover:text-green-600 disabled:opacity-50"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="p-1 text-gray-600 hover:text-green-600"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="font-bold text-gray-800 w-16 text-right">₹{item.subtotal}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Discount (₹)</span>
              <input 
                type="number" 
                min="0"
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="w-20 text-right p-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>₹{finalTotal}</span>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-sm text-gray-600 mb-2">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setPaymentMethod('Cash')}
                className={`flex items-center justify-center gap-1 py-2 rounded border text-sm font-medium transition
                  ${paymentMethod === 'Cash' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                <Banknote size={16} /> Cash
              </button>
              <button 
                onClick={() => setPaymentMethod('UPI')}
                className={`flex items-center justify-center gap-1 py-2 rounded border text-sm font-medium transition
                  ${paymentMethod === 'UPI' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                <Smartphone size={16} /> UPI
              </button>
              <button 
                onClick={() => setPaymentMethod('Card')}
                className={`flex items-center justify-center gap-1 py-2 rounded border text-sm font-medium transition
                  ${paymentMethod === 'Card' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                <CreditCard size={16} /> Card
              </button>
            </div>
          </div>

          {paymentMethod === 'Cash' && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Amount Received</span>
                <input 
                  type="number" 
                  min={finalTotal}
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value ? Number(e.target.value) : '')}
                  className="w-24 text-right p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 text-lg font-medium"
                  placeholder="₹"
                />
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-600">
                <span>Change</span>
                <span className={change > 0 ? 'text-green-600' : ''}>₹{change}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle size={14} className="text-red-600 shrink-0" />
                <span>Backend Error:</span>
              </div>
              <p className="pl-5 leading-tight">{error}</p>
              <div className="pt-1 flex justify-end">
                <button 
                  onClick={handleCompleteSale} 
                  disabled={isCompleting}
                  className="px-2.5 py-1 bg-red-600 text-white rounded hover:bg-red-700 font-medium text-xs flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw size={12} className={isCompleting ? 'animate-spin' : ''} />
                  <span>Retry Sale</span>
                </button>
              </div>
            </div>
          )}

          <button 
            onClick={handleCompleteSale}
            disabled={isCompleting || cart.length === 0}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 transition flex justify-center items-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCompleting ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Processing Sale...</span>
              </>
            ) : (
              <>
                <Receipt size={20} /> Complete Sale
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Hidden print styles */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-section, .print-section * {
              visibility: visible;
            }
            .print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
              display: block !important;
              background: white;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
};
