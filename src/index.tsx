import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { EditorProvider } from './context/EditorContext';
import ErrorBoundary from './components/ErrorBoundary';

// S1: Main application entry point
// Renders the root React component
function main() {
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <SettingsProvider>
          <ThemeProvider>
            <EditorProvider>
              <App />
            </EditorProvider>
          </ThemeProvider>
        </SettingsProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

// S2: Set up error boundary
// Configures global error handling
function setupErrorBoundary() {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
  });
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
}

// Initialize the application
setupErrorBoundary();
main();
