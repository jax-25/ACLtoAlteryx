import React, { useRef, useState } from 'react';

interface FileUploaderProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ file, onFileSelect, onClear, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !file) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || file) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };
  
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  if (file) {
    return (
      <div className="relative p-4 bg-zinc-50 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center ring-1 ring-zinc-200">
             <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div className="overflow-hidden">
             <p className="text-sm font-medium text-zinc-800 truncate" title={file.name}>{file.name}</p>
             <p className="text-xs text-zinc-400">{formatBytes(file.size)}</p>
          </div>
        </div>
         <button 
           onClick={onClear} 
           disabled={disabled}
           className="ml-2 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 transition-colors disabled:opacity-50"
           aria-label="Clear file"
         >
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    )
  }

  return (
    <div
      className="w-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleChange}
        className="hidden"
        accept=".txt,.conf,.cfg,.acl,.py,.js,.csv"
        disabled={disabled}
      />
      
      <div 
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          relative rounded-xl border-2 border-dashed transition-colors duration-150 ease-out
          flex flex-col items-center justify-center py-8 px-4 cursor-pointer select-none
          ${disabled 
            ? 'border-zinc-200 bg-zinc-100 opacity-60 cursor-not-allowed' 
            : isDragging 
              ? 'border-brand-primary bg-brand-primary/5' 
              : 'border-zinc-300 bg-white hover:border-brand-primary'
          }
      `}>
        
        <div className={`
          p-2 rounded-lg mb-3 transition-colors duration-150
          ${isDragging 
            ? 'bg-brand-primary/10 text-brand-primary' 
            : 'bg-zinc-100 text-zinc-500'
          }
        `}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        
        <div className="text-center space-y-1">
          <p className="text-xs font-medium text-zinc-700">
             <span className="text-brand-primary font-semibold">Upload file</span> or drag & drop
          </p>
          <p className="text-[11px] text-zinc-400">
            Script or Sample CSV
          </p>
        </div>
      </div>
    </div>
  );
};