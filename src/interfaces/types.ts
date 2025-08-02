// File data interface
export interface FileData {
  path: string;
  content: string;
  saved: boolean;
  lastModified: Date;
}

// Window state interface
export interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

// LLM request interface
export interface LLMRequest {
  text: string;
  operation: string;
  style?: string;
  language?: string;
}

// LLM response interface
export interface LLMResponse {
  original: string;
  suggestions: Array<{
    text: string;
    confidence: number;
    type: string;
  }>;
  error?: string;
}

// Text selection interface
export interface TextSelection {
  start: number;
  end: number;
  text: string;
}

// Theme type
export type Theme = 'light' | 'dark' | 'system';

// Application settings interface
export interface AppSettings {
  theme: string;
  autoSaveInterval: number;
  fontSize: number;
  wordWrap: boolean;
  defaultLanguage: string;
  llmProvider: string;
  apiKeys: Record<string, string>;
}
