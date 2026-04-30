import React from 'react';
import type { ButtonHTMLAttributes } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ children, icon, className = '', ...props }) => {
  return (
    <button className={`btn-primary flex items-center justify-center gap-2 ${className}`} {...props}>
      {icon && <span className="flex items-center">{icon}</span>}
      {children}
    </button>
  );
};
