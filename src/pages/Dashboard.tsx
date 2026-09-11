import React from 'react';
import { useData } from '../contexts/DataContext';
import { IndianRupee, Receipt, Package, AlertTriangle, TrendingUp, XCircle, Boxes, BarChart3, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, isToday } from 'date-fns';

export const Dashboard: React.FC = () => {
  const { products, sales, dashboardSummary, isInitialLoading, isRefreshing, refreshAll } = useData();

  const todaySales = sales.filter(s => {
    if (!s.date) return false;
    try {
      const saleDate = new Date(s.date);
      return isToday(saleDate);
    } catch (e) {
      return false;
    }
  });

  const totalSalesAmount = dashboardSummary?.todaySales !== undefined ? dashboardSummary.todaySales : todaySales.reduce((acc, sale) => acc + sale.finalTotal, 0);
  const totalBills = dashboardSummary?.todayBills !== undefined ? dashboardSummary.todayBills : todaySales.length;
  
  const estimatedProfit = todaySales.reduce((acc, sale) => {
    const profitForSale = (sale.items || []).reduce((itemAcc, item) => {
      const product = products.find(p => p.id === item.productId);
      const purchasePrice = product ? product.purchasePrice : (item.unitPrice * 0.85); // fallback
      return itemAcc + ((item.unitPrice - purchasePrice) * item.quantity);
    }, 0);
    return acc + profitForSale;
  }, 0);

  const activeProducts = products.filter(p => p.status === 'active');
  const lowStockItems = activeProducts.filter(p => p.stock > 0 && p.stock <= p.minStock);
  const outOfStockItems = activeProducts.filter(p => p.stock === 0);

  const totalProducts = dashboardSummary?.totalProducts !== undefined ? dashboardSummary.totalProducts : activeProducts.length;
  const lowStockProductsCount = dashboardSummary?.lowStockProducts !== undefined ? dashboardSummary.lowStockProducts : lowStockItems.length;
  const outOfStockProductsCount = dashboardSummary?.outOfStockProducts !== undefined ? dashboardSummary.outOfStockProducts : outOfStockItems.length;

  const StatCard = ({ title, value, icon, bgColor, textColor }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      </div>
      <div className={`p-4 rounded-full ${bgColor} ${textColor}`}>
        {icon}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <div className="text-xs text-gray-500 mt-1">
            {format(new Date(), 'EEEE, MMMM do yyyy')}
          </div>
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
      
      {outOfStockItems.length > 0 && (
        <div className="space-y-2">
          {outOfStockItems.map(item => (
            <div key={item.id} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex items-center justify-between">
              <div className="flex items-center">
                <XCircle className="text-red-500 mr-3" size={24} />
                <div>
                  <h3 className="text-red-800 font-bold">Out of Stock Alert: {item.name}</h3>
                  <p className="text-red-600 text-sm">
                    This product is currently out of stock.
                  </p>
                </div>
              </div>
              <Link to="/inventory" className="text-red-700 font-medium hover:text-red-900 text-sm bg-red-100 px-4 py-2 rounded-lg transition">
                Update Stock
              </Link>
            </div>
          ))}
        </div>
      )}

      {lowStockItems.length > 0 && (
        <div className="space-y-2">
          {lowStockItems.map(item => (
            <div key={item.id} className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg shadow-sm flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="text-orange-500 mr-3" size={24} />
                <div>
                  <h3 className="text-orange-800 font-bold">Low Stock Alert: {item.name}</h3>
                  <p className="text-orange-600 text-sm">
                    Current stock is <span className="font-bold">{item.stock} {item.unit}</span>. Minimum required is <span className="font-bold">{item.minStock} {item.unit}</span>.
                  </p>
                </div>
              </div>
              <Link to="/inventory" className="text-orange-700 font-medium hover:text-orange-900 text-sm bg-orange-100 px-4 py-2 rounded-lg transition">
                Update Stock
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard 
          title="Today's Sales" 
          value={`₹${totalSalesAmount.toLocaleString()}`}
          icon={<IndianRupee size={24} />}
          bgColor="bg-green-50"
          textColor="text-green-600"
        />
        <StatCard 
          title="Bills Generated" 
          value={totalBills}
          icon={<Receipt size={24} />}
          bgColor="bg-blue-50"
          textColor="text-blue-600"
        />
        <StatCard 
          title="Estimated Profit" 
          value={`₹${estimatedProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}`}
          icon={<TrendingUp size={24} />}
          bgColor="bg-emerald-50"
          textColor="text-emerald-600"
        />
        <StatCard 
          title="Total Products" 
          value={totalProducts}
          icon={<Package size={24} />}
          bgColor="bg-purple-50"
          textColor="text-purple-600"
        />
        <StatCard 
          title="Low Stock Items" 
          value={lowStockProductsCount}
          icon={<AlertTriangle size={24} />}
          bgColor="bg-orange-50"
          textColor="text-orange-600"
        />
        <StatCard 
          title="Out of Stock" 
          value={outOfStockProductsCount}
          icon={<XCircle size={24} />}
          bgColor="bg-red-50"
          textColor="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">Recent Sales</h2>
            <Link to="/sales" className="text-sm text-green-600 hover:text-green-700 font-medium">View All</Link>
          </div>
          {todaySales.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-sm text-gray-500">
                    <th className="pb-3 font-medium">Bill No.</th>
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Items</th>
                    <th className="pb-3 font-medium">Total</th>
                    <th className="pb-3 font-medium">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {todaySales.slice().reverse().slice(0, 5).map((sale) => (
                    <tr key={sale.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="py-3 text-sm text-gray-800 font-medium">{sale.id}</td>
                      <td className="py-3 text-sm text-gray-600">{sale.time}</td>
                      <td className="py-3 text-sm text-gray-600">{sale.totalItems}</td>
                      <td className="py-3 text-sm font-semibold text-gray-800">₹{sale.finalTotal}</td>
                      <td className="py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                          ${sale.paymentMethod === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 
                            sale.paymentMethod === 'UPI' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {sale.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
             <div className="py-8 text-center text-gray-500">No sales recorded today yet.</div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/billing" className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg text-green-700 hover:bg-green-100 transition">
              <Receipt className="mb-2" size={24} />
              <span className="text-sm font-medium">New Bill</span>
            </Link>
            <Link to="/products" className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg text-blue-700 hover:bg-blue-100 transition">
              <Package className="mb-2" size={24} />
              <span className="text-sm font-medium">Add Product</span>
            </Link>
            <Link to="/inventory" className="flex flex-col items-center justify-center p-4 bg-orange-50 rounded-lg text-orange-700 hover:bg-orange-100 transition">
              <Boxes className="mb-2" size={24} />
              <span className="text-sm font-medium">Update Stock</span>
            </Link>
            <Link to="/reports" className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg text-purple-700 hover:bg-purple-100 transition">
              <BarChart3 className="mb-2" size={24} />
              <span className="text-sm font-medium">Reports</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
