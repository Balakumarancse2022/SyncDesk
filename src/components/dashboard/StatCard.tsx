import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent' | 'warning' | 'success' | 'danger';
  className?: string;
}

const variantStyles = {
  default: 'bg-card border-border',
  primary: 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20',
  accent: 'bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20',
  warning: 'bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20',
  success: 'bg-gradient-to-br from-success/10 to-success/5 border-success/20',
  danger: 'bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20',
};

const iconStyles = {
  default: 'bg-secondary text-foreground',
  primary: 'bg-primary/20 text-primary',
  accent: 'bg-accent/20 text-accent',
  warning: 'bg-warning/20 text-warning',
  success: 'bg-success/20 text-success',
  danger: 'bg-destructive/20 text-destructive',
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}) => {
  return (
    <div className={cn(
      'p-6 rounded-xl border transition-all duration-200 hover:shadow-md',
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1">
              <span className={cn(
                'text-sm font-medium',
                trend.positive ? 'text-success' : 'text-destructive'
              )}>
                {trend.positive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">vs last week</span>
            </div>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl',
          iconStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
