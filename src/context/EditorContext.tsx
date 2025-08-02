import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TextSelection } from '../interfaces/types';

interface EditorContextType {
  content: string;
  setContent: (content: string) => void;
  selection: TextSelection | null;
  setSelection: (selection: TextSelection | null) => void;
  history: string[];
  historyIndex: number;
  addToHistory: (content: string) => void;
  undo: () => void;
  redo: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

interface EditorProviderProps {
  children: ReactNode;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({ children }) => {
  const [content, setContent] = useState<string>('');
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [history, setHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  
  // S1: Set editor content
  // Updates the editor content and triggers re-render
  const handleSetContent = (newContent: string) => {
    setContent(newContent);
  };
  
  // S2: Add content to history
  // Adds the current content to the history stack for undo/redo
  const addToHistory = (newContent: string) => {
    // If we're not at the end of the history, truncate it
    if (historyIndex < history.length - 1) {
      setHistory(history.slice(0, historyIndex + 1));
    }
    
    // Add new content to history
    setHistory(prev => [...prev, newContent]);
    setHistoryIndex(prev => prev + 1);
  };
  
  // S3: Perform undo operation
  // Reverts to the previous state in history
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setContent(history[historyIndex - 1]);
      return history[historyIndex - 1];
    }
    
    return content;
  };
  
  // S4: Perform redo operation
  // Advances to the next state in history
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setContent(history[historyIndex + 1]);
      return history[historyIndex + 1];
    }
    
    return content;
  };
  
  const value: EditorContextType = {
    content,
    setContent: handleSetContent,
    selection,
    setSelection,
    history,
    historyIndex,
    addToHistory,
    undo,
    redo
  };
  
  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = (): EditorContextType => {
  const context = useContext(EditorContext);
  
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  
  return context;
};
