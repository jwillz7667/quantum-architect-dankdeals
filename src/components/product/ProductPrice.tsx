import { cn } from '@/lib/utils';

interface ProductPriceProps {
  price: number;
  originalPrice?: number;
  currency?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Product price display component
 * - Handles price formatting
 * - Shows discounts
 * - Accessible price information
 */
export function ProductPrice({
  price,
  originalPrice,
  currency = '$',
  className,
  size = 'md',
}: ProductPriceProps) {
  const formatPrice = (value: number) => {
    return typeof value === 'number' ? value.toFixed(2) : '0.00';
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg md:text-xl',
    lg: 'text-xl md:text-2xl',
  };

  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span
        className={cn('font-bold text-primary', sizeClasses[size])}
        aria-label={`Price: ${currency}${formatPrice(price)}`}
      >
        {currency}
        {formatPrice(price)}
      </span>

      {hasDiscount && (
        <>
          <span
            className="text-sm text-muted-foreground line-through"
            aria-label={`Original price: ${currency}${formatPrice(originalPrice)}`}
          >
            {currency}
            {formatPrice(originalPrice)}
          </span>
          <span className="text-xs font-medium text-green-600">{discountPercentage}% off</span>
        </>
      )}
    </div>
  );
}

interface ProductPriceRangeProps {
  minPrice: number;
  maxPrice: number;
  currency?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Display price range for products with variants
 */
export function ProductPriceRange({
  minPrice,
  maxPrice,
  currency = '$',
  className,
  size = 'md',
}: ProductPriceRangeProps) {
  const formatPrice = (value: number) => value.toFixed(0);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg md:text-xl',
    lg: 'text-xl md:text-2xl',
  };

  if (minPrice === maxPrice) {
    return <ProductPrice price={minPrice} currency={currency} className={className} size={size} />;
  }

  return (
    <div className={cn('font-bold text-primary', sizeClasses[size], className)}>
      {currency}
      {formatPrice(minPrice)}-{currency}
      {formatPrice(maxPrice)}
    </div>
  );
}
