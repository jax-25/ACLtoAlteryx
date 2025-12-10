import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, description }) => {
  return (
    <div className={`rounded-3xl overflow-hidden ${className}`}>
      {(title || description) && (
        <div className="px-8 pt-8 pb-2">
          {title && <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>}
          {description && <p className="mt-2 text-sm text-slate-500 leading-relaxed">{description}</p>}
        </div>
      )}
      <div className="p-8">
        {children}
      </div>
    </div>
  );
};