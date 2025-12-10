import React, { useRef, useState } from 'react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className="w-full group"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleChange}
        className="hidden"
        accept=".txt,.conf,.cfg,.acl,.py,.js"
        disabled={disabled}
      />
      
      <div 
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          relative rounded-xl border-2 border-dashed transition-colors duration-150 ease-out
          flex flex-col items-center justify-center py-16 px-6 cursor-pointer select-none
          ${disabled 
            ? 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed' 
            : isDragging 
              ? 'border-brand-primary bg-brand-primary/5' 
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
          }
      `}>
        
        <div className={`
          p-3 rounded-lg mb-4 transition-colors duration-150
          ${isDragging 
            ? 'bg-brand-primary/10 text-brand-primary' 
            : 'bg-slate-100 text-slate-400 group-hover:text-slate-600 group-hover:bg-slate-200'
          }
        `}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-slate-700">
             <span className="text-brand-primary hover:underline">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-400">
            Source Code or Text Files (Max 10MB)
          </p>
        </div>
      </div>
    </div>
  );
};