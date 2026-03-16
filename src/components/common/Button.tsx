import React from 'react';
import { ButtonProps } from '../../types';

const variantClasses: Record<string, string> = {
  primary: 'bg-sky-600 hover:bg-sky-700 text-white border border-sky-600',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-600',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  icon,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 shadow-sm
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {icon}
      {label}
    </button>
  );
};
