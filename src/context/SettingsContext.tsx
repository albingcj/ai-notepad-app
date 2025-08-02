import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings } from '../interfaces/types';
import { DEFAULT_SETTINGS } from '../interfaces/constants';
import IPCBridge from '../services/IPCBridge';
import { IpcChannels } from '../interfaces/constants';

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: (key: string, value: any) => void;
  saveSettings: (settings?: AppSettings) => Promise<void>;
  loadSettings: () => Promise<void>;
  resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  // S1: Load settings on mount
  // Retrieves saved settings when the component mounts
  useEffect(() => {
    loadSettings();
  }, []);
  
  // S2: Update specific setting
  // Changes a single setting value
  const updateSetting = (key: string, value: any) => {
    // For nested settings like apiKeys.openai
    if (key.includes('.')) {
      const [parentKey, childKey] = key.split('.');
      setSettings(prev => ({
        ...prev,
        [parentKey]: {
          ...(prev[parentKey as keyof typeof prev] as any),
          [childKey]: value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };
  
  // S3: Save all settings
  // Persists settings to storage
  const saveSettings = async (newSettings?: AppSettings) => {
    try {
      const settingsToSave = newSettings || settings;
      await IPCBridge.invoke(IpcChannels.SETTINGS_SAVE, settingsToSave);
      setSettings(settingsToSave);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  };
  
  // S4: Load settings
  // Retrieves settings from storage
  const loadSettings = async () => {
    try {
      const savedSettings = await IPCBridge.invoke<AppSettings>(IpcChannels.SETTINGS_GET);
      setSettings(savedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      throw error;
    }
  };
  
  // S5: Reset settings
  // Restores default settings
  const resetSettings = async () => {
    try {
      await saveSettings(DEFAULT_SETTINGS);
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  };
  
  const value: SettingsContextType = {
    settings,
    updateSetting,
    saveSettings,
    loadSettings,
    resetSettings
  };
  
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  
  return context;
};
