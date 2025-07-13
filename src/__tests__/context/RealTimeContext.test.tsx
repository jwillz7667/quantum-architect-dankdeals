// src/__tests__/context/RealTimeContext.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RealTimeProvider } from '@/context/RealTimeContext';
import { useRealTime } from '@/hooks/useRealTime';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Mock dependencies
vi.mock('@/hooks/useAuth');
vi.mock('@/integrations/supabase/client');
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Test component that uses the real-time hook
function TestComponent() {
  const { connectionStatus, subscribeToOrders } = useRealTime();

  return (
    <div>
      <div data-testid="connection-status">{connectionStatus}</div>
      <button
        onClick={() => {
          subscribeToOrders((payload) => {
            console.log('Order update:', payload);
          });
        }}
      >
        Subscribe
      </button>
    </div>
  );
}

describe('RealTimeContext', () => {
  const mockUser = { id: 'test-user-123', email: 'test@example.com' };
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockImplementation((callback: (status: string) => void) => {
      callback('subscribed');
      return mockChannel;
    }),
  } as unknown as RealtimeChannel;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: mockUser } as ReturnType<typeof useAuth>);
    vi.mocked(supabase.channel).mockReturnValue(mockChannel);
    vi.mocked(supabase.removeChannel).mockResolvedValue({} as never);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should provide real-time context', () => {
    render(
      <RealTimeProvider>
        <TestComponent />
      </RealTimeProvider>
    );

    expect(screen.getByTestId('connection-status')).toBeInTheDocument();
  });

  it('should establish connection when user is authenticated', async () => {
    render(
      <RealTimeProvider>
        <TestComponent />
      </RealTimeProvider>
    );

    await waitFor(() => {
      expect(supabase.channel).toHaveBeenCalledWith(`orders-channel-${mockUser.id}`);
    });

    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${mockUser.id}`,
      }),
      expect.any(Function)
    );
  });

  it('should handle connection status changes', async () => {
    const mockSubscribe = vi.fn().mockImplementation((callback) => {
      setTimeout(() => callback('subscribed'), 0);
      return mockChannel;
    });
    
    (mockChannel.subscribe as ReturnType<typeof vi.fn>).mockImplementation(mockSubscribe);

    render(
      <RealTimeProvider>
        <TestComponent />
      </RealTimeProvider>
    );

    // Initial state should be connecting
    expect(screen.getByTestId('connection-status')).toHaveTextContent('connecting');

    // After subscription, should be connected
    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
    });
  });

  it('should clean up on unmount', () => {
    const { unmount } = render(
      <RealTimeProvider>
        <TestComponent />
      </RealTimeProvider>
    );

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  it('should not create channel when user is not authenticated', () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ user: null });

    render(
      <RealTimeProvider>
        <TestComponent />
      </RealTimeProvider>
    );

    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it('should handle order updates', async () => {
    const { toast } = await import('@/hooks/use-toast');
    let orderUpdateHandler: (payload: RealtimePostgresChangesPayload<any>) => void;

    (mockChannel.on as ReturnType<typeof vi.fn>).mockImplementation((event, options, handler) => {
      orderUpdateHandler = handler;
      return mockChannel;
    });

    render(
      <RealTimeProvider>
        <TestComponent />
      </RealTimeProvider>
    );

    await waitFor(() => {
      expect(mockChannel.on).toHaveBeenCalled();
    });

    // Simulate an order status update
    const updatePayload = {
      eventType: 'UPDATE',
      new: { 
        id: '123', 
        order_number: 'ORD-123', 
        status: 'confirmed',
        user_id: mockUser.id 
      },
      old: { 
        id: '123', 
        order_number: 'ORD-123', 
        status: 'pending',
        user_id: mockUser.id 
      },
    };

    orderUpdateHandler!(updatePayload as any);

    expect(toast).toHaveBeenCalledWith({
      title: 'Order Update',
      description: 'Order #ORD-123 has been confirmed!',
      variant: 'default',
    });
  });
}); 