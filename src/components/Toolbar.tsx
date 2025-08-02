import React from 'react';
import { useTheme } from '../context/ThemeContext';
import '../styles/Toolbar.css';

interface ToolbarProps {
  onNewFile: () => void;
  onOpenFile: () => void;
  onSaveFile: () => void;
  onSaveFileAs: () => void;
  onSettings: () => void;
}

interface ToolItem {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  tooltip: string;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  onNewFile,
  onOpenFile,
  onSaveFile,
  onSaveFileAs,
  onSettings
}) => {
  const { theme, toggleTheme } = useTheme();
  
  // S1: Define toolbar items
  // Creates the list of toolbar buttons and their actions
  const getToolbarItems = (): ToolItem[] => {
    return [
      {
        id: 'new',
        label: 'New',
        icon: '📄',
        onClick: onNewFile,
        tooltip: 'New File (Ctrl+N)'
      },
      {
        id: 'open',
        label: 'Open',
        icon: '📂',
        onClick: onOpenFile,
        tooltip: 'Open File (Ctrl+O)'
      },
      {
        id: 'save',
        label: 'Save',
        icon: '💾',
        onClick: onSaveFile,
        tooltip: 'Save File (Ctrl+S)'
      },
      {
        id: 'save-as',
        label: 'Save As',
        icon: '📋',
        onClick: onSaveFileAs,
        tooltip: 'Save File As (Ctrl+Shift+S)'
      },
      {
        id: 'divider-1',
        label: '',
        icon: '|',
        onClick: () => {},
        tooltip: ''
      },
      {
        id: 'theme',
        label: 'Theme',
        icon: theme === 'dark' ? '☀️' : '🌙',
        onClick: toggleTheme,
        tooltip: 'Toggle Theme (Ctrl+Shift+T)'
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: '⚙️',
        onClick: onSettings,
        tooltip: 'Settings (Ctrl+,)'
      }
    ];
  };
  
  // S2: Handle tool click
  // Processes clicks on toolbar buttons
  const handleToolClick = (toolId: string) => {
    const tool = getToolbarItems().find(item => item.id === toolId);
    if (tool) {
      tool.onClick();
    }
  };
  
  const toolbarItems = getToolbarItems();
  
  return (
    <div className={`toolbar ${theme}`}>
      {toolbarItems.map(tool => (
        <div 
          key={tool.id}
          className={`toolbar-item ${tool.id === 'divider-1' ? 'divider' : ''}`}
          onClick={() => handleToolClick(tool.id)}
          title={tool.tooltip}
        >
          <span className="toolbar-icon">{tool.icon}</span>
          {tool.id !== 'divider-1' && (
            <span className="toolbar-label">{tool.label}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default Toolbar;
