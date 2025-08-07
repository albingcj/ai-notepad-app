import { dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as electronLog from 'electron-log';
import Store from 'electron-store';

// Define file data interface
interface FileData {
  path: string;
  content: string;
  saved: boolean;
  lastModified: Date;
}

// Define store schema with proper typing
interface StoreSchema {
  recentFiles: string[];
}

const schema = {
  recentFiles: {
    type: 'array' as const,
    default: []
  }
};

export class FileHandler {
  private currentFile: FileData | null;
  private recentFiles: string[];
  private backupInterval: NodeJS.Timeout | null;
  private store: Store<StoreSchema>;
  private backupDir: string;
  
  // S1: Initialize FileHandler
  // Creates a new FileHandler instance and sets up file storage
  constructor() {
    this.currentFile = null;
    this.store = new Store<StoreSchema>({ schema });
    this.recentFiles = (this.store as any).get('recentFiles') || [];
    this.backupInterval = null;
    
    // Create backup directory
    this.backupDir = path.join(
      process.platform === 'win32'
        ? process.env.APPDATA || ''
        : process.platform === 'darwin'
          ? path.join(process.env.HOME || '', 'Library', 'Application Support')
          : process.env.XDG_CONFIG_HOME || path.join(process.env.HOME || '', '.config'),
      'ai-notepad',
      'backups'
    );
    
    this.ensureBackupDirExists();
    
    electronLog.info('FileHandler initialized');
  }
  
  // Helper method to ensure backup directory exists
  private ensureBackupDirExists(): void {
    try {
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Failed to create backup directory:', errorMessage);
    }
  }
  
  // S2: Create a new file
  // Creates a new empty file
  newFile(): FileData {
    this.currentFile = {
      path: '',
      content: '',
      saved: true,
      lastModified: new Date()
    };
    
    electronLog.info('New file created');
    return this.currentFile;
  }
  
  // S3: Open a file
  // Opens a file from disk or shows a file dialog
  async openFile(window: BrowserWindow, filePath?: string): Promise<FileData | null> {
    try {
      // If no path provided, show file dialog
      if (!filePath) {
        const result = await dialog.showOpenDialog(window, {
          properties: ['openFile'],
          filters: [
            { name: 'Text Files', extensions: ['txt', 'md', 'rtf'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });
        
        if (result.canceled || result.filePaths.length === 0) {
          return null;
        }
        
        filePath = result.filePaths[0];
      }
      
      // Read file content
      const content = await fs.promises.readFile(filePath, 'utf8');
      
      // Create file data object
      this.currentFile = {
        path: filePath,
        content,
        saved: true,
        lastModified: new Date()
      };
      
      // Add to recent files
      this.addToRecentFiles(filePath);
      
      electronLog.info(`File opened: ${filePath}`);
      return this.currentFile;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error(`Error opening file ${filePath}:`, error);
      throw new Error(`Could not open file: ${errorMessage}`);
    }
  }
  
  // S4: Save the current file
  // Saves the current file to disk
  async saveFile(window: BrowserWindow, content: string, filePath?: string): Promise<boolean> {
    try {
      // If no path provided or current file has no path, use saveFileAs
      if (!filePath && (!this.currentFile || !this.currentFile.path)) {
        return this.saveFileAs(window, content);
      }
      
      // Use provided path or current file path (with null check)
      const savePath = filePath || (this.currentFile?.path || '');
      if (!savePath) {
        return this.saveFileAs(window, content);
      }
      
      // Write content to file
      await fs.promises.writeFile(savePath, content, 'utf8');
      
      // Update current file data
      this.currentFile = {
        path: savePath,
        content,
        saved: true,
        lastModified: new Date()
      };
      
      // Add to recent files
      this.addToRecentFiles(savePath);
      
      electronLog.info(`File saved: ${savePath}`);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error(`Error saving file:`, error);
      throw new Error(`Could not save file: ${errorMessage}`);
    }
  }
  
  // S5: Save the current file with a new name/location
  // Shows a save dialog and saves the file to the selected location
  async saveFileAs(window: BrowserWindow, content: string): Promise<boolean> {
    try {
      // Show save dialog
      const result = await dialog.showSaveDialog(window, {
        filters: [
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'Markdown', extensions: ['md'] },
          { name: 'Rich Text', extensions: ['rtf'] }
        ]
      });
      
      if (result.canceled || !result.filePath) {
        return false;
      }
      
      // Save file with selected path
      await fs.promises.writeFile(result.filePath, content, 'utf8');

      // Update current file data
      this.currentFile = {
        path: result.filePath,
        content,
        saved: true,
        lastModified: new Date()
      };

      // Add to recent files
      this.addToRecentFiles(result.filePath);

      electronLog.info(`File saved as: ${result.filePath}`);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Error in saveFileAs:', error);
      throw new Error(`Could not save file: ${errorMessage}`);
    }
  }
  
  // S6: Get list of recent files
  // Returns the list of recently opened files
  getRecentFiles(): string[] {
    return this.recentFiles;
  }
  
  // S7: Start auto-save system
  // Begins auto-saving the current file at the specified interval
  startAutoSave(window: BrowserWindow, content: string, interval: number): void {
    // Clear any existing interval
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }
    
    // Set up new interval
    this.backupInterval = setInterval(() => {
      // Only auto-save if we have a current file with a path
      if (this.currentFile && this.currentFile.path) {
        this.saveFile(window, content)
          .catch((error: unknown) => {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            electronLog.error('Auto-save failed:', errorMessage);
          });
      }
      
      // Always create a backup
      this.createBackup(content);
    }, interval);
    
    electronLog.info(`Auto-save started with interval: ${interval}ms`);
  }
  
  // S8: Stop auto-save system
  // Stops the auto-save interval
  stopAutoSave(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      electronLog.info('Auto-save stopped');
    }
  }
  
  // S9: Create backup of current content
  // Creates a backup file with the current content
  createBackup(content: string): void {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `backup-${timestamp}.txt`);
      
      fs.writeFileSync(backupPath, content, 'utf8');
      
      // Clean up old backups (keep only last 10)
      this.cleanupOldBackups();
      
      electronLog.debug(`Backup created: ${backupPath}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Failed to create backup:', errorMessage);
    }
  }
  
  // S10: Restore from most recent backup
  // Retrieves the most recent backup file
  async restoreFromBackup(): Promise<FileData | null> {
    try {
      // Get list of backup files
      const files = await fs.promises.readdir(this.backupDir);
      
      if (files.length === 0) {
        electronLog.info('No backup files found');
        return null;
      }
      
      // Sort by modification time (newest first)
      const backupFiles = await Promise.all(
        files.map(async file => {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.promises.stat(filePath);
          return { path: filePath, mtime: stats.mtime };
        })
      );
      
      backupFiles.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      
      // Read most recent backup
      const mostRecentBackup = backupFiles[0].path;
      const content = await fs.promises.readFile(mostRecentBackup, 'utf8');
      
      electronLog.info(`Restored from backup: ${mostRecentBackup}`);
      
      return {
        path: '',
        content,
        saved: false,
        lastModified: new Date()
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Failed to restore from backup:', errorMessage);
      return null;
    }
  }
  
  // Helper method to clean up old backups
  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.backupDir);
      
      if (files.length <= 10) return;
      
      // Sort by modification time (oldest first)
      const backupFiles = await Promise.all(
        files.map(async file => {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.promises.stat(filePath);
          return { path: filePath, mtime: stats.mtime };
        })
      );
      
      backupFiles.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
      
      // Delete oldest files
      const filesToDelete = backupFiles.slice(0, backupFiles.length - 10);
      
      for (const file of filesToDelete) {
        await fs.promises.unlink(file.path);
        electronLog.debug(`Deleted old backup: ${file.path}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Failed to clean up old backups:', errorMessage);
    }
  }
  
  // Helper method to add a file to recent files list
  private addToRecentFiles(filePath: string): void {
    // Remove if already exists
    this.recentFiles = this.recentFiles.filter(path => path !== filePath);
    
    // Add to beginning of array
    this.recentFiles.unshift(filePath);
    
    // Keep only last 10 files
    if (this.recentFiles.length > 10) {
      this.recentFiles = this.recentFiles.slice(0, 10);
    }
    
    // Save to store
    (this.store as any).set('recentFiles', this.recentFiles);
  }
}

