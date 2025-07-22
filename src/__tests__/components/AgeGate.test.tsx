import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgeGate } from '@/components/AgeGate';
import * as cookieLib from '@/lib/cookies';

// Mock the cookie library
vi.mock('@/lib/cookies', () => ({
  setCookie: vi.fn(),
  getCookie: vi.fn(),
}));

const mockSetCookie = vi.mocked(cookieLib.setCookie);
const mockGetCookie = vi.mocked(cookieLib.getCookie);

describe('AgeGate Component', () => {
  const AGE_GATE_KEY = 'dankdeals_age_verified';

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Reset window.location
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  it('should render age verification modal when not verified', () => {
    mockGetCookie.mockReturnValue(null);

    render(<AgeGate />);

    expect(screen.getByText('Age Verification Required')).toBeInTheDocument();
    expect(
      screen.getByText('You must be 21 years or older to access this website')
    ).toBeInTheDocument();
    expect(screen.getByText('I am 21 or older - Enter Site')).toBeInTheDocument();
    expect(screen.getByText('I am under 21 - Exit')).toBeInTheDocument();
  });

  it('should not render when user is already verified', () => {
    mockGetCookie.mockReturnValue('true');

    render(<AgeGate />);

    expect(screen.queryByText('Age Verification Required')).not.toBeInTheDocument();
  });

  it('should set cookie and hide modal when user verifies age', async () => {
    mockGetCookie.mockReturnValue(null);

    render(<AgeGate />);

    const enterButton = screen.getByText('I am 21 or older - Enter Site');
    fireEvent.click(enterButton);

    expect(mockSetCookie).toHaveBeenCalledWith(AGE_GATE_KEY, 'true', 30, {
      secure: true,
      sameSite: 'strict',
    });

    await waitFor(() => {
      expect(screen.queryByText('Age Verification Required')).not.toBeInTheDocument();
    });
  });

  it('should redirect to Google when user is under 21', () => {
    mockGetCookie.mockReturnValue(null);

    render(<AgeGate />);

    const exitButton = screen.getByText('I am under 21 - Exit');
    fireEvent.click(exitButton);

    expect(window.location.href).toBe('https://www.google.com');
  });

  it('should display Minnesota legal notices', () => {
    mockGetCookie.mockReturnValue(null);

    render(<AgeGate />);

    expect(screen.getByText('Minnesota Legal Notice:')).toBeInTheDocument();
    expect(
      screen.getByText(/Cannabis products have not been analyzed or approved by the FDA/)
    ).toBeInTheDocument();
  });

  it('should display Cash Due on Delivery notice', () => {
    mockGetCookie.mockReturnValue(null);

    render(<AgeGate />);

    expect(screen.getByText('CASH DUE ON DELIVERY')).toBeInTheDocument();
    expect(screen.getByText(/All sales are final/)).toBeInTheDocument();
  });

  it('should handle cookie errors gracefully', () => {
    mockGetCookie.mockImplementation(() => {
      throw new Error('Cookie error');
    });

    render(<AgeGate />);

    expect(screen.getByText('Age Verification Required')).toBeInTheDocument();
  });
});
