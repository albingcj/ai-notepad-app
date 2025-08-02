import { useTheme } from '../context/ThemeContext';
import { Theme } from '../interfaces/types';

class UIController {
  private theme: Theme = 'light';
  private isLoading: boolean = false;
  private loadingMessage: string = '';
  private notifications: Array<{ id: string; message: string; type: string }> = [];
  
  // S1: Set theme
  // Updates the application theme
  setTheme(theme: string): void {
    this.theme = theme as Theme;
    
    // Apply theme to document body
    document.body.setAttribute('data-theme', theme);
    
    // Store theme preference
    localStorage.setItem('theme', theme);
  }
  
  // S2: Toggle theme
  // Switches between light and dark themes
  toggleTheme(): void {
    const newTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }
  
  // S3: Show loading indicator
  // Displays a loading overlay with optional message
  showLoading(message: string = 'Loading...'): void {
    this.isLoading = true;
    this.loadingMessage = message;
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('ui:loading', {
      detail: { isLoading: true, message }
    }));
  }
  
  // S4: Hide loading indicator
  // Hides the loading overlay
  hideLoading(): void {
    this.isLoading = false;
    this.loadingMessage = '';
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('ui:loading', {
      detail: { isLoading: false }
    }));
  }
  
  // S5: Show notification
  // Displays a notification message
  showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error'): string {
    const id = `notification-${Date.now()}`;
    
    this.notifications.push({
      id,
      message,
      type
    });
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('ui:notification', {
      detail: { id, message, type }
    }));
    
    // Auto-dismiss after 5 seconds for non-error notifications
    if (type !== 'error') {
      setTimeout(() => {
        this.closeNotification(id);
      }, 5000);
    }
    
    return id;
  }
  
  // S6: Close notification
  // Removes a notification by ID
  closeNotification(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id);
    
    if (index !== -1) {
      this.notifications.splice(index, 1);
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('ui:notification-close', {
        detail: { id }
      }));
    }
  }
  
  // S7: Show modal dialog
  // Displays a modal dialog
  showModal(id: string, props: any = {}): void {
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('ui:modal-show', {
      detail: { id, props }
    }));
  }
  
  // S8: Close modal dialog
  // Closes a modal dialog
  closeModal(id: string): void {
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('ui:modal-close', {
      detail: { id }
    }));
  }
  
  // S9: Handle window resize
  // Adjusts UI elements on window resize
  handleResize(): void {
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('ui:resize'));
  }
  
  // S10: Get theme colors
  // Returns the color palette for the current theme
  getThemeColors(): Record<string, string> {
    const lightTheme = {
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
    };
    
    const darkTheme = {
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
    };
    
    return this.theme === 'dark' ? darkTheme : lightTheme;
  }
}

export default new UIController();
