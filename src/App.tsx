import React, { useEffect, useState } from 'react';
import './styles/App.css';
import TextEditor from './components/TextEditor';
import Toolbar from './components/Toolbar';
import StatusBar from './components/StatusBar';
import useFileOperations from './hooks/useFileOperations';
import { useTheme } from './context/ThemeContext';
import { useSettings } from './context/SettingsContext';
import SettingsDialog from './components/SettingsDialog';
import SuggestionPanel from './components/SuggestionPanel';
import { useEditor } from './context/EditorContext';

interface AppState {
  showSettings: boolean;
  isLoading: boolean;
  loadingMessage: string;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    showSettings: false,
    isLoading: false,
    loadingMessage: ''
  });
  
  const { theme } = useTheme();
  const { settings, loadSettings } = useSettings();
  const { content, setContent } = useEditor();
  const { currentFile, newFile, openFile, saveFile, saveFileAs, recentFiles } = useFileOperations();
  
  // S1: Initialize application
  // Sets up the application on initial load
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Show loading state
        setState(prev => ({ ...prev, isLoading: true, loadingMessage: 'Loading settings...' }));
        
        // Load settings
        await loadSettings();
        
        // Create new empty file
        setState(prev => ({ ...prev, loadingMessage: 'Creating new document...' }));
        await newFile();
        
        // Hide loading state
        setState(prev => ({ ...prev, isLoading: false, loadingMessage: '' }));
        
        // Set up IPC event listeners
        setupIPCListeners();
      } catch (error) {
        console.error('Error initializing app:', error);
        handleError(error as Error);
      }
    };
    
    initializeApp();
    
    // Clean up event listeners on unmount
    return () => {
      // Clean up any event listeners
    };
  }, []);
  
  // S2: Set up IPC event listeners
  // Configures listeners for IPC events from main process
  const setupIPCListeners = () => {
    // File operations
    window.electronAPI.on('file:new', async () => {
      await newFile();
    });
    
    window.electronAPI.on('file:open', async (path?: string) => {
      await openFile(path);
    });
    
    window.electronAPI.on('file:save', async () => {
      await saveFile(content);
    });
    
    window.electronAPI.on('file:save-as', async () => {
      await saveFileAs(content);
    });
    
    // Settings
    window.electronAPI.on('ui:show-settings', () => {
      setState(prev => ({ ...prev, showSettings: true }));
    });
    
    // Check grammar
    window.electronAPI.on('ai:check-grammar', () => {
      // This will be handled by the TextEditor component
    });
    
    // Rephrase text
    window.electronAPI.on('ai:rephrase-text', (style?: string) => {
      // This will be handled by the TextEditor component
    });
  };
  
  // S3: Handle errors
  // Processes and displays application errors
  const handleError = (error: Error) => {
    console.error('Application error:', error);
    
    // Hide loading state
    setState(prev => ({ ...prev, isLoading: false }));
    
    // Show error message
    alert(`An error occurred: ${error.message}`);
  };
  
  // S4: Toggle settings dialog
  // Shows or hides the settings dialog
  const toggleSettings = () => {
    setState(prev => ({ ...prev, showSettings: !prev.showSettings }));
  };
  
  return (
    <div className={`app ${theme}`}>
      <Toolbar 
        onNewFile={newFile}
        onOpenFile={() => openFile()}
        onSaveFile={() => saveFile(content)}
        onSaveFileAs={() => saveFileAs(content)}
        onSettings={toggleSettings}
      />
      
      <div className="editor-container">
        <TextEditor />
      </div>
      
      <StatusBar 
        wordCount={content ? content.split(/\s+/).filter(Boolean).length : 0}
        filePath={currentFile?.path || 'Untitled'}
      />
      
      {state.showSettings && (
        <SettingsDialog 
          onClose={toggleSettings}
        />
      )}
      
      {state.isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-message">{state.loadingMessage}</div>
        </div>
      )}
    </div>
  );
};

export default App;
