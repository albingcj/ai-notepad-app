import { TextSelection } from '../interfaces/types';

export class SelectionHandler {
  private currentSelection: TextSelection | null = null;
  private selectionMode: 'character' | 'word' | 'line' | 'paragraph' = 'character';
  
  // S1: Get current selection
  // Returns the current text selection
  getSelection(): TextSelection | null {
    return this.currentSelection;
  }
  
  // S2: Set selection
  // Updates the current selection with start and end positions
  setSelection(start: number, end: number, text: string): void {
    if (start === end) {
      this.currentSelection = null;
      return;
    }
    
    this.currentSelection = {
      start,
      end,
      text
    };
  }
  
  // S3: Select word at position
  // Selects the word at the specified position
  selectWord(text: string, position: number): TextSelection {
    if (!text || position < 0 || position >= text.length) {
      return { start: position, end: position, text: '' };
    }
    
    // Find word boundaries
    let start = position;
    let end = position;
    
    // Move start to the beginning of the word
    while (start > 0 && /\w/.test(text[start - 1])) {
      start--;
    }
    
    // Move end to the end of the word
    while (end < text.length && /\w/.test(text[end])) {
      end++;
    }
    
    const selectedText = text.substring(start, end);
    
    // Update current selection
    this.currentSelection = {
      start,
      end,
      text: selectedText
    };
    
    return this.currentSelection;
  }
  
  // S4: Select line at position
  // Selects the entire line at the specified position
  selectLine(text: string, position: number): TextSelection {
    if (!text || position < 0 || position >= text.length) {
      return { start: position, end: position, text: '' };
    }
    
    // Find line boundaries
    let start = position;
    let end = position;
    
    // Move start to the beginning of the line
    while (start > 0 && text[start - 1] !== '\n') {
      start--;
    }
    
    // Move end to the end of the line
    while (end < text.length && text[end] !== '\n') {
      end++;
    }
    
    const selectedText = text.substring(start, end);
    
    // Update current selection
    this.currentSelection = {
      start,
      end,
      text: selectedText
    };
    
    return this.currentSelection;
  }
  
  // S5: Select paragraph at position
  // Selects the entire paragraph at the specified position
  selectParagraph(text: string, position: number): TextSelection {
    if (!text || position < 0 || position >= text.length) {
      return { start: position, end: position, text: '' };
    }
    
    // Find paragraph boundaries
    let start = position;
    let end = position;
    
    // Move start to the beginning of the paragraph
    while (start > 0) {
      if (text[start - 1] === '\n' && (start - 2 < 0 || text[start - 2] === '\n')) {
        break;
      }
      start--;
    }
    
    // Move end to the end of the paragraph
    while (end < text.length) {
      if (text[end] === '\n' && (end + 1 >= text.length || text[end + 1] === '\n')) {
        break;
      }
      end++;
    }
    
    // Include the newline character at the end if present
    if (end < text.length && text[end] === '\n') {
      end++;
    }
    
    const selectedText = text.substring(start, end);
    
    // Update current selection
    this.currentSelection = {
      start,
      end,
      text: selectedText
    };
    
    return this.currentSelection;
  }
  
  // S6: Persist selection
  // Saves the current selection for later restoration
  persistSelection(): void {
    if (!this.currentSelection) return;
    
    // In a real implementation, this might save to local storage or state
    localStorage.setItem('savedSelection', JSON.stringify(this.currentSelection));
  }
  
  // S7: Restore selection
  // Restores a previously saved selection
  restoreSelection(): TextSelection | null {
    const savedSelection = localStorage.getItem('savedSelection');
    if (!savedSelection) return null;
    
    try {
      const selection = JSON.parse(savedSelection) as TextSelection;
      this.currentSelection = selection;
      return selection;
    } catch (error) {
      console.error('Error restoring selection:', error);
      return null;
    }
  }
  
  // S8: Clear selection
  // Clears the current selection
  clearSelection(): void {
    this.currentSelection = null;
  }
  
  // S9: Highlight selection with style
  // Applies highlighting style to the selected text
  highlightSelection(style: string): void {
    // This would be implemented based on the editor's highlighting capabilities
    // For now, it's just a placeholder
    console.log(`Highlighting selection with style: ${style}`);
  }
  
  // S10: Set selection mode
  // Changes the selection mode (character, word, line, paragraph)
  setSelectionMode(mode: 'character' | 'word' | 'line' | 'paragraph'): void {
    this.selectionMode = mode;
  }
  
  // S11: Get selection mode
  // Returns the current selection mode
  getSelectionMode(): string {
    return this.selectionMode;
  }
}

export default new SelectionHandler();
