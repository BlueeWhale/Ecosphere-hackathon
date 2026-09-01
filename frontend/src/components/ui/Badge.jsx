import React from 'react';

const variantClasses = {
  primary: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  secondary: 'bg-slate-800 text-slate-300 border-slate-700',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export function Badge({ children, variant = 'primary', className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        variantClasses[variant] || variantClasses.primary
      } ${className}`}
    >
      {children}
    </span>
  );
}