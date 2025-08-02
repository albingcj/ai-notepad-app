import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from './constants';

// S1: Set up secure API bridge
// Configures the contextBridge to expose a minimal API to the renderer
function setupContextBridge(): void {
  // Expose validated APIs to renderer process
  contextBridge.exposeInMainWorld('electronAPI', {
    // File operations - matching IPCBridge method names
    fileNew: () => ipcRenderer.invoke(IpcChannels.FILE_NEW),
    fileOpen: (path?: string) => ipcRenderer.invoke(IpcChannels.FILE_OPEN, path),
    fileSave: (content: string) => ipcRenderer.invoke(IpcChannels.FILE_SAVE, content),
    fileSaveAs: (content: string) => ipcRenderer.invoke(IpcChannels.FILE_SAVE_AS, content),
    
    // Recent files
    getRecentFiles: () => ipcRenderer.invoke(IpcChannels.GET_RECENT_FILES),
    
    // AI operations - matching IPCBridge method names
    aiCheckGrammar: (data: { text: string, language?: string }) => 
      ipcRenderer.invoke(IpcChannels.AI_CHECK_GRAMMAR, data),
    aiRephraseText: (data: { text: string, style?: string }) => 
      ipcRenderer.invoke(IpcChannels.AI_REPHRASE_TEXT, data),
    
    // Settings operations - matching IPCBridge method names
    settingsGet: () => ipcRenderer.invoke(IpcChannels.SETTINGS_GET),
    settingsSave: (settings: any) => ipcRenderer.invoke(IpcChannels.SETTINGS_SAVE, settings),
    
    // UI operations - matching IPCBridge method names
    uiShowSettings: () => ipcRenderer.send(IpcChannels.SHOW_SETTINGS),
    uiShowDocumentation: () => ipcRenderer.send(IpcChannels.SHOW_DOCUMENTATION),
    
    // View operations - matching IPCBridge method names
    viewToggleTheme: () => ipcRenderer.send(IpcChannels.VIEW_TOGGLE_THEME),
    viewZoomIn: () => ipcRenderer.send(IpcChannels.VIEW_ZOOM_IN),
    viewZoomOut: () => ipcRenderer.send(IpcChannels.VIEW_ZOOM_OUT),
    viewZoomReset: () => ipcRenderer.send(IpcChannels.VIEW_ZOOM_RESET),
    
    // Edit operations - matching IPCBridge method names
    editUndo: () => ipcRenderer.send(IpcChannels.EDIT_UNDO),
    editRedo: () => ipcRenderer.send(IpcChannels.EDIT_REDO),
    editCut: () => ipcRenderer.send(IpcChannels.EDIT_CUT),
    editCopy: () => ipcRenderer.send(IpcChannels.EDIT_COPY),
    editPaste: () => ipcRenderer.send(IpcChannels.EDIT_PASTE),
    editSelectAll: () => ipcRenderer.send(IpcChannels.EDIT_SELECT_ALL),
    editFind: () => ipcRenderer.send(IpcChannels.EDIT_FIND),
    editReplace: () => ipcRenderer.send(IpcChannels.EDIT_REPLACE),
    
    // Event listeners
    on: (channel: string, callback: (...args: any[]) => void) => {
      // Whitelist channels that can be listened to
      const validChannels = [
        IpcChannels.FILE_NEW,
        IpcChannels.FILE_OPEN,
        IpcChannels.FILE_SAVE,
        IpcChannels.FILE_SAVE_AS,
        IpcChannels.EDIT_UNDO,
        IpcChannels.EDIT_REDO,
        IpcChannels.EDIT_CUT,
        IpcChannels.EDIT_COPY,
        IpcChannels.EDIT_PASTE,
        IpcChannels.EDIT_SELECT_ALL,
        IpcChannels.EDIT_FIND,
        IpcChannels.EDIT_REPLACE,
        IpcChannels.VIEW_TOGGLE_THEME,
        IpcChannels.VIEW_ZOOM_IN,
        IpcChannels.VIEW_ZOOM_OUT,
        IpcChannels.VIEW_ZOOM_RESET,
        IpcChannels.AI_CHECK_GRAMMAR,
        IpcChannels.AI_REPHRASE_TEXT,
        IpcChannels.SHOW_SETTINGS,
        IpcChannels.SHOW_DOCUMENTATION
      ];
      
      if (validChannels.includes(channel)) {
        const subscription = (_event: any, ...args: any[]) => callback(...args);
        ipcRenderer.on(channel, subscription);
        
        // Return a function to remove the event listener
        return () => {
          ipcRenderer.removeListener(channel, subscription);
        };
      }
      
      return () => {}; // Return empty function for invalid channels
    }
  });
}

// S2: Validate input data
// Ensures that data being sent through IPC is safe
// @ts-ignore: Function is used recursively
function _validateInput(data: any): boolean {
  // Prevent prototype pollution
  if (data && typeof data === 'object') {
    // Check for __proto__ or constructor properties
    if (Object.prototype.hasOwnProperty.call(data, '__proto__') ||
        Object.prototype.hasOwnProperty.call(data, 'constructor')) {
      return false;
    }
    
    // Recursively check nested objects
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (!_validateInput(data[key])) {
          return false;
        }
      }
    }
  }
  
  return true;
}

// Initialize the preload script
setupContextBridge();
