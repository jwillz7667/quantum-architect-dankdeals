import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { label: 'Overview', to: '/admin' },
  { label: 'Products', to: '/admin/products' },
];

const AdminLayout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const items = useMemo(() => NAV_ITEMS, []);

  return (
    <div className="min-h-screen bg-gradient-dark">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r bg-muted/40 lg:block">
          <div className="flex h-16 items-center border-b px-6 text-lg font-semibold">
            DankDeals Admin
          </div>
          <nav className="flex flex-col gap-1 p-4">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
            <div className="flex h-16 items-center justify-between px-4 lg:px-8">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => navigate('/admin/products')}
                >
                  Menu
                </Button>
                <h1 className="text-lg font-semibold">Admin Console</h1>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="hidden sm:inline">{user?.email}</span>
                <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                  View Site
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void signOut().then(() => {
                      navigate('/');
                    });
                  }}
                >
                  Sign out
                </Button>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
