import React from 'react';

export function Card({ children, className = '', title, subtitle, action }) {
  return (
    <div className={`bg-[#131b2e]/90 backdrop-blur-md border border-[#1f293d] rounded-2xl p-5 shadow-xl ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1f293d]/60">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}