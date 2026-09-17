import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  badgeText?: string;
  badgeBg?: string;
  accentColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  badgeText,
  badgeBg = 'bg-slate-100 text-slate-700',
  accentColor = 'text-brand-secondary',
  className = '',
  children
}) => {
  return (
    <div className={`bg-brand-surface rounded-xl p-5 border border-brand-border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-brand-textMuted">{title}</span>
          <div className={`p-2.5 rounded-lg bg-slate-50 ${accentColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <h3 className="text-2xl font-bold text-brand-textPrimary">{value}</h3>
          {badgeText && (
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${badgeBg}`}>
              {badgeText}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-brand-textMuted mt-1.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
};
