import React, { useState, useCallback, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { CodeViewer } from './components/CodeViewer';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { Terminal } from './components/Terminal';
import { generateAclXml, parseAclToJson } from './services/geminiService';
import { AppStatus, ProcessingResult, ErrorState, ProcessingStep, LogEntry } from './types';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [step, setStep] = useState<ProcessingStep>(ProcessingStep.IDLE);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [tempJson, setTempJson] = useState<string | null>(null);

  const addLog = (level: LogEntry['level'], message: string) => {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      level,
      message,
    };
    setLogs(prev => [...prev, entry]);
  };

  const handleDownloadJson = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.split('.')[0]}_graph_ir.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog('INFO', `JSON artifact downloaded: ${filename.split('.')[0]}_graph_ir.json`);
  };

  const handleFileSelect = useCallback(async (file: File) => {
    setStatus(AppStatus.PROCESSING);
    setStep(ProcessingStep.READING);
    setError(null);
    setLogs([]);
    setTempJson(null);
    
    addLog('SYSTEM', 'Migration Engine initializing...');
    addLog('INFO', `Mounting source file: ${file.name} (${(file.size/1024).toFixed(2)} KB)`);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      
      if (typeof text === 'string' && text.length > 0) {
        try {
          // --- Step 1: Parse to Alteryx JSON ---
          setStep(ProcessingStep.PARSING_JSON);
          addLog('INFO', 'Phase 1: Analyzing logic & mapping to Workflow Nodes...');
          addLog('SYSTEM', 'Streaming data to Gemini-2.5-Flash (Graph Mode)...');
          
          // Actual AI Call for JSON
          const jsonOutput = await parseAclToJson(text, file.name);
          setTempJson(jsonOutput);
          
          addLog('SUCCESS', 'Graph JSON generated successfully.');
          setStep(ProcessingStep.JSON_SUCCESS);

          // User readable delay
          await new Promise(r => setTimeout(r, 2000));

          // --- Step 2: Convert to Alteryx XML ---
          setStep(ProcessingStep.CONVERTING_XML);
          addLog('INFO', 'Phase 2: Generating .yxmd XML structure...');
          addLog('SYSTEM', 'Calculating Node positions and wiring connections...');

          // Actual AI Call for XML (Using the JSON from Step 1)
          const xmlOutput = await generateAclXml(jsonOutput); 
          
          addLog('SUCCESS', 'Workflow file successfully compiled.');
          
          setResult({
            fileName: file.name,
            xmlContent: xmlOutput,
            jsonContent: jsonOutput,
            originalSize: file.size,
          });
          setStep(ProcessingStep.COMPLETE);
          setStatus(AppStatus.SUCCESS);

        } catch (err: any) {
          console.error(err);
          setStatus(AppStatus.ERROR);
          addLog('ERROR', `Migration critical failure: ${err.message}`);
          setError({
            message: "Workflow generation failed.",
            details: err.message || "Unknown error occurred with the AI service."
          });
        }
      } else {
         setStatus(AppStatus.ERROR);
         addLog('ERROR', 'File appears to be empty or unreadable.');
         setError({ message: "File is empty or could not be read." });
      }
    };
    
    reader.onerror = () => {
      setStatus(AppStatus.ERROR);
      addLog('ERROR', 'File read permission denied or corrupted.');
      setError({ message: "Failed to read file contents." });
    };
    
    // Slight artificial delay for "Reading" visual
    setTimeout(() => reader.readAsText(file), 800);

  }, []);

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setStep(ProcessingStep.IDLE);
    setResult(null);
    setError(null);
    setLogs([]);
    setTempJson(null);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-zinc-50 selection:bg-brand-primary/10 selection:text-brand-primary">
      
      {/* Header */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-zinc-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
              <div className="w-9 h-9 bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white rounded-lg shadow-sm">
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                 </svg>
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-zinc-900 leading-none">Workflow Migrator</h1>
                <p className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase mt-0.5">Community Edition</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-50 border border-zinc-200/60 rounded-full shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-semibold text-zinc-600 tracking-wide">SYSTEM_READY</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center w-full max-w-7xl mx-auto px-6 py-12 relative">
        
        {/* Background Decorative Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-3xl -z-10 opacity-60 pointer-events-none"></div>

        {/* Hero Section */}
        <div className={`transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col items-center text-center mb-10 max-w-3xl mx-auto ${status === AppStatus.SUCCESS ? 'opacity-0 h-0 overflow-hidden mb-0' : 'opacity-100'}`}>
          <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 tracking-tight mb-4">
            Script to Workflow
          </h2>
          <p className="text-lg text-zinc-600 leading-relaxed max-w-2xl mx-auto font-light">
            Automated translation of code and legacy scripts into modern <br/>
            <span className="font-semibold text-brand-primary">Visual Workflows (.yxmd)</span>.
          </p>
        </div>

        {/* Interaction Stage */}
        <div className={`w-full transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${status === AppStatus.SUCCESS ? 'max-w-7xl' : 'max-w-2xl'}`}>
          
          <div className={`grid grid-cols-1 ${status === AppStatus.SUCCESS ? 'lg:grid-cols-12 gap-8' : 'gap-0'}`}>
            
            {/* Left Panel: Upload / Control / Terminal */}
            <div className={`${status === AppStatus.SUCCESS ? 'lg:col-span-4' : 'w-full'} transition-all duration-500`}>
              <Card 
                className={`h-full border-0 ring-1 ring-zinc-900/5 ${status === AppStatus.SUCCESS ? 'bg-white shadow-soft-xl' : 'bg-white/80 backdrop-blur shadow-soft-2xl'}`}
                title={status === AppStatus.SUCCESS ? "Workflow Details" : undefined}
              >
                <div className="flex flex-col space-y-6">
                  
                  {/* File Uploader - Only visible when IDLE */}
                  {status === AppStatus.IDLE && (
                     <FileUploader 
                       onFileSelect={handleFileSelect} 
                     />
                  )}

                  {/* Terminal - Visible during Processing and Error */}
                  {(status === AppStatus.PROCESSING || status === AppStatus.ERROR) && (
                    <div className="space-y-4">
                      <Terminal logs={logs} />
                      
                      {/* Intermediate Success State for JSON (No Download Button) */}
                      {(step === ProcessingStep.JSON_SUCCESS || step === ProcessingStep.CONVERTING_XML) && tempJson && (
                         <div className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-lg bg-emerald-50 border border-emerald-100 p-3 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-emerald-100 rounded-full ring-1 ring-emerald-200">
                                  <svg className="w-3.5 h-3.5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <span className="text-xs font-semibold text-emerald-900">Graph JSON Generated</span>
                            </div>
                            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide px-2 py-0.5 bg-white rounded border border-emerald-200">
                              Verified
                            </div>
                         </div>
                      )}
                    </div>
                  )}

                  {/* Error State Controls */}
                  {status === AppStatus.ERROR && (
                    <div className="mt-4">
                       <Button variant="ghost" size="sm" onClick={handleReset} className="w-full text-red-700 hover:bg-red-50">
                          Reset System
                       </Button>
                    </div>
                  )}

                  {/* Success Sidebar Content */}
                  {status === AppStatus.SUCCESS && result && (
                    <div className="space-y-6 animate-in fade-in duration-500 delay-150">
                       <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-5 space-y-4">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-zinc-900">Migration Complete</p>
                              <p className="text-xs text-zinc-500">Ready for Designer</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 pt-2 border-t border-zinc-200/50">
                             <div className="flex justify-between text-xs py-1.5">
                               <span className="text-zinc-500">Source</span>
                               <span className="font-medium text-zinc-700 truncate max-w-[120px]" title={result.fileName}>{result.fileName}</span>
                             </div>
                             <div className="flex justify-between text-xs py-1.5">
                               <span className="text-zinc-500">Size</span>
                               <span className="font-medium text-zinc-700">{(result.originalSize / 1024).toFixed(2)} KB</span>
                             </div>
                          </div>

                          <div className="pt-2 flex flex-col gap-2">
                             {/* Small button to download intermediate JSON if needed in final state */}
                             <button 
                               onClick={() => handleDownloadJson(result.jsonContent, result.fileName)}
                               className="w-full flex items-center justify-between px-3 py-2 bg-white border border-zinc-200 rounded-lg hover:border-brand-primary/50 hover:shadow-sm transition-all text-xs font-medium text-zinc-600 group"
                             >
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
                                  Graph JSON (IR)
                                </div>
                                <svg className="w-4 h-4 text-zinc-400 group-hover:text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                             </button>
                             <div className="flex items-center gap-2 px-3 py-2 bg-brand-primary/5 border border-brand-primary/20 rounded-lg text-xs font-medium text-brand-primary">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                                .yxmd Workflow Generated
                             </div>
                          </div>
                       </div>
                       
                       <Button variant="secondary" onClick={handleReset} className="w-full justify-center">
                         Process Another File
                       </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Panel: Result View */}
            {status === AppStatus.SUCCESS && result && (
              <div className="lg:col-span-8 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-forwards">
                <div className="h-[700px] shadow-soft-2xl rounded-2xl overflow-hidden ring-1 ring-zinc-900/10 bg-white">
                  <CodeViewer code={result.xmlContent} fileName={result.fileName} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 mt-auto border-t border-zinc-200/60 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-zinc-400 uppercase tracking-widest">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-sm bg-zinc-400"></div>
             <p className="font-semibold text-zinc-500">Workflow Migrator</p>
          </div>
          <div className="flex space-x-6 font-mono opacity-80">
            <span>MIT License</span>
            <span>Ver 2.3.0</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;