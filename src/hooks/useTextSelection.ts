import { useState, useCallback } from 'react';
import { TextSelection } from '../interfaces/types';
import selectionHandler from '../services/SelectionHandler';
import { useEditor } from '../context/EditorContext';

export default function useTextSelection() {
  const { content, setSelection: setEditorSelection } = useEditor();
  
  // S1: Select text by position
  // Selects text between start and end positions
  const selectText = useCallback((start: number, end: number): void => {
    if (!content) return;
    
    // Ensure start is before end
    if (start > end) {
      [start, end] = [end, start];
    }
    
    // Ensure positions are within bounds
    start = Math.max(0, Math.min(start, content.length));
    end = Math.max(0, Math.min(end, content.length));
    
    // Get selected text
    const text = content.substring(start, end);
    
    // Update selection handler
    selectionHandler.setSelection(start, end, text);
    
    // Update editor context
    setEditorSelection({
      start,
      end,
      text
    });
  }, [content, setEditorSelection]);
  
  // S2: Clear selection
  // Removes the current selection
  const clearSelection = useCallback((): void => {
    selectionHandler.clearSelection();
    setEditorSelection(null);
  }, [setEditorSelection]);
  
  // S3: Select word at position
  // Selects the entire word at the given position
  const selectWord = useCallback((position: number): TextSelection => {
    if (!content) {
      return { start: position, end: position, text: '' };
    }
    
    const selection = selectionHandler.selectWord(content, position);
    setEditorSelection(selection);
    return selection;
  }, [content, setEditorSelection]);
  
  // S4: Select line at position
  // Selects the entire line at the given position
  const selectLine = useCallback((position: number): TextSelection => {
    if (!content) {
      return { start: position, end: position, text: '' };
    }
    
    const selection = selectionHandler.selectLine(content, position);
    setEditorSelection(selection);
    return selection;
  }, [content, setEditorSelection]);
  
  // S5: Select paragraph at position
  // Selects the entire paragraph at the given position
  const selectParagraph = useCallback((position: number): TextSelection => {
    if (!content) {
      return { start: position, end: position, text: '' };
    }
    
    const selection = selectionHandler.selectParagraph(content, position);
    setEditorSelection(selection);
    return selection;
  }, [content, setEditorSelection]);
  
  return {
    selectText,
    clearSelection,
    selectWord,
    selectLine,
    selectParagraph
  };
}
