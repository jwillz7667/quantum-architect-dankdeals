import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ElementType;
  iconColor?: string;
  loading?: boolean;
}

export function StatsCard({
  title,
  value,
  description,
  trend,
  icon: Icon,
  iconColor = 'text-gray-600',
  loading = false,
}: StatsCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;

    if (trend.value === 0) {
      return <MinusIcon className="h-4 w-4 text-gray-500" />;
    }

    return trend.isPositive ? (
      <ArrowUpIcon className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 text-red-600" />
    );
  };

  const getTrendColor = () => {
    if (!trend || trend.value === 0) return 'text-gray-600';
    return trend.isPositive ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {Icon && <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />}
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            {description && <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-1" />}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className={cn('h-4 w-4', iconColor)} />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <div className={cn('flex items-center gap-1', getTrendColor())}>
                {getTrendIcon()}
                <span className="text-xs font-medium">{Math.abs(trend.value)}%</span>
              </div>
            )}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
