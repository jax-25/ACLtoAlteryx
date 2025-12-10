import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalProps {
  logs: LogEntry[];
  className?: string;
}

export const Terminal: React.FC<TerminalProps> = ({ logs, className = '' }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'INFO': return 'text-blue-400';
      case 'SUCCESS': return 'text-emerald-400';
      case 'WARN': return 'text-amber-400';
      case 'ERROR': return 'text-red-400';
      case 'SYSTEM': return 'text-slate-500';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className={`rounded-xl overflow-hidden bg-[#18181b] border border-white/10 shadow-2xl font-mono text-xs ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#27272a] border-b border-white/5">
        <div className="flex items-center gap-2">
          <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
          </svg>
          <span className="text-slate-400 font-medium">migration_engine — process_monitor</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-white/10"></div>
        </div>
      </div>

      {/* Logs Area */}
      <div className="p-4 h-[250px] overflow-y-auto custom-scrollbar bg-[#18181b] text-slate-300 space-y-2">
        {logs.length === 0 && (
          <div className="text-slate-600 italic">Waiting for input stream...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
            <span className={`font-bold shrink-0 w-16 ${getLevelColor(log.level)}`}>{log.level}</span>
            <span className="break-all">{log.message}</span>
          </div>
        ))}
        {/* Blinking Cursor */}
        <div className="flex items-center gap-2 mt-2" ref={bottomRef}>
          <span className="text-emerald-500 font-bold">{'>'}</span>
          <span className="w-2 h-4 bg-emerald-500/50 animate-pulse"></span>
        </div>
      </div>
    </div>
  );
};