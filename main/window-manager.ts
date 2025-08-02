import { BrowserWindow, screen } from 'electron';
import * as electronLog from 'electron-log';
import Store from 'electron-store';
import isDev from 'electron-is-dev';

// Define window state interface
interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

// Define store schema with proper typing
interface StoreSchema {
  windowStates: Record<string, WindowState>;
}

const schema = {
  windowStates: {
    type: 'object' as const,
    default: {}
  }
};

export class WindowManager {
  private windows: Map<string, BrowserWindow>;
  private store: Store<StoreSchema>;
  
  // S1: Initialize WindowManager
  // Creates a new WindowManager instance and sets up the window store
  constructor() {
    this.windows = new Map();
    this.store = new Store<StoreSchema>({ schema });
    
    electronLog.info('WindowManager initialized');
  }
  
  // S2: Create a new window with the given ID and options
  // Creates and configures a new BrowserWindow instance
  createWindow(id: string, options: Electron.BrowserWindowConstructorOptions): BrowserWindow {
    try {
      // Check if window already exists
      if (this.windows.has(id)) {
        const existingWindow = this.windows.get(id);
        if (existingWindow && !existingWindow.isDestroyed()) {
          existingWindow.focus();
          return existingWindow;
        }
      }
      
      // Restore window state if available
      const windowState = this.restoreWindowState(id);
      
      // Prepare window options with conditionally included position
      const windowOptions: Electron.BrowserWindowConstructorOptions = {
        ...options,
        width: windowState.width,
        height: windowState.height,
        // Security-focused settings
        webPreferences: {
          ...options.webPreferences,
          contextIsolation: true,
          nodeIntegration: false,
          // Preserve sandbox flag from initial options (default to false)
          sandbox: Boolean(options.webPreferences?.sandbox === true)
        }
      };
      
      // Only include x and y if they are defined
      if (windowState.x !== undefined) {
        windowOptions.x = windowState.x;
      }
      if (windowState.y !== undefined) {
        windowOptions.y = windowState.y;
      }
      
      // Create new window with merged options
      const window = new BrowserWindow(windowOptions);
      
      // Set up window events
      this.setupWindowEvents(window, id);
      
      // Maximize window if it was maximized before
      if (windowState.isMaximized) {
        window.maximize();
      }
      
      // Store the window reference
      this.windows.set(id, window);
      
      electronLog.info(`Window created: ${id}`);
      return window;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error(`Error creating window ${id}:`, errorMessage);
      throw error;
    }
  }
  
  // S3: Get a window by ID
  // Retrieves a BrowserWindow instance by its ID
  getWindow(id: string): BrowserWindow | undefined {
    return this.windows.get(id);
  }
  
  // S4: Close a window by ID
  // Closes and destroys a window by its ID
  closeWindow(id: string): void {
    try {
      const window = this.windows.get(id);
      if (window && !window.isDestroyed()) {
        window.close();
        this.windows.delete(id);
        electronLog.info(`Window closed: ${id}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error(`Error closing window ${id}:`, errorMessage);
    }
  }
  
  // S5: Minimize a window by ID
  // Minimizes a window by its ID
  minimizeWindow(id: string): void {
    try {
      const window = this.windows.get(id);
      if (window && !window.isDestroyed()) {
        window.minimize();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error(`Error minimizing window ${id}:`, errorMessage);
    }
  }
  
  // S6: Maximize a window by ID
  // Maximizes a window by its ID
  maximizeWindow(id: string): void {
    try {
      const window = this.windows.get(id);
      if (window && !window.isDestroyed()) {
        if (window.isMaximized()) {
          window.unmaximize();
        } else {
          window.maximize();
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error(`Error maximizing window ${id}:`, errorMessage);
    }
  }
  
  // S7: Save window state
  // Saves the current window state (position, size, etc.) to persistent storage
  saveWindowState(id: string): void {
    try {
      const window = this.windows.get(id);
      if (!window || window.isDestroyed()) return;
      
      const bounds = window.getBounds();
      const isMaximized = window.isMaximized();
      
      const windowState: WindowState = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized
      };
      
      const states = (this.store as any).get('windowStates') || {};
      states[id] = windowState;
      (this.store as any).set('windowStates', states);
      
      electronLog.debug(`Saved window state for ${id}:`, windowState);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error(`Error saving window state for ${id}:`, errorMessage);
    }
  }
  
  // S8: Restore window state
  // Retrieves saved window state from persistent storage
  restoreWindowState(id: string): WindowState {
    try {
      const defaultState: WindowState = {
        x: undefined,
        y: undefined,
        width: 1200,
        height: 800,
        isMaximized: false
      };
      
      const states = (this.store as any).get('windowStates') || {};
      const savedState = states[id] || {};
      
      const state = { ...defaultState, ...savedState };
      
      // Ensure window is within visible screen area
      if (state.x !== undefined && state.y !== undefined) {
        const displays = screen.getAllDisplays();
        let isVisible = false;
        
        for (const display of displays) {
          const bounds = display.bounds;
          if (
            state.x >= bounds.x && 
            state.y >= bounds.y && 
            state.x + state.width <= bounds.x + bounds.width && 
            state.y + state.height <= bounds.y + bounds.height
          ) {
            isVisible = true;
            break;
          }
        }
        
        if (!isVisible) {
          state.x = undefined;
          state.y = undefined;
        }
      }
      
      electronLog.debug(`Restored window state for ${id}:`, state);
      return state;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error(`Error restoring window state for ${id}:`, errorMessage);
      return {
        x: undefined,
        y: undefined,
        width: 1200,
        height: 800,
        isMaximized: false
      };
    }
  }
  
  // S9: Set up window events
  // Configures event handlers for a window
  setupWindowEvents(window: BrowserWindow, id: string): void {
    try {
      // Save window state when it's closed
      window.on('close', () => {
        try {
          this.saveWindowState(id);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          electronLog.error(`Error in close event handler for ${id}:`, errorMessage);
        }
      });
      
      // Listen for window resize and move events to save state
      ['resize', 'move'].forEach(eventName => {
        let debounceTimer: NodeJS.Timeout;
        
        window.on(eventName as any, () => {
          try {
            if (debounceTimer) {
              clearTimeout(debounceTimer);
            }
            
            debounceTimer = setTimeout(() => {
              try {
                this.saveWindowState(id);
              } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                electronLog.error(`Error in debounced save for ${id}:`, errorMessage);
              }
            }, 500);
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            electronLog.error(`Error in ${eventName} event handler for ${id}:`, errorMessage);
          }
        });
      });
      
      // Handle window focus
      window.on('focus', () => {
        try {
          window.webContents.send('window:focused');
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          electronLog.error(`Error sending focus event for ${id}:`, errorMessage);
        }
      });
      
      // Handle window blur
      window.on('blur', () => {
        try {
          window.webContents.send('window:blurred');
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          electronLog.error(`Error sending blur event for ${id}:`, errorMessage);
        }
      });
      
      // Setup development tools
      if (isDev) {
        window.webContents.on('did-frame-finish-load', () => {
          try {
            window.webContents.once('devtools-opened', () => {
              try {
                window.focus();
              } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                electronLog.error(`Error focusing window after devtools opened for ${id}:`, errorMessage);
              }
            });
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            electronLog.error(`Error setting up devtools handler for ${id}:`, errorMessage);
          }
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error(`Error setting up window events for ${id}:`, errorMessage);
    }
  }
}
