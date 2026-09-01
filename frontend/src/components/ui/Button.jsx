import React from 'react';

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 border-transparent',
  secondary: 'bg-[#1e293b] hover:bg-slate-800 text-slate-200 border-slate-700/60',
  outline: 'bg-transparent hover:bg-slate-800/60 text-slate-300 border-slate-700',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 border-transparent',
  ghost: 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white border-transparent',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className = '',
  disabled = false,
  ...props
}) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2 text-sm rounded-xl gap-2',
    lg: 'px-5 py-2.5 text-base rounded-xl gap-2.5',
  };

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium transition-all duration-200 border active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
        variants[variant] || variants.primary
      } ${sizeClasses[size] || sizeClasses.md} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
}