export interface ElectronAPI {
  // File operations
  fileNew: () => Promise<void>;
  fileOpen: (path?: string) => Promise<{ path: string; content: string; } | null>;
  fileSave: (content: string) => Promise<string | null>;
  fileSaveAs: (content: string) => Promise<string | null>;
  getRecentFiles: () => Promise<string[]>;
  
  // Settings operations
  settingsGet: () => Promise<any>;
  settingsSave: (settings: any) => Promise<void>;
  
  // AI operations
  aiCheckGrammar: (data: { text: string; language?: string }) => Promise<string>;
  aiRephraseText: (data: { text: string; style?: string }) => Promise<string>;
  
  // UI operations
  uiShowSettings: () => void;
  uiShowDocumentation: () => void;
  
  // View operations
  viewToggleTheme: () => void;
  viewZoomIn: () => void;
  viewZoomOut: () => void;
  viewZoomReset: () => void;
  
  // Edit operations
  editUndo: () => void;
  editRedo: () => void;
  editCut: () => void;
  editCopy: () => void;
  editPaste: () => void;
  editSelectAll: () => void;
  editFind: () => void;
  editReplace: () => void;
  
  // Event listeners
  on: (channel: string, callback: (...args: any[]) => void) => () => void;
  
  // Index signature for dynamic method access
  [key: string]: any;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
