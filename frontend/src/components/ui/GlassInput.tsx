import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1 w-full">
        {label && <label className="text-sm font-semibold text-gray-200">{label}</label>}
        <input
          ref={ref}
          className={`glass-input w-full ${error ? 'border-red-400' : ''} ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';
