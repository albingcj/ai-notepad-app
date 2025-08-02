import React, { useEffect, useRef, useState } from 'react';
import '../styles/SuggestionPanel.css';
import { useTheme } from '../context/ThemeContext';

interface Suggestion {
  text: string;
  confidence: number;
  type: string;
}

interface SuggestionPanelProps {
  suggestions: Suggestion[];
  position: { x: number; y: number };
  onApply: (suggestion: Suggestion) => void;
  onClose: () => void;
}

const SuggestionPanel: React.FC<SuggestionPanelProps> = ({ 
  suggestions, 
  position, 
  onApply, 
  onClose 
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const { theme } = useTheme();
  
  // S1: Show suggestions
  // Displays the suggestions panel with the provided items
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    
    // Adjust position if panel would go off screen
    if (panelRef.current) {
      const panelRect = panelRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let adjustedX = position.x;
      let adjustedY = position.y;
      
      if (position.x + panelRect.width > viewportWidth) {
        adjustedX = viewportWidth - panelRect.width - 10;
      }
      
      if (position.y + panelRect.height > viewportHeight) {
        adjustedY = viewportHeight - panelRect.height - 10;
      }
      
      panelRef.current.style.left = `${adjustedX}px`;
      panelRef.current.style.top = `${adjustedY}px`;
    }
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [position, onClose]);
  
  // S2: Handle suggestion click
  // Processes clicks on suggestion items
  const handleSuggestionClick = (index: number) => {
    setSelectedIndex(index);
  };
  
  // S3: Apply selected suggestion
  // Applies the currently selected suggestion
  const handleApply = () => {
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      onApply(suggestions[selectedIndex]);
    }
  };
  
  // S4: Apply all suggestions
  // Applies all suggestions (not implemented yet)
  const handleApplyAll = () => {
    // This would need to be implemented based on how multiple suggestions should be applied
    alert('Apply all suggestions functionality not implemented yet');
  };
  
  // S5: Reject all suggestions
  // Closes the suggestions panel without applying any suggestions
  const handleRejectAll = () => {
    onClose();
  };
  
  // Format confidence score as percentage
  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };
  
  // Get class name for confidence level
  const getConfidenceClass = (confidence: number) => {
    if (confidence >= 0.8) return 'high-confidence';
    if (confidence >= 0.5) return 'medium-confidence';
    return 'low-confidence';
  };
  
  return (
    <div 
      className={`suggestion-panel ${theme}`} 
      style={{ left: position.x, top: position.y }}
      ref={panelRef}
    >
      <div className="suggestion-header">
        <h3>Suggestions</h3>
        <button className="close-button" onClick={onClose}>✕</button>
      </div>
      
      <div className="suggestion-list">
        {suggestions.map((suggestion, index) => (
          <div 
            key={index}
            className={`suggestion-item ${selectedIndex === index ? 'selected' : ''}`}
            onClick={() => handleSuggestionClick(index)}
          >
            <div className="suggestion-content">
              <div className="suggestion-text">{suggestion.text}</div>
              <div className={`suggestion-confidence ${getConfidenceClass(suggestion.confidence)}`}>
                {formatConfidence(suggestion.confidence)}
              </div>
            </div>
            <div className="suggestion-type">{suggestion.type}</div>
          </div>
        ))}
      </div>
      
      <div className="suggestion-actions">
        <button 
          className="apply-button"
          disabled={selectedIndex < 0}
          onClick={handleApply}
        >
          Apply Selected
        </button>
        <div className="action-buttons">
          <button className="apply-all-button" onClick={handleApplyAll}>Apply All</button>
          <button className="reject-button" onClick={handleRejectAll}>Reject</button>
        </div>
      </div>
    </div>
  );
};

export default SuggestionPanel;
