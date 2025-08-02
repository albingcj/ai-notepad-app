// IPC channel names for communication between main and renderer processes
export const IpcChannels = {
  // File operations
  FILE_NEW: 'file:new',
  FILE_OPEN: 'file:open',
  FILE_SAVE: 'file:save',
  FILE_SAVE_AS: 'file:save-as',
  GET_RECENT_FILES: 'file:get-recent',
  
  // Edit operations
  EDIT_UNDO: 'edit:undo',
  EDIT_REDO: 'edit:redo',
  EDIT_CUT: 'edit:cut',
  EDIT_COPY: 'edit:copy',
  EDIT_PASTE: 'edit:paste',
  EDIT_SELECT_ALL: 'edit:select-all',
  EDIT_FIND: 'edit:find',
  EDIT_REPLACE: 'edit:replace',
  
  // View operations
  VIEW_TOGGLE_THEME: 'view:toggle-theme',
  VIEW_ZOOM_IN: 'view:zoom-in',
  VIEW_ZOOM_OUT: 'view:zoom-out',
  VIEW_ZOOM_RESET: 'view:zoom-reset',
  
  // AI operations
  AI_CHECK_GRAMMAR: 'ai:check-grammar',
  AI_REPHRASE_TEXT: 'ai:rephrase-text',
  
  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SAVE: 'settings:save',
  
  // UI
  SHOW_SETTINGS: 'ui:show-settings',
  SHOW_DOCUMENTATION: 'ui:show-documentation',
  
  // Window events
  WINDOW_FOCUSED: 'window:focused',
  WINDOW_BLURRED: 'window:blurred'
};

// Error codes for application errors
export const ErrorCodes = {
  // General errors
  UNKNOWN_ERROR: 'ERR_UNKNOWN',
  VALIDATION_ERROR: 'ERR_VALIDATION',
  
  // File errors
  FILE_NOT_FOUND: 'ERR_FILE_NOT_FOUND',
  FILE_READ_ERROR: 'ERR_FILE_READ',
  FILE_WRITE_ERROR: 'ERR_FILE_WRITE',
  FILE_PERMISSION_ERROR: 'ERR_FILE_PERMISSION',
  
  // API errors
  API_ERROR: 'ERR_API',
  NETWORK_ERROR: 'ERR_NETWORK',
  TIMEOUT_ERROR: 'ERR_TIMEOUT',
  AUTH_ERROR: 'ERR_AUTH',
  RATE_LIMIT_ERROR: 'ERR_RATE_LIMIT',
  
  // LLM errors
  LLM_PARSE_ERROR: 'ERR_LLM_PARSE',
  LLM_INVALID_RESPONSE: 'ERR_LLM_RESPONSE',
  LLM_NOT_AVAILABLE: 'ERR_LLM_UNAVAILABLE'
};

// Default application settings
export const DEFAULT_SETTINGS = {
  theme: 'system', // system, light, dark
  autoSaveInterval: 60000, // 1 minute in milliseconds
  fontSize: 14,
  wordWrap: true,
  defaultLanguage: 'en',
  llmProvider: 'local', // local, openai, anthropic
  apiKeys: {
    openai: '',
    anthropic: ''
  }
};

// Supported LLM operations
export const LLM_OPERATIONS = [
  'grammar-check',
  'rephrase'
];

// Supported languages for grammar checking
export const SUPPORTED_LANGUAGES = [
  'en', // English
  'es', // Spanish
  'fr', // French
  'de', // German
  'it', // Italian
  'pt', // Portuguese
  'nl', // Dutch
  'ru', // Russian
  'zh', // Chinese
  'ja', // Japanese
  'ko'  // Korean
];

// Supported styles for text rephrasing
export const REPHRASE_STYLES = [
  'formal',
  'casual',
  'concise',
  'detailed'
];

// Theme colors
export const THEME_COLORS = {
  light: {
    background: '#ffffff',
    foreground: '#333333',
    primary: '#0078d4',
    secondary: '#2b88d8',
    accent: '#106ebe',
    error: '#d13438',
    warning: '#ffaa44',
    success: '#107c10',
    surface: '#f3f3f3',
    border: '#d1d1d1'
  },
  dark: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    primary: '#0078d4',
    secondary: '#2b88d8',
    accent: '#3a96dd',
    error: '#f1707b',
    warning: '#ffc83d',
    success: '#13a10e',
    surface: '#252525',
    border: '#454545'
  }
};
