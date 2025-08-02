import { IpcChannels } from '../interfaces/constants';

class IPCBridge {
  // S1: Send IPC message to main process
  // Sends a one-way message to the main process
  send(channel: string, data?: any): void {
    if (!this.validateChannel(channel)) {
      console.error(`Invalid IPC channel: ${channel}`);
      return;
    }
    
    if (data !== undefined && !this.validateData(data)) {
      console.error('Invalid IPC data');
      return;
    }
    
    try {
      // Use the preload script's exposed API
      if (window.electronAPI) {
        // Get the method name from the channel
        const methodName = this.getMethodName(channel);
        
        if (typeof (window.electronAPI as any)[methodName] === 'function') {
          (window.electronAPI as any)[methodName](data);
        } else {
          console.error(`IPC method not available: ${methodName}`);
        }
      } else {
        console.error('Electron API not available');
      }
    } catch (error) {
      console.error(`Error sending IPC message on channel ${channel}:`, error);
    }
  }
  
  // S2: Invoke IPC method and get response
  // Sends a request to the main process and returns a promise with the response
  async invoke<T>(channel: string, data?: any): Promise<T> {
    if (!this.validateChannel(channel)) {
      throw new Error(`Invalid IPC channel: ${channel}`);
    }
    
    if (data !== undefined && !this.validateData(data)) {
      throw new Error('Invalid IPC data');
    }
    
    try {
      // Use the preload script's exposed API
      if (window.electronAPI) {
        // The method name depends on the channel
        const methodName = this.getMethodName(channel);
        
        if (typeof (window.electronAPI as any)[methodName] !== 'function') {
          throw new Error(`IPC method not available: ${methodName}`);
        }
        
        return await (window.electronAPI as any)[methodName](data);
      } else {
        throw new Error('Electron API not available');
      }
    } catch (error) {
      console.error(`Error invoking IPC method on channel ${channel}:`, error);
      throw error;
    }
  }
  
  // S3: Register event listener
  // Sets up a listener for events from the main process
  on(channel: string, callback: (...args: any[]) => void): () => void {
    if (!this.validateChannel(channel)) {
      console.error(`Invalid IPC channel: ${channel}`);
      return () => {};
    }
    
    try {
      // Use the preload script's exposed API
      if (window.electronAPI) {
        return window.electronAPI.on(channel, callback);
      } else {
        console.error('Electron API not available');
        return () => {};
      }
    } catch (error) {
      console.error(`Error registering IPC listener on channel ${channel}:`, error);
      return () => {};
    }
  }
  
  // S4: Remove event listener
  // Removes a previously registered event listener
  removeListener(channel: string, callback: (...args: any[]) => void): void {
    if (!this.validateChannel(channel)) {
      console.error(`Invalid IPC channel: ${channel}`);
      return;
    }
    
    try {
      // This would be handled by the returned function from the 'on' method
      // Nothing to do here since we return a cleanup function from 'on'
    } catch (error) {
      console.error(`Error removing IPC listener from channel ${channel}:`, error);
    }
  }
  
  // S5: Validate channel name
  // Ensures that the channel name is valid and allowed
  validateChannel(channel: string): boolean {
    // Check if channel is a valid string
    if (!channel || typeof channel !== 'string') {
      return false;
    }
    
    // Check if channel is in the allowed list
    const allowedChannels = Object.values(IpcChannels);
    return allowedChannels.includes(channel as any);
  }
  
  // S6: Validate data
  // Ensures that the data being sent is safe
  validateData(data: any): boolean {
    // Prevent prototype pollution
    if (data && typeof data === 'object') {
      if (Object.prototype.hasOwnProperty.call(data, '__proto__') ||
          Object.prototype.hasOwnProperty.call(data, 'constructor')) {
        return false;
      }
      
      // Recursively check nested objects
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          if (!this.validateData(data[key])) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
  
  // Helper method to get method name from channel
  private getMethodName(channel: string): string {
    // Special cases for method name mapping
    const methodMap: Record<string, string> = {
      'file:get-recent': 'getRecentFiles',
      'file:new': 'fileNew',
      'file:open': 'fileOpen',
      'file:save': 'fileSave',
      'file:save-as': 'fileSaveAs',
      'ai:check-grammar': 'aiCheckGrammar',
      'ai:rephrase-text': 'aiRephraseText',
      'settings:get': 'settingsGet',
      'settings:save': 'settingsSave',
      'ui:show-settings': 'uiShowSettings',
      'ui:show-documentation': 'uiShowDocumentation',
      'view:toggle-theme': 'viewToggleTheme',
      'view:zoom-in': 'viewZoomIn',
      'view:zoom-out': 'viewZoomOut',
      'view:zoom-reset': 'viewZoomReset',
      'edit:undo': 'editUndo',
      'edit:redo': 'editRedo',
      'edit:cut': 'editCut',
      'edit:copy': 'editCopy',
      'edit:paste': 'editPaste',
      'edit:select-all': 'editSelectAll',
      'edit:find': 'editFind',
      'edit:replace': 'editReplace'
    };
    
    return methodMap[channel] || channel.replace(/^([^:]+):([^:]+)$/, (_, namespace, action) => {
      return `${namespace}${action.charAt(0).toUpperCase()}${action.slice(1)}`;
    });
  }
}

const ipcBridge = new IPCBridge();
export default ipcBridge;
