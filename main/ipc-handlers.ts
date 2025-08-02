import { ipcMain } from 'electron';
import * as electronLog from 'electron-log';
import { WindowManager } from './window-manager';
import { FileHandler } from './file-handler';
import { LLMService } from './llm-service';
import { IpcChannels, DEFAULT_SETTINGS } from './constants';
import Store from 'electron-store';

// Define settings store schema
interface SettingsSchema {
  llmProvider?: string;
  apiKeys?: Record<string, string>;
  autoSave?: boolean;
  autoSaveInterval?: number;
  theme?: string;
  fontSize?: number;
  [key: string]: any;
}

// File handler instance
const fileHandler = new FileHandler();

// LLM service instance
const llmService = new LLMService();

// Settings store with proper typing
const settingsStore = new Store<SettingsSchema>({
  name: 'settings',
  defaults: DEFAULT_SETTINGS
});

// S1: Set up IPC communication handlers
// Registers all IPC handlers for main process
export function setupIPC(windowManager: WindowManager): void {
  // File operations
  registerFileHandlers(windowManager);
  
  // LLM operations
  registerLLMHandlers();
  
  // Settings operations
  registerSettingsHandlers();
  
  electronLog.info('IPC handlers registered');
}

// S2: Register file operation handlers
// Sets up handlers for file operations
function registerFileHandlers(windowManager: WindowManager): void {
  // Create new file
  ipcMain.handle(IpcChannels.FILE_NEW, () => {
    try {
      return fileHandler.newFile();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Error creating new file:', errorMessage);
      throw error;
    }
  });
  
  // Open file
  ipcMain.handle(IpcChannels.FILE_OPEN, (_event, path?: string) => {
    try {
      const mainWindow = windowManager.getWindow('main');
      if (!mainWindow) {
        throw new Error('Main window not found');
      }
      
      return fileHandler.openFile(mainWindow, path);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Error opening file:', errorMessage);
      throw error;
    }
  });
  
  // Save file
  ipcMain.handle(IpcChannels.FILE_SAVE, (_event, content: string) => {
    try {
      const mainWindow = windowManager.getWindow('main');
      if (!mainWindow) {
        throw new Error('Main window not found');
      }
      
      return fileHandler.saveFile(mainWindow, content);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Error saving file:', errorMessage);
      throw error;
    }
  });
  
  // Save file as
  ipcMain.handle(IpcChannels.FILE_SAVE_AS, (_event, content: string) => {
    try {
      const mainWindow = windowManager.getWindow('main');
      if (!mainWindow) {
        throw new Error('Main window not found');
      }
      
      return fileHandler.saveFileAs(mainWindow, content);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Error saving file as:', errorMessage);
      throw error;
    }
  });
  
  // Get recent files
  ipcMain.handle(IpcChannels.GET_RECENT_FILES, () => {
    try {
      return fileHandler.getRecentFiles();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Error getting recent files:', errorMessage);
      throw error;
    }
  });
}

// S3: Register LLM operation handlers
// Sets up handlers for LLM operations
function registerLLMHandlers(): void {
  // Check grammar
  ipcMain.handle(IpcChannels.AI_CHECK_GRAMMAR, (_event, data: { text: string, language?: string }) => {
    try {
      // Validate input
      if (!data || !data.text) {
        throw new Error('Invalid input for grammar check');
      }
      
      return llmService.checkGrammar(data.text, data.language);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Error checking grammar:', errorMessage);
      throw error;
    }
  });
  
  // Rephrase text
  ipcMain.handle(IpcChannels.AI_REPHRASE_TEXT, (_event, data: { text: string, style?: string }) => {
    try {
      // Validate input
      if (!data || !data.text) {
        throw new Error('Invalid input for text rephrasing');
      }
      
      return llmService.rephraseText(data.text, data.style);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Error rephrasing text:', errorMessage);
      throw error;
    }
  });
}

// S4: Register settings handlers
// Sets up handlers for settings operations
function registerSettingsHandlers(): void {
  // Get settings
  ipcMain.handle(IpcChannels.SETTINGS_GET, () => {
    try {
      return (settingsStore as any).store;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Error getting settings:', errorMessage);
      throw error;
    }
  });
  
  // Save settings
  ipcMain.handle(IpcChannels.SETTINGS_SAVE, (_event, settings: SettingsSchema) => {
    try {
      // Validate settings
      if (!settings || typeof settings !== 'object') {
        throw new Error('Invalid settings object');
      }
      
      // Update settings - use Object.assign to merge with current store
      Object.assign((settingsStore as any).store, settings);
      
      // Update LLM provider if changed
      if (settings.llmProvider) {
        llmService.initialize(settings.llmProvider, settings.apiKeys || {});
      }
      
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Error saving settings:', errorMessage);
      throw error;
    }
  });
}
