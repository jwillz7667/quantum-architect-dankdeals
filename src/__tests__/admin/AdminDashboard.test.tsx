import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminRoute } from '@/components/AdminRoute';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';

// Mock hooks and modules
vi.mock('@/hooks/useAdminAuth');
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  }
}));

const createWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should redirect to home if not admin', () => {
      vi.mocked(useAdminAuth).mockReturnValue({
        isAdmin: false,
        adminUser: null,
        isLoading: false,
        requireAdmin: vi.fn(),
        signOut: vi.fn(),
        checkAdminStatus: vi.fn(),
      });

      render(<AdminRoute><div>Admin Content</div></AdminRoute>, { wrapper: createWrapper });
      
      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });

    it('should show loading state while checking auth', () => {
      vi.mocked(useAdminAuth).mockReturnValue({
        isAdmin: false,
        adminUser: null,
        isLoading: true,
        requireAdmin: vi.fn(),
        signOut: vi.fn(),
        checkAdminStatus: vi.fn(),
      });

      render(<AdminRoute><div>Admin Content</div></AdminRoute>, { wrapper: createWrapper });
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render admin content when authorized', () => {
      vi.mocked(useAdminAuth).mockReturnValue({
        isAdmin: true,
        adminUser: {
          id: '123',
          email: 'admin@example.com',
          role: 'admin',
        },
        isLoading: false,
        requireAdmin: vi.fn(),
        signOut: vi.fn(),
        checkAdminStatus: vi.fn(),
      });

      render(<AdminRoute><div>Admin Content</div></AdminRoute>, { wrapper: createWrapper });
      
      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      vi.mocked(useAdminAuth).mockReturnValue({
        isAdmin: true,
        adminUser: {
          id: '123',
          email: 'admin@example.com',
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User',
        },
        isLoading: false,
        requireAdmin: vi.fn(),
        signOut: vi.fn(),
        checkAdminStatus: vi.fn(),
      });
    });

    it('should render all navigation items', () => {
      render(<AdminDashboard />, { wrapper: createWrapper });
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Orders')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Activity Log')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should display admin user info', () => {
      render(<AdminDashboard />, { wrapper: createWrapper });
      
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Administrator')).toBeInTheDocument();
    });

    it('should toggle mobile sidebar', () => {
      render(<AdminDashboard />, { wrapper: createWrapper });
      
      const toggleButton = screen.getByRole('button', { name: /menu/i });
      fireEvent.click(toggleButton);
      
      // Sidebar should be visible
      expect(screen.getByText('DankDeals Admin')).toBeInTheDocument();
    });

    it('should call signOut when sign out is clicked', () => {
      const mockSignOut = vi.fn();
      vi.mocked(useAdminAuth).mockReturnValue({
        isAdmin: true,
        adminUser: {
          id: '123',
          email: 'admin@example.com',
          role: 'admin',
        },
        isLoading: false,
        requireAdmin: vi.fn(),
        signOut: mockSignOut,
        checkAdminStatus: vi.fn(),
      });

      render(<AdminDashboard />, { wrapper: createWrapper });
      
      const signOutButton = screen.getByText('Sign Out');
      fireEvent.click(signOutButton);
      
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('Real-time Updates', () => {
    it('should subscribe to admin notifications', async () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };
      
      vi.mocked(supabase).channel = vi.fn(() => mockChannel);
      
      render(<AdminDashboard />, { wrapper: createWrapper });
      
      await waitFor(() => {
        expect(supabase.channel).toHaveBeenCalledWith(expect.stringContaining('admin-notifications'));
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(useAdminAuth).mockReturnValue({
        isAdmin: true,
        adminUser: {
          id: '123',
          email: 'admin@example.com',
          role: 'admin',
        },
        isLoading: false,
        requireAdmin: vi.fn(),
        signOut: vi.fn(),
        checkAdminStatus: vi.fn(),
      });
    });

    it('should have proper ARIA labels', () => {
      render(<AdminDashboard />, { wrapper: createWrapper });
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      render(<AdminDashboard />, { wrapper: createWrapper });
      
      const firstNavItem = screen.getByText('Dashboard');
      firstNavItem.focus();
      
      expect(document.activeElement).toBe(firstNavItem);
    });
  });
});

describe('Admin Components Integration', () => {
  const mockAdminUser = {
    id: '123',
    email: 'admin@example.com',
    role: 'admin' as const,
  };

  beforeEach(() => {
    vi.mocked(useAdminAuth).mockReturnValue({
      isAdmin: true,
      adminUser: mockAdminUser,
      isLoading: false,
      requireAdmin: vi.fn(),
      signOut: vi.fn(),
      checkAdminStatus: vi.fn(),
    });
  });

  describe('StatsCard', () => {
    it('should render stats correctly', async () => {
      const { StatsCard } = await import('@/components/admin/StatsCard');
      
      render(
        <StatsCard
          title="Total Revenue"
          value="$12,345"
          description="Last 30 days"
          trend={{ value: 15, isPositive: true }}
        />,
        { wrapper: createWrapper }
      );
      
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('$12,345')).toBeInTheDocument();
      expect(screen.getByText('Last 30 days')).toBeInTheDocument();
      expect(screen.getByText('15%')).toBeInTheDocument();
    });

    it('should show loading state', async () => {
      const { StatsCard } = await import('@/components/admin/StatsCard');
      
      render(
        <StatsCard
          title="Total Revenue"
          value="$0"
          loading={true}
        />,
        { wrapper: createWrapper }
      );
      
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    });
  });

  describe('NotificationBell', () => {
    it('should show unread count', async () => {
      const { NotificationBell } = await import('@/components/admin/NotificationBell');
      
      render(<NotificationBell />, { wrapper: createWrapper });
      
      await waitFor(() => {
        const badge = screen.queryByText('2'); // Based on mock data
        expect(badge).toBeInTheDocument();
      });
    });

    it('should open dropdown on click', async () => {
      const { NotificationBell } = await import('@/components/admin/NotificationBell');
      
      render(<NotificationBell />, { wrapper: createWrapper });
      
      const bellButton = screen.getByRole('button');
      fireEvent.click(bellButton);
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
    });
  });
}); 