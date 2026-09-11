import React, { useState } from 'react';
import { Sale } from '../types';
import { useData } from '../contexts/DataContext';
import { Search, Filter, Printer, Eye, Calendar, RefreshCw } from 'lucide-react';
import { isToday, isYesterday, isThisWeek, isThisMonth, parseISO } from 'date-fns';

export const SalesHistory: React.FC = () => {
  const { sales, isSalesLoading, isRefreshing, error, getSale, refreshAll } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  const handleSelectSale = async (sale: Sale) => {
    setSelectedSale(sale);
    if (!sale.items || sale.items.length === 0) {
      setIsLoadingDetails(true);
      try {
        const fullSale = await getSale(sale.id);
        setSelectedSale(fullSale);
      } catch (e) {
        console.warn("Could not fetch full bill detail, using summary:", e);
      } finally {
        setIsLoadingDetails(false);
      }
    }
  };

  const handlePrint = async (sale: Sale) => {
    await handleSelectSale(sale);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPayment = paymentFilter === 'All' || sale.paymentMethod === paymentFilter;
    
    let matchesDate = true;
    const saleDate = parseISO(sale.date);
    
    if (dateFilter === 'Today') matchesDate = isToday(saleDate);
    if (dateFilter === 'Yesterday') matchesDate = isYesterday(saleDate);
    if (dateFilter === 'This Week') matchesDate = isThisWeek(saleDate);
    if (dateFilter === 'This Month') matchesDate = isThisMonth(saleDate);
    
    return matchesSearch && matchesPayment && matchesDate;
  });

  const totalAmount = filteredSales.reduce((sum, s) => sum + s.finalTotal, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sales History</h1>
          <p className="text-xs text-gray-500 mt-1">{sales.length} total sales loaded</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => refreshAll(true)}
            disabled={isRefreshing}
            className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 font-medium transition text-sm disabled:opacity-50"
            title="Refresh sales history"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-green-600' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <div className="text-right">
            <p className="text-xs text-gray-500">Filtered Total</p>
            <p className="text-xl font-bold text-green-700">₹{totalAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center no-print">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by Bill Number..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            <select 
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select 
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="All">All Payments</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                <th className="px-6 py-4 font-medium">Bill No.</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium text-center">Items</th>
                <th className="px-6 py-4 font-medium text-right">Total Amount</th>
                <th className="px-6 py-4 font-medium text-center">Payment</th>
                <th className="px-6 py-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-800">{sale.id}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-800">{sale.date}</div>
                    <div className="text-xs text-gray-500">{sale.time}</div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">{sale.totalItems}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-800">₹{sale.finalTotal}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${sale.paymentMethod === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 
                        sale.paymentMethod === 'UPI' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleSelectSale(sale)} className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition" title="View Details">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handlePrint(sale)} className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition" title="Print Receipt">
                        <Printer size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No sales found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">Bill Details</h2>
              <button onClick={() => setSelectedSale(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Bill No:</span>
                <span className="font-bold text-gray-800">{selectedSale.id}</span>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-gray-500">Date & Time:</span>
                <span>{selectedSale.date} {selectedSale.time}</span>
              </div>

              <table className="w-full text-left text-sm mb-4">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 font-medium text-center">Qty</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {selectedSale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 pr-2">{item.name} <br/><span className="text-xs text-gray-400">@ ₹{item.unitPrice}</span></td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right font-medium text-gray-800">₹{item.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="space-y-1 text-sm bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>₹{selectedSale.subtotal}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-₹{selectedSale.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-gray-200 text-gray-800">
                  <span>Total:</span>
                  <span>₹{selectedSale.finalTotal}</span>
                </div>
                <div className="flex justify-between text-gray-500 mt-2 text-xs">
                  <span>Payment: {selectedSale.paymentMethod}</span>
                  <span>Received: ₹{selectedSale.amountReceived}</span>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button onClick={() => handlePrint(selectedSale)} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 flex justify-center items-center gap-2">
                  <Printer size={18} /> Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden print styles for receipt */}
      {selectedSale && (
        <div className="hidden print:block print-section bg-white text-black">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">AJWA STORE</h2>
            <p className="text-gray-500 text-sm">123 Market Street, City</p>
            <p className="text-gray-500 text-sm">Ph: +91 98765 43210</p>
            <div className="border-b border-dashed border-gray-300 my-4"></div>
            
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Receipt No:</span>
              <span className="font-medium">{selectedSale.id}</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-gray-600">Date & Time:</span>
              <span>{selectedSale.date} {selectedSale.time}</span>
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
                {selectedSale.items.map((item, idx) => (
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
                <span>₹{selectedSale.subtotal}</span>
              </div>
              {selectedSale.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-₹{selectedSale.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span>₹{selectedSale.finalTotal}</span>
              </div>
            </div>
            
            <div className="border-b border-dashed border-gray-300 my-4"></div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span>{selectedSale.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Received:</span>
                <span>₹{selectedSale.amountReceived}</span>
              </div>
              <div className="flex justify-between">
                <span>Change:</span>
                <span>₹{selectedSale.change}</span>
              </div>
            </div>
            
            <div className="mt-8 text-center text-sm font-medium text-gray-800">
              Thank you for shopping with us!
            </div>
          </div>
        </div>
      )}
      
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
