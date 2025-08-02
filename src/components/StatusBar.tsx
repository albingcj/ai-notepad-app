import React, { useEffect, useState } from 'react';
import { useEditor } from '../context/EditorContext';
import { useTheme } from '../context/ThemeContext';
import '../styles/StatusBar.css';

interface StatusBarProps {
  wordCount: number;
  filePath: string;
}

interface StatusBarState {
  status: string;
  position: { line: number; column: number };
  wordCount: number;
  filePath: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ wordCount, filePath }) => {
  const [state, setState] = useState<StatusBarState>({
    status: 'Ready',
    position: { line: 1, column: 1 },
    wordCount,
    filePath
  });
  
  const { selection } = useEditor();
  const { theme } = useTheme();
  
  // S1: Update status
  // Updates the status message in the status bar
  const updateStatus = (status: string) => {
    setState(prev => ({ ...prev, status }));
  };
  
  // S2: Update cursor position
  // Updates the cursor position display
  const updatePosition = (line: number, column: number) => {
    setState(prev => ({ ...prev, position: { line, column } }));
  };
  
  // S3: Update word count
  // Updates the word count display
  useEffect(() => {
    setState(prev => ({ ...prev, wordCount }));
  }, [wordCount]);
  
  // S4: Update file path
  // Updates the file path display
  useEffect(() => {
    setState(prev => ({ ...prev, filePath }));
  }, [filePath]);
  
  // Get filename from path
  const getFileName = (path: string) => {
    if (!path) return 'Untitled';
    
    // Extract filename from path
    const parts = path.split(/[\/\\]/);
    return parts[parts.length - 1] || path;
  };
  
  return (
    <div className={`status-bar ${theme}`}>
      <div className="status-section status-message">
        {state.status}
      </div>
      
      <div className="status-section status-position">
        {selection ? (
          <span>
            Selection: {selection.text.length} chars
          </span>
        ) : (
          <span>
            Ln {state.position.line}, Col {state.position.column}
          </span>
        )}
      </div>
      
      <div className="status-section status-word-count">
        Words: {state.wordCount}
      </div>
      
      <div className="status-section status-file-path" title={state.filePath}>
        {getFileName(state.filePath)}
      </div>
    </div>
  );
};

export default StatusBar;
