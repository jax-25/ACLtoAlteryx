
export interface CanonicalWorkflow {
  workflow: {
    version: string;
    source: string;
    schema_version: string;
  };
  nodes: CanonicalNode[];
  connections: CanonicalConnection[];
  unmapped_acl: string[];
}

export interface CanonicalNode {
  node_id: string; // e.g. "N1", "N2"
  schema_id: string; // e.g. "Input", "Filter", "Summarize"
  acl_source: string;
  config: Record<string, any>;
}

export interface CanonicalConnection {
  from: string; // "N1"
  to: string; // "N2"
}


export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export enum ProcessingStep {
  IDLE = 'IDLE',
  READING = 'READING',
  PARSING_JSON = 'PARSING_JSON',
  JSON_SUCCESS = 'JSON_SUCCESS',
  CONVERTING_XML = 'CONVERTING_XML',
  COMPLETE = 'COMPLETE'
}

export interface ProcessingResult {
  fileName: string;
  xmlContent: string;
  jsonContent: string;
  originalSize: number;
}

export interface ErrorState {
  message: string;
  details?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'SYSTEM';
  message: string;
}

export interface SchemaField {
  name: string;
  type: string;
}

export interface InputNode {
  id: number;
  file: File | null;
  schema: SchemaField[] | null;
  name: string;
}

export interface OutputNode {
  id: string;
  name: string;
  fileName: string;
}