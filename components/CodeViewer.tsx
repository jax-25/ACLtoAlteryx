import React, { useState } from 'react';

interface CodeViewerProps {
  code: string;
  fileName: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, fileName }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Changed to .yxmd for Alteryx Workflow
    a.download = `${fileName.split('.')[0]}_workflow.yxmd`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#18181b] text-slate-300">
      {/* Window Title Bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#09090b]">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5 mr-4">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          </div>
          <span className="text-xs font-medium text-slate-400 select-none">
            XML Preview — {fileName.split('.')[0]}.yxmd
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCopy}
            className="text-xs font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-white/5 flex items-center gap-1.5"
          >
            {copied ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Copied
              </span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                Copy XML
              </>
            )}
          </button>
          <div className="h-4 w-px bg-white/10"></div>
          <button 
            onClick={handleDownload}
            className="text-xs font-medium text-white bg-brand-primary hover:bg-brand-secondary transition-all px-4 py-1.5 rounded-md shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download .yxmd
          </button>
        </div>
      </div>
      
      {/* Editor Area */}
      <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-[#18181b] relative group">
        <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-[#18181b] to-transparent pointer-events-none z-10"></div>
        <pre className="font-mono text-[13px] leading-7 text-slate-300 selection:bg-brand-primary/30 selection:text-white">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};