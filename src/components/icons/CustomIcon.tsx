import React from 'react';
import { cn } from '@/lib/utils';

interface CustomIconProps {
  name: string;
  className?: string;
  size?: number;
  'aria-label'?: string;
}

const iconMap: Record<string, string> = {
  'shopping-cart': '/assets/icons/Asset 4.svg',
  search: '/assets/icons/Asset 3.svg',
  'delivery-truck': '/assets/icons/Asset 7.svg',
  'cannabis-leaf': '/assets/icons/Asset 1.svg',
  'cannabis-plant': '/assets/icons/Asset 21.svg',
  'cannabis-leaf-alt': '/assets/icons/Asset 20.svg',
  'security-lock': '/assets/icons/Asset 9.svg',
  'settings-gear': '/assets/icons/Asset 13.svg',
  checkmark: '/assets/icons/Asset 37.svg',
  analytics: '/assets/icons/Asset 40.svg',
  users: '/assets/icons/Asset 31.svg',
  clock: '/assets/icons/Asset 32.svg',
  'home-delivery': '/assets/icons/Asset 30.svg',
  dropper: '/assets/icons/Asset 18.svg',
  'medical-cross': '/assets/icons/Asset 15.svg',
  scale: '/assets/icons/Asset 11.svg',
  delete: '/assets/icons/Asset 10.svg',
};

/**
 * Custom SVG icon component that lazy loads SVG icons for optimal performance
 * Uses inline SVG loading to avoid additional HTTP requests while maintaining performance
 */
export function CustomIcon({
  name,
  className,
  size = 20,
  'aria-label': ariaLabel,
  ...props
}: CustomIconProps & React.HTMLAttributes<HTMLDivElement>) {
  const [svgContent, setSvgContent] = React.useState<string>('');
  const [isLoaded, setIsLoaded] = React.useState(false);
  const iconPath = iconMap[name];

  React.useEffect(() => {
    if (!iconPath) {
      console.warn(`Custom icon "${name}" not found in icon map`);
      return;
    }

    // Use a cache to avoid re-fetching the same SVG
    const cacheKey = `icon-${name}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      setSvgContent(cached);
      setIsLoaded(true);
      return;
    }

    // Fetch and cache the SVG content
    fetch(iconPath)
      .then((response) => response.text())
      .then((svg) => {
        // Store in session cache for performance
        sessionStorage.setItem(cacheKey, svg);
        setSvgContent(svg);
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error(`Failed to load icon "${name}":`, error);
      });
  }, [iconPath, name]);

  if (!iconPath) {
    return (
      <div
        className={cn('inline-block', className)}
        style={{ width: size, height: size }}
        {...props}
      >
        <div className="w-full h-full bg-muted rounded" />
      </div>
    );
  }

  return (
    <div
      className={cn('inline-block custom-icon', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel || `${name} icon`}
      dangerouslySetInnerHTML={isLoaded ? { __html: svgContent } : undefined}
      {...props}
    >
      {!isLoaded && <div className="w-full h-full bg-muted animate-pulse rounded" />}
    </div>
  );
}

/**
 * Pre-optimized icon components for frequently used icons
 * These components inline the SVG to avoid any loading time
 */

// Shopping Cart Icon (Asset 4.svg)
export function ShoppingCartIcon({
  className,
  size = 20,
  ...props
}: Omit<CustomIconProps, 'name'> & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('inline-block', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Shopping cart"
      {...props}
    >
      <svg width="100%" height="100%" viewBox="0 0 33.12 39.16" fill="none">
        <path d="M8.28,13.58l20.84,0l-2.77,13.86l-15.3,0l-2.77,-13.86Z" fill="#185a1b" />
        <circle cx="13.24" cy="34.03" r="2.56" fill="#185a1b" />
        <circle cx="24.05" cy="34.03" r="2.56" fill="#185a1b" />
        <path
          d="M2.56,2.56l2.56,0l1.28,6.41l22.12,0l-2.56,12.8l-17.92,0l-5.12,-25.6l-2.56,0"
          stroke="#185a1b"
          strokeWidth="2.56"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

// Search Icon (Asset 3.svg)
export function SearchIcon({
  className,
  size = 20,
  ...props
}: Omit<CustomIconProps, 'name'> & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('inline-block', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Search"
      {...props}
    >
      <svg width="100%" height="100%" viewBox="0 0 37.67 40.17" fill="none">
        <circle cx="15.34" cy="15.34" r="13.58" stroke="#185a1b" strokeWidth="3.52" fill="none" />
        <path
          d="M28.92,28.92l8.75,8.75"
          stroke="#185a1b"
          strokeWidth="3.52"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// Cannabis Leaf Icon (Asset 1.svg)
export function CannabisLeafIcon({
  className,
  size = 20,
  ...props
}: Omit<CustomIconProps, 'name'> & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('inline-block', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Cannabis leaf"
      {...props}
    >
      <svg width="100%" height="100%" viewBox="0 0 42.95 38.38" fill="none">
        <path
          d="M21.47,38.38c0,0 -8.59,-7.67 -8.59,-19.19c0,-11.52 8.59,-19.19 8.59,-19.19c0,0 8.59,7.67 8.59,19.19c0,11.52 -8.59,19.19 -8.59,19.19Z"
          fill="#185a1b"
        />
        <path
          d="M13.77,30.58c0,0 -13.77,-2.87 -13.77,-11.39c0,-8.52 13.77,-11.39 13.77,-11.39"
          fill="none"
          stroke="#185a1b"
          strokeWidth="1.5"
        />
        <path
          d="M29.18,30.58c0,0 13.77,-2.87 13.77,-11.39c0,-8.52 -13.77,-11.39 -13.77,-11.39"
          fill="none"
          stroke="#185a1b"
          strokeWidth="1.5"
        />
        <path
          d="M17.98,25.58c0,0 -8.98,-5.98 -8.98,-12.78c0,-6.8 8.98,-12.78 8.98,-12.78"
          fill="none"
          stroke="#185a1b"
          strokeWidth="1.5"
        />
        <path
          d="M24.97,25.58c0,0 8.98,-5.98 8.98,-12.78c0,-6.8 -8.98,-12.78 -8.98,-12.78"
          fill="none"
          stroke="#185a1b"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}

export default CustomIcon;
