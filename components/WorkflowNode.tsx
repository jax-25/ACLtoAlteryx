import React from 'react';
import { SchemaField } from '../types';

interface WorkflowNodeProps {
  title: string;
  icon: 'input' | 'output';
  children: React.ReactNode;
  schema?: SchemaField[] | null;
  isLoadingSchema?: boolean;
  isRemovable?: boolean;
  onRemove?: () => void;
  isComplete?: boolean;
}

const icons = {
  input: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 1.1.9 2 2 2h12a2 2 0 002-2V7M16 4h.01M12 4h.01M8 4h.01M4 4h.01M20 4h.01M20 8h.01M20 12h.01M20 16h.01M4 8h.01M4 12h.01M4 16h.01" />
    </svg>
  ),
  output: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
};

export const WorkflowNode: React.FC<WorkflowNodeProps> = ({ title, icon, children, schema, isLoadingSchema, isRemovable, onRemove, isComplete }) => {
  
  const baseClasses = "relative bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg shadow-zinc-500/5 w-full transition-all duration-300 ease-in-out hover:z-20";
  const ringClasses = isComplete 
    ? 'ring-1 ring-brand-primary/80 shadow-glow shadow-brand-primary/25' 
    : 'ring-1 ring-zinc-900/10';

  return (
    <div className={`${baseClasses} ${ringClasses}`}>
      {isRemovable && onRemove && (
        <button 
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border border-zinc-200 text-zinc-400 hover:text-red-500 hover:border-red-300 transition-all z-10"
          aria-label="Remove input node"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      )}
      <div className="flex items-center gap-3 px-2 mb-3">
        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-zinc-200 text-zinc-500">
          {isLoadingSchema ? (
            <svg className="animate-spin h-5 w-5 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            icons[icon]
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-800 truncate max-w-[180px]" title={title}>{title}</p>
          <p className="text-xs text-zinc-400 -mt-0.5">{icon === 'input' ? 'Data Source' : 'Data Destination'}</p>
        </div>
      </div>
      <div className="relative">
        {children}
      </div>
      {(isLoadingSchema || schema) && (
        <div className="mt-3 px-2">
           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Schema Preview</p>
           {isLoadingSchema ? (
             <div className="space-y-1.5 animate-pulse">
                <div className="h-4 w-2/3 bg-zinc-200 rounded"></div>
                <div className="h-4 w-1/2 bg-zinc-200 rounded"></div>
             </div>
           ) : schema && (
             <div className="flex flex-wrap gap-1.5">
              {schema.slice(0, 5).map(field => (
                <span key={field.name} className="flex items-center px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[11px] font-medium rounded-full border border-zinc-200">
                  {field.name}
                  <span className="ml-1.5 text-zinc-400 font-mono text-[10px]">({field.type})</span>
                </span>
              ))}
              {schema.length > 5 && (
                 <div className="relative group">
                    <span className="cursor-pointer px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[11px] font-medium rounded-full border border-zinc-200">
                      +{schema.length - 5} more
                    </span>
                    <div className="schema-popover absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-white rounded-lg shadow-lg border border-zinc-200 z-50 overflow-hidden">
                       <div className="py-1 px-3 bg-zinc-50 border-b border-zinc-200">
                         <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Additional Fields</p>
                       </div>
                       <ul className="max-h-48 overflow-y-auto custom-scrollbar">
                         {schema.slice(5).map((field) => (
                          <li key={field.name} className="schema-popover-item px-3 py-1.5 text-xs text-zinc-700 flex justify-between">
                            <span>{field.name}</span>
                            <span className="font-mono text-zinc-400">({field.type})</span>
                          </li>
                         ))}
                       </ul>
                    </div>
                 </div>
              )}
             </div>
           )}
        </div>
      )}
    </div>
  );
};