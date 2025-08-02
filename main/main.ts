import { app, BrowserWindow, session } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as dotenv from 'dotenv';
import * as electronLog from 'electron-log';
import isDev from 'electron-is-dev';
import { WindowManager } from './window-manager';
import { MenuManager } from './menu-manager';
import { setupIPC } from './ipc-handlers';

// Configure logger
electronLog.transports.file.level = 'info';
electronLog.transports.console.level = isDev ? 'debug' : 'info';

// Load environment variables from main/ folder
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize window manager
const windowManager = new WindowManager();
const menuManager = new MenuManager();

// S1: Main application entry point
// Sets up the Electron app and creates the main window
function main(): void {
  try {
    setupApp();
    registerAppEvents();
    setupIPC(windowManager);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown startup error';
    electronLog.error('Error during application startup:', errorMessage);
    app.exit(1);
  }
}

// S2: Configure application settings and behavior
// Sets up app-wide configurations and security policies
function setupApp(): void {
  try {
    // Prevent multiple instances of the app
    const gotTheLock = app.requestSingleInstanceLock();
    
    if (!gotTheLock) {
      app.quit();
      return;
    }
    
    app.on('second-instance', () => {
      try {
        // Someone tried to run a second instance, focus our window instead
        const mainWindow = windowManager.getWindow('main');
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        electronLog.error('Error handling second instance:', errorMessage);
      }
    });
    
    // Disable hardware acceleration for better performance on some systems
    // app.disableHardwareAcceleration();
    
    // Set app name
    app.setName('AI Notepad');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    electronLog.error('Error setting up app:', errorMessage);
    throw error;
  }
}

// S3: Setup Content Security Policy and other security settings
// Configures CSP headers and other security-related settings
function setupSecurityPolicies(): void {
  try {
    // Set up Content Security Policy
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      try {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [
              "default-src 'self';",
              "script-src 'self';",
              "style-src 'self' 'unsafe-inline';",
              "font-src 'self' data:;",
              "img-src 'self' data:;",
              "connect-src 'self' http://localhost:* https://api.openai.com https://api.anthropic.com;"
            ].join(' ')
          }
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        electronLog.error('Error setting CSP headers:', errorMessage);
        // Call callback anyway to prevent hanging
        callback({});
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    electronLog.error('Error setting up security policies:', errorMessage);
    throw error;
  }
}

// S4: Register application lifecycle event handlers
// Sets up event handlers for app lifecycle events like ready, window-all-closed, etc.
function registerAppEvents(): void {
  try {
    // Create main window when Electron has finished initialization
    app.whenReady().then(() => {
      try {
        setupSecurityPolicies();
        createMainWindow();
        
        app.on('activate', () => {
          try {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            electronLog.error('Error handling activate event:', errorMessage);
          }
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        electronLog.error('Error in whenReady handler:', errorMessage);
      }
    }).catch((error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Error during app initialization:', errorMessage);
    });

    // Quit when all windows are closed, except on macOS
    app.on('window-all-closed', () => {
      try {
        if (process.platform !== 'darwin') {
          app.quit();
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        electronLog.error('Error handling window-all-closed event:', errorMessage);
      }
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      electronLog.error('Uncaught Exception:', error.message);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown) => {
      const errorMessage = reason instanceof Error ? reason.message : 'Unknown rejection reason';
      electronLog.error('Unhandled Promise Rejection:', errorMessage);
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    electronLog.error('Error registering app events:', errorMessage);
    throw error;
  }
}

// S5: Create the main application window
// Creates and configures the main application window
function createMainWindow(): void {
  try {
    const mainWindow = windowManager.createWindow('main', {
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    });
    
    // Set up application menu
    menuManager.buildMenu(mainWindow);
    
    // Load the index.html from React dev server or the built file
    const startUrl = isDev
      ? 'http://localhost:3000'
      : url.format({
          pathname: path.join(__dirname, '../build/index.html'),
          protocol: 'file:',
          slashes: true,
        });
    
    mainWindow.loadURL(startUrl).catch((error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Failed to load URL:', errorMessage);
    });
    
    // Open DevTools in development mode
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
    
    electronLog.info('Main window created successfully.');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    electronLog.error('Failed to create main window:', errorMessage);
    throw error;
  }
}

// Start the application
main();
