import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  Package, 
  Boxes, 
  History, 
  BarChart3, 
  Settings,
  Store,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: ['owner', 'staff'] },
    { name: 'Billing', path: '/billing', icon: <Receipt size={20} />, roles: ['owner', 'staff'] },
    { name: 'Products', path: '/products', icon: <Package size={20} />, roles: ['owner', 'staff'] },
    { name: 'Inventory', path: '/inventory', icon: <Boxes size={20} />, roles: ['owner', 'staff'] },
    { name: 'Sales', path: '/sales', icon: <History size={20} />, roles: ['owner', 'staff'] },
    { name: 'Reports', path: '/reports', icon: <BarChart3 size={20} />, roles: ['owner'] },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} />, roles: ['owner'] },
  ];

  const allowedItems = navItems.filter(item => !item.roles || item.roles.includes(user?.role || ''));

  return (
    <aside className="w-64 bg-green-800 text-white flex flex-col h-screen fixed hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-green-700 shrink-0">
        <Store className="mr-3" size={24} />
        <span className="text-xl font-bold tracking-wide">Ajwa Store</span>
      </div>
      <nav className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto">
        {allowedItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive ? 'bg-green-700 text-white font-medium' : 'text-green-100 hover:bg-green-700/50 hover:text-white'
              }`
            }
          >
            {item.icon}
            <span className="ml-3">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-green-700 shrink-0">
        <div className="flex items-center justify-between mb-4 px-2 text-green-100">
           <div className="flex items-center">
             <User size={18} className="mr-2" />
             <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">{user?.name}</span>
                <span className="text-xs text-green-300 mt-1 capitalize">{user?.role}</span>
             </div>
           </div>
        </div>
        <button 
          onClick={logout}
          className="flex items-center justify-center w-full px-4 py-2 text-sm text-green-100 bg-green-900 rounded-lg hover:bg-green-950 transition-colors"
        >
          <LogOut size={16} className="mr-2" />
          Log Out
        </button>
      </div>
    </aside>
  );
};

export const MobileNav: React.FC = () => {
  const { user, logout } = useAuth();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: ['owner', 'staff'] },
    { name: 'Billing', path: '/billing', icon: <Receipt size={20} />, roles: ['owner', 'staff'] },
    { name: 'Products', path: '/products', icon: <Package size={20} />, roles: ['owner', 'staff'] },
    { name: 'Inventory', path: '/inventory', icon: <Boxes size={20} />, roles: ['owner', 'staff'] },
    { name: 'Sales', path: '/sales', icon: <History size={20} />, roles: ['owner', 'staff'] },
    { name: 'Reports', path: '/reports', icon: <BarChart3 size={20} />, roles: ['owner'] },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} />, roles: ['owner'] },
  ];

  const allowedItems = navItems.filter(item => !item.roles || item.roles.includes(user?.role || ''));

  return (
    <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-2 z-50">
      {allowedItems.slice(0, 4).map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center p-2 rounded-lg ${
              isActive ? 'text-green-700' : 'text-gray-500 hover:text-green-600'
            }`
          }
        >
          {item.icon}
          <span className="text-[10px] mt-1">{item.name}</span>
        </NavLink>
      ))}
      <button
        onClick={logout}
        className="flex flex-col items-center p-2 rounded-lg text-gray-500 hover:text-red-600"
      >
        <LogOut size={20} />
        <span className="text-[10px] mt-1">Logout</span>
      </button>
    </nav>
  );
};
