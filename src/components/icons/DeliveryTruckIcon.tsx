import React from 'react';
import { cn } from '@/lib/utils';

interface DeliveryTruckIconProps {
  className?: string;
  size?: number;
  'aria-label'?: string;
}

/**
 * Delivery Truck Icon (Asset 7.svg) - Optimized for fast loading
 * Inline SVG component to avoid HTTP requests
 */
export function DeliveryTruckIcon({
  className,
  size = 24,
  'aria-label': ariaLabel,
  ...props
}: DeliveryTruckIconProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('inline-block', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel || 'Delivery truck'}
      {...props}
    >
      <svg width="100%" height="100%" viewBox="0 0 40.24 37.97" fill="none">
        <rect x="1.76" y="8.8" width="19.84" height="15.84" rx="1.76" fill="#185a1b" />
        <rect x="24.64" y="15.84" width="14.08" height="8.8" rx="1.76" fill="#185a1b" />
        <circle cx="10.56" cy="30.24" r="4.4" fill="none" stroke="#185a1b" strokeWidth="1.76" />
        <circle cx="29.04" cy="30.24" r="4.4" fill="none" stroke="#185a1b" strokeWidth="1.76" />
        <line x1="21.6" y1="19.36" x2="24.64" y2="19.36" stroke="#185a1b" strokeWidth="1.76" />
        <line x1="1.76" y1="26.4" x2="6.16" y2="26.4" stroke="#185a1b" strokeWidth="1.76" />
        <line x1="14.96" y1="26.4" x2="24.64" y2="26.4" stroke="#185a1b" strokeWidth="1.76" />
        <line x1="33.44" y1="26.4" x2="38.48" y2="26.4" stroke="#185a1b" strokeWidth="1.76" />
        <path d="M21.6,8.8L24.64,15.84" stroke="#185a1b" strokeWidth="1.76" fill="none" />
        <rect x="3.52" y="10.56" width="4.4" height="3.52" rx="0.88" fill="#fff" />
        <rect x="13.2" y="10.56" width="4.4" height="3.52" rx="0.88" fill="#fff" />
      </svg>
    </div>
  );
}

export default DeliveryTruckIcon;
