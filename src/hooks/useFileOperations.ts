import { useState, useCallback, useEffect } from 'react';
import { FileData } from '../interfaces/types';
import IPCBridge from '../services/IPCBridge';
import { IpcChannels } from '../interfaces/constants';
import { useEditor } from '../context/EditorContext';
import { useSettings } from '../context/SettingsContext';

export default function useFileOperations() {
  const [currentFile, setCurrentFile] = useState<FileData | null>(null);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const { content, setContent } = useEditor();
  const { settings } = useSettings();
  
  // S1: Load recent files on mount
  // Retrieves the list of recently opened files
  useEffect(() => {
    const loadRecentFiles = async () => {
      try {
        const files = await IPCBridge.invoke<string[]>(IpcChannels.GET_RECENT_FILES);
        setRecentFiles(files);
      } catch (error) {
        console.error('Error loading recent files:', error);
      }
    };
    
    loadRecentFiles();
  }, []);
  
  // S2: Create new file
  // Creates a new empty file
  const newFile = useCallback(async (): Promise<void> => {
    try {
      // If there are unsaved changes, prompt user
      if (currentFile && content !== currentFile.content) {
        const confirmSave = window.confirm('Do you want to save changes before creating a new file?');
        
        if (confirmSave) {
          await saveFile(content);
        }
      }
      
      // Create new file via IPC
      const fileData = await IPCBridge.invoke<FileData>(IpcChannels.FILE_NEW);
      
      // Update state
      setCurrentFile(fileData);
      setContent('');
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error creating new file:', error);
      return Promise.reject(error);
    }
  }, [currentFile, content, setContent]);
  
  // S3: Open file
  // Opens a file from disk
  const openFile = useCallback(async (path?: string): Promise<FileData> => {
    try {
      // If there are unsaved changes, prompt user
      if (currentFile && content !== currentFile.content) {
        const confirmSave = window.confirm('Do you want to save changes before opening another file?');
        
        if (confirmSave) {
          await saveFile(content);
        }
      }
      
      // Open file via IPC
      const fileData = await IPCBridge.invoke<FileData>(IpcChannels.FILE_OPEN, path);
      
      if (fileData) {
        // Update state
        setCurrentFile(fileData);
        setContent(fileData.content);
        
        // Update recent files list
        loadRecentFiles();
      }
      
      return fileData;
    } catch (error) {
      console.error('Error opening file:', error);
      throw error;
    }
  }, [currentFile, content, setContent]);
  
  // S4: Save file
  // Saves the current file to disk
  const saveFile = useCallback(async (content: string): Promise<boolean> => {
    try {
      // Save file via IPC
      const success = await IPCBridge.invoke<boolean>(IpcChannels.FILE_SAVE, content);
      
      if (success && currentFile) {
        // Update current file state
        setCurrentFile({
          ...currentFile,
          content,
          saved: true,
          lastModified: new Date()
        });
        
        // Update recent files list
        loadRecentFiles();
      }
      
      return success;
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }, [currentFile]);
  
  // S5: Save file as
  // Saves the current file with a new name/location
  const saveFileAs = useCallback(async (content: string): Promise<boolean> => {
    try {
      // Save file as via IPC
      const success = await IPCBridge.invoke<boolean>(IpcChannels.FILE_SAVE_AS, content);
      
      if (success) {
        // The current file will be updated by the main process
        // We just need to update the recent files list
        loadRecentFiles();
      }
      
      return success;
    } catch (error) {
      console.error('Error saving file as:', error);
      throw error;
    }
  }, []);
  
  // S6: Load recent files
  // Updates the list of recent files
  const loadRecentFiles = useCallback(async (): Promise<void> => {
    try {
      const files = await IPCBridge.invoke<string[]>(IpcChannels.GET_RECENT_FILES);
      setRecentFiles(files);
    } catch (error) {
      console.error('Error loading recent files:', error);
    }
  }, []);
  
  // S7: Set up auto-save
  // Configures automatic saving at specified intervals
  useEffect(() => {
    let autoSaveInterval: NodeJS.Timeout | null = null;
    
    // Only set up auto-save if we have a current file with a path
    if (settings.autoSaveInterval > 0 && currentFile && currentFile.path) {
      autoSaveInterval = setInterval(() => {
        // Only save if there are changes
        if (content !== currentFile.content) {
          saveFile(content).catch(error => {
            console.error('Auto-save failed:', error);
          });
        }
      }, settings.autoSaveInterval);
    }
    
    return () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    };
  }, [currentFile, content, settings.autoSaveInterval, saveFile]);
  
  return {
    currentFile,
    recentFiles,
    newFile,
    openFile,
    saveFile,
    saveFileAs
  };
}
