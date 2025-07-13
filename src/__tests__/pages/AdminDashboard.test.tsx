import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Overview from '../../pages/admin/Overview';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '@supabase/supabase-js';

// Mock the hooks
vi.mock('../../hooks/useAuth');
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock Supabase
vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        data: [{ total_amount: 100 }, { total_amount: 200 }],
        error: null,
        count: 5,
      })),
    })),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Admin Dashboard', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'admin@test.com' } as User,
      session: null,
      profile: { is_admin: true },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      csrfToken: 'test-token'
    } as ReturnType<typeof useAuth>);
  });

  it('renders overview stats', async () => {
    renderWithProviders(<Overview />);

    await waitFor(() => {
      expect(screen.getByText('Total Orders')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Total Products')).toBeInTheDocument();
    });
  });

  it('displays loading state', () => {
    renderWithProviders(<Overview />);
    
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('calculates total revenue correctly', async () => {
    renderWithProviders(<Overview />);

    await waitFor(() => {
      expect(screen.getByText('$300.00')).toBeInTheDocument(); // 100 + 200
    });
  });
}); 