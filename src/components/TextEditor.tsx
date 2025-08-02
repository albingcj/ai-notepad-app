import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Editor } from '@monaco-editor/react'; // Removed loader import
import { useEditor } from '../context/EditorContext';
import useTextSelection from '../hooks/useTextSelection';
import useLLM from '../hooks/useLLM';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import ContextMenu from './ContextMenu';
import SuggestionPanel from './SuggestionPanel';
import '../styles/TextEditor.css';
import { configureMonaco } from '../services/MonacoConfig';

// Configure Monaco Editor ONCE - this replaces all the old configuration
configureMonaco();

interface TextEditorProps {}

interface EditorState {
  contextMenu: {
    visible: boolean;
    x: number;
    y: number;
  };
  suggestions: {
    visible: boolean;
    items: Array<{
      text: string;
      confidence: number;
      type: string;
    }>;
    position: {
      x: number;
      y: number;
    };
  };
  findReplace: {
    visible: boolean;
    searchText: string;
    replaceText: string;
    matchCase: boolean;
    useRegex: boolean;
  };
}

const TextEditor: React.FC<TextEditorProps> = () => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const [state, setState] = useState<EditorState>({
    contextMenu: {
      visible: false,
      x: 0,
      y: 0
    },
    suggestions: {
      visible: false,
      items: [],
      position: {
        x: 0,
        y: 0
      }
    },
    findReplace: {
      visible: false,
      searchText: '',
      replaceText: '',
      matchCase: false,
      useRegex: false
    }
  });
  
  const { content, setContent, selection, setSelection } = useEditor();
  const { selectText, clearSelection } = useTextSelection();
  const { checkGrammar, rephraseText, isProcessing } = useLLM();
  const { settings } = useSettings();
  const { theme } = useTheme();
  
  // S1: Handle editor initialization
  // Sets up the Monaco editor when it's mounted
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Configure editor
    configureEditor(editor, monaco);
    
    // Set initial content if available
    if (content) {
      editor.setValue(content);
    }
    
    // Set up event listeners
    setupEditorEvents(editor, monaco);
  };
  
  // S2: Configure editor settings
  // Sets up editor options and appearance
  const configureEditor = (editor: any, monaco: any) => {
    // Set editor options
    editor.updateOptions({
      fontSize: settings.fontSize,
      wordWrap: settings.wordWrap ? 'on' : 'off',
      minimap: { enabled: true },
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      contextmenu: false, // We'll use our custom context menu
      theme: theme === 'dark' ? 'vs-dark' : 'vs'
    });
  };
  
  // S3: Set up editor event handlers
  // Configures event listeners for the editor
  const setupEditorEvents = (editor: any, monaco: any) => {
    // Handle content changes
    editor.onDidChangeModelContent(() => {
      const newContent = editor.getValue();
      setContent(newContent);
    });
    
    // Handle selection changes
    editor.onDidChangeCursorSelection((e: any) => {
      const selectionObj = e.selection;
      if (selectionObj.startLineNumber === selectionObj.endLineNumber && 
          selectionObj.startColumn === selectionObj.endColumn) {
        // No actual selection, just cursor position
        clearSelection();
        return;
      }
      
      // Get selected text
      const selectedText = editor.getModel().getValueInRange(selectionObj);
      
      // Update selection in context
      setSelection({
        start: editor.getModel().getOffsetAt({
          lineNumber: selectionObj.startLineNumber,
          column: selectionObj.startColumn
        }),
        end: editor.getModel().getOffsetAt({
          lineNumber: selectionObj.endLineNumber,
          column: selectionObj.endColumn
        }),
        text: selectedText
      });
    });
    
    // Handle context menu
    editor.onContextMenu((e: any) => {
      e.event.preventDefault();
      
      // Only show context menu if there's a selection
      const selection = editor.getSelection();
      if (selection && !selection.isEmpty()) {
        setState(prev => ({
          ...prev,
          contextMenu: {
            visible: true,
            x: e.event.posx || e.event.x,
            y: e.event.posy || e.event.y
          }
        }));
      }
    });
    
    // Handle keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG, () => {
      handleGrammarCheck();
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
      handleRephrase();
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      setState(prev => ({
        ...prev,
        findReplace: {
          ...prev.findReplace,
          visible: true
        }
      }));
    });
  };
  
  // S4: Handle content changes
  // Updates content state when editor content changes
  const onChange = (newContent: string | undefined) => {
    if (newContent !== undefined) {
      setContent(newContent);
    }
  };
  
  // S7: Replace text in range
  // Replaces text between start and end positions
  const replaceText = (start: number, end: number, text: string) => {
    if (!editorRef.current) return;
    
    const editor = editorRef.current;
    
    // Convert offsets to positions
    const startPos = editor.getModel().getPositionAt(start);
    const endPos = editor.getModel().getPositionAt(end);
    
    // Create edit operation
    editor.executeEdits('replace-text', [{
      range: {
        startLineNumber: startPos.lineNumber,
        startColumn: startPos.column,
        endLineNumber: endPos.lineNumber,
        endColumn: endPos.column
      },
      text: text
    }]);
    
    // Update selection to cover the new text
    selectText(start, start + text.length);
  };
  
  // S8: Handle undo operation
  // Performs undo in the editor
  const undo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'undo');
    }
  };
  
  // S9: Handle redo operation
  // Performs redo in the editor
  const redo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'redo');
    }
  };
  
  // S10: Find text in editor
  // Searches for text with specified options
  const findText = (searchText: string, options: { matchCase?: boolean; useRegex?: boolean }) => {
    if (!editorRef.current || !monacoRef.current) return;
    
    const editor = editorRef.current;
    
    // Create find controller if needed
    const findController = editor.getContribution('editor.contrib.findController');
    
    // Set options
    findController.setOptions({
      matchCase: options.matchCase || false,
      isRegex: options.useRegex || false
    });
    
    // Start find operation
    findController.startFind({
      searchString: searchText,
      isRegex: options.useRegex || false,
      matchCase: options.matchCase || false,
      matchWholeWord: false
    });
  };
  
  // S11: Replace text in editor
  // Performs find and replace operation
  const replaceTextInEditor = (searchText: string, replaceText: string, options: { matchCase?: boolean; useRegex?: boolean }) => {
    if (!editorRef.current || !monacoRef.current) return;
    
    const editor = editorRef.current;
    
    // Create find controller
    const findController = editor.getContribution('editor.contrib.findController');
    
    // Set options
    findController.setOptions({
      matchCase: options.matchCase || false,
      isRegex: options.useRegex || false
    });
    
    // Start find operation
    findController.startFind({
      searchString: searchText,
      isRegex: options.useRegex || false,
      matchCase: options.matchCase || false,
      matchWholeWord: false
    });
    
    // Replace all occurrences
    findController.replaceAll();
  };
  
  // S12: Handle grammar check
  // Processes grammar check request for selected text
  const handleGrammarCheck = useCallback(async () => {
    if (!selection || !selection.text) {
      alert('Please select text to check grammar');
      return;
    }

    try {
      const response = await checkGrammar(selection.text);

      if (response.suggestions && response.suggestions.length > 0) {
        // Show suggestions panel
        showSuggestions(response.suggestions);
      } else {
        alert('No grammar issues found');
      }
    } catch (error) {
      console.error('Grammar check error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error checking grammar: ${errorMessage}`);
    }
  }, [selection, checkGrammar]);
  
  // S13: Handle text rephrasing
  // Processes rephrasing request for selected text
  const handleRephrase = useCallback(async (style?: string) => {
    if (!selection || !selection.text) {
      alert('Please select text to rephrase');
      return;
    }

    try {
      const response = await rephraseText(selection.text, style || 'formal');

      if (response.suggestions && response.suggestions.length > 0) {
        // Show suggestions panel
        showSuggestions(response.suggestions);
      } else {
        alert('No rephrasing suggestions available');
      }
    } catch (error) {
      console.error('Rephrasing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error rephrasing text: ${errorMessage}`);
    }
  }, [selection, rephraseText]);
  
  // S14: Show suggestions panel
  // Displays the suggestions panel with provided items
  const showSuggestions = (suggestions: Array<{ text: string; confidence: number; type: string }>) => {
    if (!editorRef.current) return;
    
    const editor = editorRef.current;
    const selection = editor.getSelection();
    
    if (!selection) return;
    
    // Get position for suggestions panel (below the selection)
    const endPos = {
      lineNumber: selection.endLineNumber,
      column: selection.endColumn
    };
    
    // Convert to screen coordinates
    const coordinates = editor.getScrolledVisiblePosition(endPos);
    
    if (!coordinates) return;
    
    // Get editor container position
    const editorContainer = editor.getDomNode();
    const rect = editorContainer.getBoundingClientRect();
    
    // Calculate position
    const x = rect.left + coordinates.left;
    const y = rect.top + coordinates.top + 20; // Add some offset
    
    // Show suggestions panel
    setState(prev => ({
      ...prev,
      suggestions: {
        visible: true,
        items: suggestions,
        position: { x, y }
      },
      contextMenu: {
        ...prev.contextMenu,
        visible: false
      }
    }));
  };
  
  // S15: Hide context menu
  // Hides the context menu
  const hideContextMenu = () => {
    setState(prev => ({
      ...prev,
      contextMenu: {
        ...prev.contextMenu,
        visible: false
      }
    }));
  };
  
  // S16: Handle context menu item click
  // Processes context menu item selections
  const handleContextMenuItemClick = async (itemId: string, data?: any) => {
    hideContextMenu();
    
    switch (itemId) {
      case 'check-grammar':
        await handleGrammarCheck();
        break;
      case 'rephrase-text':
        await handleRephrase();
        break;
      case 'rephrase-formal':
        await handleRephrase('formal');
        break;
      case 'rephrase-casual':
        await handleRephrase('casual');
        break;
      case 'rephrase-concise':
        await handleRephrase('concise');
        break;
      case 'rephrase-detailed':
        await handleRephrase('detailed');
        break;
      case 'cut':
        document.execCommand('cut');
        break;
      case 'copy':
        document.execCommand('copy');
        break;
      case 'paste':
        document.execCommand('paste');
        break;
      default:
        break;
    }
  };
  
  // S17: Apply suggestion
  // Applies a selected suggestion to the text
  const applySuggestion = (suggestion: { text: string; confidence: number; type: string }) => {
    if (!selection) return;
    
    // Replace selected text with suggestion
    replaceText(selection.start, selection.end, suggestion.text);
    
    // Hide suggestions panel
    setState(prev => ({
      ...prev,
      suggestions: {
        ...prev.suggestions,
        visible: false
      }
    }));
  };
  
  // Update editor theme when app theme changes
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      monacoRef.current.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
    }
  }, [theme]);
  
  // Update editor options when settings change
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize: settings.fontSize,
        wordWrap: settings.wordWrap ? 'on' : 'off'
      });
    }
  }, [settings]);
  
  // Set up IPC listeners
  useEffect(() => {
    const removeListeners = [
      window.electronAPI.on('edit:undo', undo),
      window.electronAPI.on('edit:redo', redo),
      window.electronAPI.on('edit:find', () => {
        setState(prev => ({
          ...prev,
          findReplace: {
            ...prev.findReplace,
            visible: true
          }
        }));
      }),
      window.electronAPI.on('ai:check-grammar', handleGrammarCheck),
      window.electronAPI.on('ai:rephrase-text', handleRephrase)
    ];
    
    return () => {
      // Clean up listeners
      removeListeners.forEach(removeListener => removeListener());
    };
  }, [selection, handleGrammarCheck, handleRephrase]);
  
  return (
    <div className="text-editor-container">
      <Editor
        height="100%"
        defaultLanguage="plaintext"
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        value={content}
        onChange={onChange}
        onMount={handleEditorDidMount}
        loading={<div className="editor-loading">Loading editor...</div>}
        options={{
          fontSize: settings.fontSize,
          wordWrap: settings.wordWrap ? 'on' : 'off',
          minimap: { enabled: true },
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          contextmenu: false // We'll use our custom context menu
        }}
      />
      
      {state.contextMenu.visible && (
        <ContextMenu
          x={state.contextMenu.x}
          y={state.contextMenu.y}
          items={[
            { id: 'cut', label: 'Cut', enabled: true },
            { id: 'copy', label: 'Copy', enabled: true },
            { id: 'paste', label: 'Paste', enabled: true },
            { type: 'separator' },
            { id: 'check-grammar', label: 'Check Grammar', enabled: true },
            {
              id: 'rephrase-text',
              label: 'Rephrase Text',
              enabled: true,
              submenu: [
                { id: 'rephrase-formal', label: 'Formal', enabled: true },
                { id: 'rephrase-casual', label: 'Casual', enabled: true },
                { id: 'rephrase-concise', label: 'Concise', enabled: true },
                { id: 'rephrase-detailed', label: 'Detailed', enabled: true }
              ]
            }
          ]}
          onItemClick={handleContextMenuItemClick}
          onClose={hideContextMenu}
        />
      )}
      
      {state.suggestions.visible && (
        <SuggestionPanel
          suggestions={state.suggestions.items}
          position={state.suggestions.position}
          onApply={applySuggestion}
          onClose={() => {
            setState(prev => ({
              ...prev,
              suggestions: {
                ...prev.suggestions,
                visible: false
              }
            }));
          }}
        />
      )}
      
      {state.findReplace.visible && (
        <div className="find-replace-panel">
          <div className="find-replace-header">
            <h3>Find & Replace</h3>
            <button
              onClick={() => {
                setState(prev => ({
                  ...prev,
                  findReplace: {
                    ...prev.findReplace,
                    visible: false
                  }
                }));
              }}
            >
              ✕
            </button>
          </div>
          <div className="find-replace-content">
            <div className="find-replace-row">
              <label htmlFor="find-text">Find:</label>
              <input
                id="find-text"
                type="text"
                value={state.findReplace.searchText}
                onChange={(e) => {
                  setState(prev => ({
                    ...prev,
                    findReplace: {
                      ...prev.findReplace,
                      searchText: e.target.value
                    }
                  }));
                }}
              />
              <button
                onClick={() => {
                  findText(state.findReplace.searchText, {
                    matchCase: state.findReplace.matchCase,
                    useRegex: state.findReplace.useRegex
                  });
                }}
              >
                Find
              </button>
            </div>
            <div className="find-replace-row">
              <label htmlFor="replace-text">Replace:</label>
              <input
                id="replace-text"
                type="text"
                value={state.findReplace.replaceText}
                onChange={(e) => {
                  setState(prev => ({
                    ...prev,
                    findReplace: {
                      ...prev.findReplace,
                      replaceText: e.target.value
                    }
                  }));
                }}
              />
              <button
                onClick={() => {
                  replaceTextInEditor(
                    state.findReplace.searchText,
                    state.findReplace.replaceText,
                    {
                      matchCase: state.findReplace.matchCase,
                      useRegex: state.findReplace.useRegex
                    }
                  );
                }}
              >
                Replace All
              </button>
            </div>
            <div className="find-replace-options">
              <label>
                <input
                  type="checkbox"
                  checked={state.findReplace.matchCase}
                  onChange={(e) => {
                    setState(prev => ({
                      ...prev,
                      findReplace: {
                        ...prev.findReplace,
                        matchCase: e.target.checked
                      }
                    }));
                  }}
                />
                Match case
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={state.findReplace.useRegex}
                  onChange={(e) => {
                    setState(prev => ({
                      ...prev,
                      findReplace: {
                        ...prev.findReplace,
                        useRegex: e.target.checked
                      }
                    }));
                  }}
                />
                Use regex
              </label>
            </div>
          </div>
        </div>
      )}
      
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-spinner"></div>
          <div className="processing-message">Processing text...</div>
        </div>
      )}
    </div>
  );
};

export default TextEditor;
