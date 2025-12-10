import React, { useState, useCallback, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { CodeViewer } from './components/CodeViewer';
import { Button } from './components/Button';
import { Terminal } from './components/Terminal';
import { WorkflowNode } from './components/WorkflowNode';
import { parseAclToCanonicalJson, getSchemaFromSample } from './services/geminiService';
import { convertJsonToXml } from './services/xmlConverter';
import { AppStatus, ProcessingResult, ErrorState, ProcessingStep, LogEntry, InputNode, OutputNode, SchemaField, CanonicalWorkflow } from './types';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [step, setStep] = useState<ProcessingStep>(ProcessingStep.IDLE);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [mainScriptFile, setMainScriptFile] = useState<File | null>(null);
  const [isReadyToProcess, setIsReadyToProcess] = useState(false);
  const [isLoadingSchema, setIsLoadingSchema] = useState<Record<number, boolean>>({});

  const [inputNodes, setInputNodes] = useState<InputNode[]>([
    { id: 1, file: null, schema: null, name: 'Input Data' }
  ]);
  const [outputNode, setOutputNode] = useState<OutputNode>({
    id: 'out1', name: 'Output Data', fileName: ''
  });

  useEffect(() => {
    const isReady = 
      inputNodes.some(n => n.file && n.schema) &&
      mainScriptFile !== null &&
      outputNode.fileName.trim() !== '';
    setIsReadyToProcess(isReady);
  }, [inputNodes, mainScriptFile, outputNode]);

  const addLog = (level: LogEntry['level'], message: string) => {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      level,
      message,
    };
    setLogs(prev => [...prev, entry]);
  };
  
  const handleMainScriptSelect = (file: File) => {
    setMainScriptFile(file);
    addLog('INFO', `Main script "${file.name}" loaded.`);
  };

  const handleClearMainScript = () => {
    setMainScriptFile(null);
  }

  const handleInputSampleSelect = (file: File, nodeId: number) => {
    setIsLoadingSchema(prev => ({ ...prev, [nodeId]: true }));
    setInputNodes(prev => prev.map(node => node.id === nodeId ? { ...node, file, name: file.name, schema: null } : node));
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      try {
        addLog('INFO', `Analyzing schema for "${file.name}"...`);
        const inferredSchema = await getSchemaFromSample(text);
        setInputNodes(prev => prev.map(node => 
          node.id === nodeId ? { ...node, schema: inferredSchema } : node
        ));
        addLog('SUCCESS', `Schema for "${file.name}" inferred successfully.`);
      } catch (err) {
        addLog('ERROR', `Schema inference failed for "${file.name}".`);
        handleClearInputSample(nodeId);
      } finally {
        setIsLoadingSchema(prev => ({ ...prev, [nodeId]: false }));
      }
    };
    reader.readAsText(file);
  };

  const handleClearInputSample = (nodeId: number) => {
    setInputNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, file: null, name: 'Input Data', schema: null } : node
    ));
  }
  
  const handleProcessing = useCallback(async () => {
    if (!mainScriptFile) return;

    setStatus(AppStatus.PROCESSING);
    setStep(ProcessingStep.READING);
    setError(null);
    setLogs([]);
    
    addLog('SYSTEM', 'Migration Engine initializing...');
    addLog('INFO', `Mounting source script: ${mainScriptFile.name} (${(mainScriptFile.size/1024).toFixed(2)} KB)`);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      
      if (typeof text === 'string' && text.length > 0) {
        try {
          const schemas = inputNodes.reduce((acc, node) => {
            if (node.file && node.schema) {
              acc[node.file.name] = node.schema;
            }
            return acc;
          }, {} as Record<string, SchemaField[] | null>);

          setStep(ProcessingStep.PARSING_JSON);
          addLog('INFO', 'Phase 1: Analyzing logic & mapping to Canonical JSON...');
          addLog('SYSTEM', 'Streaming data to Gemini-2.5-Flash (JSON Mode)...');
          
          const jsonOutput = await parseAclToCanonicalJson(text, mainScriptFile.name, schemas);
          
          addLog('SUCCESS', 'Canonical JSON graph generated successfully.');
          setStep(ProcessingStep.JSON_SUCCESS);

          await new Promise(r => setTimeout(r, 1000));

          setStep(ProcessingStep.CONVERTING_XML);
          addLog('INFO', 'Phase 2: Deterministically converting JSON to .yxmd XML...');
          
          const canonicalWorkflow: CanonicalWorkflow = JSON.parse(jsonOutput);
          const xmlOutput = convertJsonToXml(canonicalWorkflow); 
          
          addLog('SUCCESS', 'Workflow file successfully compiled.');
          
          setResult({
            fileName: mainScriptFile.name,
            xmlContent: xmlOutput,
            jsonContent: jsonOutput,
            originalSize: mainScriptFile.size,
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
         addLog('ERROR', 'Script file appears to be empty or unreadable.');
         setError({ message: "File is empty or could not be read." });
      }
    };
    reader.onerror = () => {
      setStatus(AppStatus.ERROR);
      addLog('ERROR', 'File read permission denied or corrupted.');
      setError({ message: "Failed to read file contents." });
    };
    
    setTimeout(() => reader.readAsText(mainScriptFile), 500);

  }, [mainScriptFile, inputNodes]);

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setStep(ProcessingStep.IDLE);
    setResult(null);
    setError(null);
    setLogs([]);
    setMainScriptFile(null);
    setInputNodes([{ id: 1, file: null, schema: null, name: 'Input Data' }]);
    setOutputNode({ id: 'out1', name: 'Output Data', fileName: '' });
    setIsReadyToProcess(false);
  };
  
  const addInputNode = () => {
    setInputNodes(prev => [...prev, { id: Date.now(), file: null, schema: null, name: 'Input Data'}]);
  };

  const removeInputNode = (id: number) => {
    setInputNodes(prev => prev.filter(node => node.id !== id));
  };

  const renderSuccessView = () => (
     result && (
        <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
          <div className="lg:col-span-4">
              <div className="p-6 rounded-2xl bg-white shadow-soft-xl ring-1 ring-zinc-900/5 space-y-6">
                <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">Migration Complete</p>
                  <p className="text-xs text-zinc-500">Workflow is ready for Alteryx Designer</p>
                </div>
              </div>
              <Button variant="secondary" onClick={handleReset} className="w-full justify-center">Process Another File</Button>
            </div>
          </div>
          <div className="lg:col-span-8">
            <div className="h-[700px] shadow-soft-2xl rounded-2xl overflow-hidden ring-1 ring-zinc-900/10 bg-white">
              <CodeViewer code={result.xmlContent} fileName={result.fileName} />
            </div>
          </div>
        </div>
      )
  );

  return (
    <div className="min-h-screen flex flex-col font-sans bg-zinc-50 selection:bg-brand-primary/10 selection:text-brand-primary">
      
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-zinc-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
               <div className="w-9 h-9 bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white rounded-lg shadow-sm">
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-zinc-900 leading-none">Workflow Migrator</h1>
                <p className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase mt-0.5">Community Edition</p>
              </div>
            </div>
             <div className="flex items-center gap-2 px-3 py-1 bg-zinc-50 border border-zinc-200/60 rounded-full shadow-sm">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
              <span className="text-[10px] font-semibold text-zinc-600 tracking-wide">SYSTEM_READY</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 flex flex-col">
        {status !== AppStatus.SUCCESS && (
          <div className="flex flex-col items-center text-center mb-10 max-w-3xl mx-auto">
             <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 tracking-tight mb-4">Script to Workflow</h2>
            <p className="text-lg text-zinc-600 leading-relaxed max-w-2xl mx-auto font-light">
              Automated translation of code and legacy scripts into modern <br/>
              <span className="font-semibold text-brand-primary">Visual Workflows (.yxmd)</span>.
            </p>
          </div>
        )}

        {status === AppStatus.SUCCESS ? (
          renderSuccessView()
        ) : (
          <div className="relative">
            {/* Setup View Container - Fades out */}
            <div className={`transition-opacity duration-500 ease-in-out ${status === AppStatus.IDLE ? 'opacity-100' : 'opacity-0'}`}>
              <div className="relative dot-grid -m-6 p-6 rounded-3xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* --- Column 1: Inputs --- */}
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">1. Provide Input Samples</p>
                    {inputNodes.map(node => (
                      <WorkflowNode 
                        key={node.id} 
                        title={node.file ? node.file.name : 'Input Data'} 
                        icon="input" 
                        schema={node.schema}
                        isLoadingSchema={isLoadingSchema[node.id]}
                        isRemovable={inputNodes.length > 1}
                        onRemove={() => removeInputNode(node.id)}
                        isComplete={!!node.file && !!node.schema}
                      >
                        <FileUploader 
                          file={node.file}
                          onFileSelect={(file) => handleInputSampleSelect(file, node.id)} 
                          onClear={() => handleClearInputSample(node.id)}
                          disabled={status === AppStatus.PROCESSING} 
                        />
                      </WorkflowNode>
                    ))}
                    <Button size="sm" variant="ghost" onClick={addInputNode} className="w-full" disabled={status === AppStatus.PROCESSING}>+ Add Input</Button>
                  </div>

                  {/* --- Column 2: Main Script --- */}
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">2. Upload Main Script</p>
                    <WorkflowNode 
                      title={mainScriptFile ? mainScriptFile.name : 'Main Script'} 
                      icon="input" 
                      isComplete={!!mainScriptFile}
                    >
                      <FileUploader 
                        file={mainScriptFile}
                        onFileSelect={handleMainScriptSelect} 
                        onClear={handleClearMainScript}
                        disabled={status === AppStatus.PROCESSING}
                      />
                    </WorkflowNode>
                  </div>

                  {/* --- Column 3: Output --- */}
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">3. Configure Output</p>
                    <WorkflowNode 
                      title={outputNode.name} 
                      icon="output" 
                      isComplete={outputNode.fileName.trim() !== ''}
                    >
                      <div className="p-4 bg-zinc-50 rounded-lg">
                        <label htmlFor="output-filename" className="text-xs font-medium text-zinc-500">Filename</label>
                        <div className="relative mt-1">
                          <input
                            id="output-filename"
                            type="text"
                            value={outputNode.fileName}
                            onChange={(e) => setOutputNode(prev => ({...prev, fileName: e.target.value}))}
                            className="block w-full text-sm px-3 py-2 bg-white border border-zinc-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            placeholder="e.g. final_summary.yxdb"
                            disabled={status === AppStatus.PROCESSING}
                          />
                        </div>
                      </div>
                    </WorkflowNode>
                  </div>
                </div>
              </div>
              <div className="mt-10 flex flex-col items-center">
                <Button size="lg" onClick={handleProcessing} disabled={!isReadyToProcess}>
                  Generate Workflow
                </Button>
              </div>
            </div>

            {/* Processing View Container - Fades in on top */}
            <div className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${status !== AppStatus.IDLE ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="w-full max-w-4xl mx-auto pt-6">
                    <Terminal logs={logs} />
                    {status === AppStatus.ERROR && (
                      <div className="mt-4 text-center">
                        <Button variant="ghost" size="sm" onClick={handleReset} className="w-auto text-red-700 hover:bg-red-50">Reset System</Button>
                      </div>
                    )}
                </div>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full py-6 mt-auto border-t border-zinc-200/60 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-zinc-400 uppercase tracking-widest">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-zinc-400"></div><p className="font-semibold text-zinc-500">Workflow Migrator</p></div>
          <div className="flex space-x-6 font-mono opacity-80"><span>MIT License</span><span>Ver 3.0.0</span></div>
        </div>
      </footer>
    </div>
  );
};

export default App;