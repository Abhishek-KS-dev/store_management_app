/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Billing } from './pages/Billing';
import { Products } from './pages/Products';
import { Inventory } from './pages/Inventory';
import { SalesHistory } from './pages/Sales';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="billing" element={<Billing />} />
                <Route path="products" element={<Products />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="sales" element={<SalesHistory />} />
                
                <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<div className="p-8 text-center text-gray-500">Settings and Staff Management coming soon.</div>} />
                </Route>
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}


