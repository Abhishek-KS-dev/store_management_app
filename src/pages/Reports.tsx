import React from 'react';
import { useData } from '../contexts/DataContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { IndianRupee, TrendingUp, PackageMinus, Box, RefreshCw } from 'lucide-react';

export const Reports: React.FC = () => {
  const { sales, products, isRefreshing, refreshAll } = useData();

  const safeParseDate = (dateStr: string) => {
    if (!dateStr) return null;
    try {
      const parsed = parseISO(dateStr);
      if (isNaN(parsed.getTime())) return new Date(dateStr);
      return parsed;
    } catch {
      return null;
    }
  };

  // Sales Stats
  const todaySales = sales.filter(s => {
    const d = safeParseDate(s.date);
    return d ? isToday(d) : false;
  });
  const weekSales = sales.filter(s => {
    const d = safeParseDate(s.date);
    return d ? isThisWeek(d) : false;
  });
  const monthSales = sales.filter(s => {
    const d = safeParseDate(s.date);
    return d ? isThisMonth(d) : false;
  });

  const todayAmount = todaySales.reduce((sum, s) => sum + s.finalTotal, 0);
  const weekAmount = weekSales.reduce((sum, s) => sum + s.finalTotal, 0);
  const monthAmount = monthSales.reduce((sum, s) => sum + s.finalTotal, 0);

  const avgBillValue = sales.length > 0 ? (sales.reduce((sum, s) => sum + s.finalTotal, 0) / sales.length).toFixed(2) : 0;

  // Product Stats
  const lowStock = products.filter(p => p.status === 'active' && p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStock = products.filter(p => p.status === 'active' && p.stock === 0).length;

  // Calculate best selling
  const productSalesCount: Record<string, number> = {};
  sales.forEach(sale => {
    (sale.items || []).forEach(item => {
      if (item.name) {
        productSalesCount[item.name] = (productSalesCount[item.name] || 0) + (item.quantity || 1);
      }
    });
  });

  const bestSellingData = Object.entries(productSalesCount)
    .map(([name, count]) => ({ name, sales: count }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // Payment Stats
  const paymentData = [
    { name: 'Cash', value: sales.filter(s => s.paymentMethod === 'Cash').reduce((sum, s) => sum + s.finalTotal, 0) },
    { name: 'UPI', value: sales.filter(s => s.paymentMethod === 'UPI').reduce((sum, s) => sum + s.finalTotal, 0) },
    { name: 'Card', value: sales.filter(s => s.paymentMethod === 'Card').reduce((sum, s) => sum + s.finalTotal, 0) },
  ].filter(d => d.value > 0);

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6'];

  const StatCard = ({ title, value, subtitle, icon, colorClass }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${colorClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-xs text-gray-500 mt-1">Analytics derived from shared live data</p>
        </div>
        <button
          onClick={() => refreshAll(true)}
          disabled={isRefreshing}
          className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg flex items-center gap-2 font-medium transition text-sm disabled:opacity-50"
          title="Refresh reports data"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-green-600' : ''} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Today's Revenue" 
          value={`₹${todayAmount.toLocaleString()}`} 
          subtitle={`${todaySales.length} bills today`}
          icon={<IndianRupee size={24} />} 
          colorClass="bg-green-50 text-green-600" 
        />
        <StatCard 
          title="Weekly Revenue" 
          value={`₹${weekAmount.toLocaleString()}`} 
          subtitle="This week so far"
          icon={<TrendingUp size={24} />} 
          colorClass="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          title="Monthly Revenue" 
          value={`₹${monthAmount.toLocaleString()}`} 
          subtitle="This month so far"
          icon={<TrendingUp size={24} />} 
          colorClass="bg-purple-50 text-purple-600" 
        />
        <StatCard 
          title="Average Bill Value" 
          value={`₹${avgBillValue}`} 
          subtitle="All time average"
          icon={<IndianRupee size={24} />} 
          colorClass="bg-orange-50 text-orange-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Best Selling Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Top 5 Best Selling Products (Qty)</h2>
          <div className="h-72">
            {bestSellingData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bestSellingData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f3f4f6'}} />
                  <Bar dataKey="sales" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">No sales data available</div>
            )}
          </div>
        </div>

        {/* Payment Methods Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Revenue by Payment Method</h2>
          <div className="h-72">
             {paymentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-gray-400">No payment data available</div>
             )}
          </div>
        </div>
      </div>

      {/* Product Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-200 bg-orange-50/50">
            <div className="flex items-center gap-3 mb-2">
              <PackageMinus className="text-orange-500" size={24} />
              <h2 className="text-lg font-bold text-gray-800">Low Stock Alert</h2>
            </div>
            <p className="text-gray-600 mb-4">You have <span className="font-bold text-orange-600">{lowStock}</span> products running low on stock.</p>
         </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200 bg-red-50/50">
            <div className="flex items-center gap-3 mb-2">
              <Box className="text-red-500" size={24} />
              <h2 className="text-lg font-bold text-gray-800">Out of Stock Alert</h2>
            </div>
            <p className="text-gray-600 mb-4">You have <span className="font-bold text-red-600">{outOfStock}</span> products completely out of stock.</p>
         </div>
      </div>
    </div>
  );
};
