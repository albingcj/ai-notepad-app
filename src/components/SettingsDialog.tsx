import React, { useEffect, useState } from 'react';
import '../styles/SettingsDialog.css';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';

interface SettingsDialogProps {
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ onClose }) => {
  const { settings, updateSetting, saveSettings, resetSettings } = useSettings();
  const { theme } = useTheme();
  const [localSettings, setLocalSettings] = useState({ ...settings });
  
  // S1: Show settings dialog
  // Displays the settings dialog with current settings
  useEffect(() => {
    // Initialize local settings with current settings
    setLocalSettings({ ...settings });
  }, [settings]);
  
  // S2: Update setting value
  // Updates a specific setting in the local state
  const handleSettingChange = (key: string, value: any) => {
    // For nested settings like apiKeys
    if (key.includes('.')) {
      const [parentKey, childKey] = key.split('.');
      setLocalSettings(prev => ({
        ...prev,
        [parentKey]: {
          ...(prev[parentKey as keyof typeof prev] as any),
          [childKey]: value
        }
      }));
    } else {
      setLocalSettings(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };
  
  // S3: Save settings
  // Saves the updated settings
  const handleSaveSettings = () => {
    saveSettings(localSettings);
    onClose();
  };
  
  // S4: Reset settings
  // Resets settings to default values
  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      resetSettings();
      onClose();
    }
  };
  
  return (
    <div className="settings-overlay">
      <div className={`settings-dialog ${theme}`}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        
        <div className="settings-content">
          <div className="settings-section">
            <h3>Appearance</h3>
            
            <div className="setting-item">
              <label htmlFor="theme">Theme:</label>
              <select
                id="theme"
                value={localSettings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
              >
                <option value="system">System Default</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            
            <div className="setting-item">
              <label htmlFor="fontSize">Font Size:</label>
              <input
                id="fontSize"
                type="number"
                min="8"
                max="32"
                value={localSettings.fontSize}
                onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
              />
            </div>
          </div>
          
          <div className="settings-section">
            <h3>Editor</h3>
            
            <div className="setting-item">
              <label htmlFor="wordWrap">Word Wrap:</label>
              <input
                id="wordWrap"
                type="checkbox"
                checked={localSettings.wordWrap}
                onChange={(e) => handleSettingChange('wordWrap', e.target.checked)}
              />
            </div>
            
            <div className="setting-item">
              <label htmlFor="autoSaveInterval">Auto Save Interval (ms):</label>
              <input
                id="autoSaveInterval"
                type="number"
                min="5000"
                step="5000"
                value={localSettings.autoSaveInterval}
                onChange={(e) => handleSettingChange('autoSaveInterval', parseInt(e.target.value))}
              />
            </div>
          </div>
          
          <div className="settings-section">
            <h3>AI Features</h3>
            
            <div className="setting-item">
              <label htmlFor="llmProvider">LLM Provider:</label>
              <select
                id="llmProvider"
                value={localSettings.llmProvider}
                onChange={(e) => handleSettingChange('llmProvider', e.target.value)}
              >
                <option value="local">Local (Ollama)</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>
            
            <div className="setting-item">
              <label htmlFor="defaultLanguage">Default Language:</label>
              <select
                id="defaultLanguage"
                value={localSettings.defaultLanguage}
                onChange={(e) => handleSettingChange('defaultLanguage', e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="nl">Dutch</option>
                <option value="ru">Russian</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
              </select>
            </div>
            
            {(localSettings.llmProvider === 'openai' || localSettings.llmProvider === 'anthropic') && (
              <div className="api-key-settings">
                {localSettings.llmProvider === 'openai' && (
                  <div className="setting-item">
                    <label htmlFor="openaiKey">OpenAI API Key:</label>
                    <input
                      id="openaiKey"
                      type="password"
                      value={localSettings.apiKeys?.openai || ''}
                      onChange={(e) => handleSettingChange('apiKeys.openai', e.target.value)}
                      placeholder="Enter your OpenAI API key"
                    />
                  </div>
                )}
                
                {localSettings.llmProvider === 'anthropic' && (
                  <div className="setting-item">
                    <label htmlFor="anthropicKey">Anthropic API Key:</label>
                    <input
                      id="anthropicKey"
                      type="password"
                      value={localSettings.apiKeys?.anthropic || ''}
                      onChange={(e) => handleSettingChange('apiKeys.anthropic', e.target.value)}
                      placeholder="Enter your Anthropic API key"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="settings-footer">
          <button className="reset-button" onClick={handleResetSettings}>Reset to Defaults</button>
          <div className="action-buttons">
            <button className="cancel-button" onClick={onClose}>Cancel</button>
            <button className="save-button" onClick={handleSaveSettings}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;
