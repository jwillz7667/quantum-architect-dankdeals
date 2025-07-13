import React from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

const AdminLayout: React.FC = () => {
  const navItems = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { to: '/admin/customers', label: 'Customers', icon: Users },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <ProtectedRoute requiresAdmin>
      <div className="flex h-screen bg-background">
        <aside className="w-64 border-r bg-card">
          <div className="p-6">
            <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          </div>
          <nav className="px-4 pb-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default AdminLayout; 