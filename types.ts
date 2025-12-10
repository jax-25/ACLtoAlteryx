

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
