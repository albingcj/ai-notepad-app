import { Menu, MenuItem, app, BrowserWindow, dialog } from 'electron';
import * as electronLog from 'electron-log';
import { IpcChannels } from './constants';

export class MenuManager {
  // S1: Build application menu
  // Creates and sets the application menu
  buildMenu(window: BrowserWindow): Menu {
    try {
      const template = process.platform === 'darwin'
        ? this.buildMacOSMenu(window)
        : this.buildWindowsLinuxMenu(window);
      
      const menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
      
      electronLog.info('Application menu built');
      return menu;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Error building menu:', errorMessage);
      throw error;
    }
  }
  
  // S2: Set up keyboard shortcuts
  // Configures keyboard shortcuts for menu items
  setupAccelerators(template: any[]): any[] {
    try {
      // Add accelerators (keyboard shortcuts) to menu items
      const addAccelerators = (items: any[]) => {
        return items.map(item => {
          if (item.submenu) {
            item.submenu = addAccelerators(item.submenu);
          }
          
          // Add specific accelerators based on item id
          switch (item.id) {
            case 'new-file':
              item.accelerator = 'CmdOrCtrl+N';
              break;
            case 'open-file':
              item.accelerator = 'CmdOrCtrl+O';
              break;
            case 'save-file':
              item.accelerator = 'CmdOrCtrl+S';
              break;
            case 'save-as':
              item.accelerator = 'CmdOrCtrl+Shift+S';
              break;
            case 'find':
              item.accelerator = 'CmdOrCtrl+F';
              break;
            case 'replace':
              item.accelerator = 'CmdOrCtrl+H';
              break;
            case 'undo':
              item.accelerator = 'CmdOrCtrl+Z';
              break;
            case 'redo':
              item.accelerator = 'CmdOrCtrl+Shift+Z';
              break;
            case 'cut':
              item.accelerator = 'CmdOrCtrl+X';
              break;
            case 'copy':
              item.accelerator = 'CmdOrCtrl+C';
              break;
            case 'paste':
              item.accelerator = 'CmdOrCtrl+V';
              break;
            case 'select-all':
              item.accelerator = 'CmdOrCtrl+A';
              break;
            case 'toggle-theme':
              item.accelerator = 'CmdOrCtrl+Shift+T';
              break;
            case 'check-grammar':
              item.accelerator = 'CmdOrCtrl+G';
              break;
            case 'rephrase-text':
              item.accelerator = 'CmdOrCtrl+R';
              break;
            case 'settings':
              item.accelerator = 'CmdOrCtrl+,';
              break;
          }
          
          return item;
        });
      };
      
      return addAccelerators(template);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Error setting up accelerators:', errorMessage);
      return template; // Return original template if error occurs
    }
  }
  
  // S3: Handle menu item clicks
  // Creates click handlers for menu items
  handleMenuClick(menuItem: MenuItem, window: BrowserWindow): void {
    try {
      if (!window || window.isDestroyed()) {
        electronLog.warn('Attempted to handle menu click with invalid window');
        return;
      }
      
      switch (menuItem.id) {
        // File operations
        case 'new-file':
          window.webContents.send(IpcChannels.FILE_NEW);
          break;
        case 'open-file':
          window.webContents.send(IpcChannels.FILE_OPEN);
          break;
        case 'save-file':
          window.webContents.send(IpcChannels.FILE_SAVE);
          break;
        case 'save-as':
          window.webContents.send(IpcChannels.FILE_SAVE_AS);
          break;
        case 'recent-file':
          window.webContents.send(IpcChannels.FILE_OPEN, menuItem.toolTip); // Using toolTip to store file path
          break;
        
        // Edit operations
        case 'undo':
          window.webContents.send(IpcChannels.EDIT_UNDO);
          break;
        case 'redo':
          window.webContents.send(IpcChannels.EDIT_REDO);
          break;
        case 'cut':
          window.webContents.send(IpcChannels.EDIT_CUT);
          break;
        case 'copy':
          window.webContents.send(IpcChannels.EDIT_COPY);
          break;
        case 'paste':
          window.webContents.send(IpcChannels.EDIT_PASTE);
          break;
        case 'select-all':
          window.webContents.send(IpcChannels.EDIT_SELECT_ALL);
          break;
        case 'find':
          window.webContents.send(IpcChannels.EDIT_FIND);
          break;
        case 'replace':
          window.webContents.send(IpcChannels.EDIT_REPLACE);
          break;
        
        // View operations
        case 'toggle-theme':
          window.webContents.send(IpcChannels.VIEW_TOGGLE_THEME);
          break;
        case 'zoom-in':
          window.webContents.send(IpcChannels.VIEW_ZOOM_IN);
          break;
        case 'zoom-out':
          window.webContents.send(IpcChannels.VIEW_ZOOM_OUT);
          break;
        case 'reset-zoom':
          window.webContents.send(IpcChannels.VIEW_ZOOM_RESET);
          break;
        
        // AI operations
        case 'check-grammar':
          window.webContents.send(IpcChannels.AI_CHECK_GRAMMAR);
          break;
        case 'rephrase-text':
          window.webContents.send(IpcChannels.AI_REPHRASE_TEXT);
          break;
        case 'rephrase-formal':
          window.webContents.send(IpcChannels.AI_REPHRASE_TEXT, 'formal');
          break;
        case 'rephrase-casual':
          window.webContents.send(IpcChannels.AI_REPHRASE_TEXT, 'casual');
          break;
        case 'rephrase-concise':
          window.webContents.send(IpcChannels.AI_REPHRASE_TEXT, 'concise');
          break;
        case 'rephrase-detailed':
          window.webContents.send(IpcChannels.AI_REPHRASE_TEXT, 'detailed');
          break;
        
        // Settings
        case 'settings':
          window.webContents.send(IpcChannels.SHOW_SETTINGS);
          break;
        
        // Help
        case 'about':
          this.showAboutDialog();
          break;
        case 'documentation':
          window.webContents.send(IpcChannels.SHOW_DOCUMENTATION);
          break;
        
        default:
          electronLog.warn(`Unhandled menu item: ${menuItem.id}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Error handling menu click:', errorMessage);
    }
  }
  
  // S4: Build context menu
  // Creates a context menu for right-clicks
  buildContextMenu(window: BrowserWindow, hasSelection: boolean): Menu {
    try {
      const template: any[] = [
        {
          label: 'Cut',
          id: 'cut',
          enabled: hasSelection,
          click: () => {
            try {
              window.webContents.send(IpcChannels.EDIT_CUT);
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              electronLog.error('Error sending cut command:', errorMessage);
            }
          }
        },
        {
          label: 'Copy',
          id: 'copy',
          enabled: hasSelection,
          click: () => {
            try {
              window.webContents.send(IpcChannels.EDIT_COPY);
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              electronLog.error('Error sending copy command:', errorMessage);
            }
          }
        },
        {
          label: 'Paste',
          id: 'paste',
          click: () => {
            try {
              window.webContents.send(IpcChannels.EDIT_PASTE);
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              electronLog.error('Error sending paste command:', errorMessage);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Check Grammar',
          id: 'check-grammar',
          enabled: hasSelection,
          click: () => {
            try {
              window.webContents.send(IpcChannels.AI_CHECK_GRAMMAR);
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              electronLog.error('Error sending grammar check command:', errorMessage);
            }
          }
        },
        {
          label: 'Rephrase Text',
          id: 'rephrase-text',
          enabled: hasSelection,
          submenu: [
            {
              label: 'Formal',
              id: 'rephrase-formal',
              click: () => {
                try {
                  window.webContents.send(IpcChannels.AI_REPHRASE_TEXT, 'formal');
                } catch (error: unknown) {
                  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                  electronLog.error('Error sending formal rephrase command:', errorMessage);
                }
              }
            },
            {
              label: 'Casual',
              id: 'rephrase-casual',
              click: () => {
                try {
                  window.webContents.send(IpcChannels.AI_REPHRASE_TEXT, 'casual');
                } catch (error: unknown) {
                  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                  electronLog.error('Error sending casual rephrase command:', errorMessage);
                }
              }
            },
            {
              label: 'Concise',
              id: 'rephrase-concise',
              click: () => {
                try {
                  window.webContents.send(IpcChannels.AI_REPHRASE_TEXT, 'concise');
                } catch (error: unknown) {
                  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                  electronLog.error('Error sending concise rephrase command:', errorMessage);
                }
              }
            },
            {
              label: 'Detailed',
              id: 'rephrase-detailed',
              click: () => {
                try {
                  window.webContents.send(IpcChannels.AI_REPHRASE_TEXT, 'detailed');
                } catch (error: unknown) {
                  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                  electronLog.error('Error sending detailed rephrase command:', errorMessage);
                }
              }
            }
          ]
        }
      ];
      
      return Menu.buildFromTemplate(template);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Error building context menu:', errorMessage);
      throw error;
    }
  }
  
  // S5: Build macOS-specific menu
  // Creates a menu template for macOS
  buildMacOSMenu(window: BrowserWindow): any[] {
    try {
      const template: any[] = [
        {
          label: app.name,
          submenu: [
            {
              label: `About ${app.name}`,
              id: 'about',
              click: () => {
                try {
                  this.showAboutDialog();
                } catch (error: unknown) {
                  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                  electronLog.error('Error showing about dialog:', errorMessage);
                }
              }
            },
            { type: 'separator' },
            {
              label: 'Preferences...',
              id: 'settings',
              click: () => {
                try {
                  this.handleMenuClick({ id: 'settings' } as MenuItem, window);
                } catch (error: unknown) {
                  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                  electronLog.error('Error handling settings click:', errorMessage);
                }
              }
            },
            { type: 'separator' },
            {
              label: 'Services',
              role: 'services',
            },
            { type: 'separator' },
            {
              label: `Hide ${app.name}`,
              role: 'hide'
            },
            {
              label: 'Hide Others',
              role: 'hideOthers'
            },
            {
              label: 'Show All',
              role: 'unhide'
            },
            { type: 'separator' },
            {
              label: `Quit ${app.name}`,
              role: 'quit'
            }
          ]
        },
        {
          label: 'File',
          submenu: this.getFileSubmenu(window)
        },
        {
          label: 'Edit',
          submenu: this.getEditSubmenu(window)
        },
        {
          label: 'View',
          submenu: this.getViewSubmenu(window)
        },
        {
          label: 'AI',
          submenu: this.getAISubmenu(window)
        },
        {
          label: 'Window',
          role: 'window',
          submenu: [
            { role: 'minimize' },
            { role: 'zoom' },
            { type: 'separator' },
            { role: 'front' }
          ]
        },
        {
          label: 'Help',
          role: 'help',
          submenu: this.getHelpSubmenu(window)
        }
      ];
      
      return this.setupAccelerators(template);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Error building macOS menu:', errorMessage);
      throw error;
    }
  }
  
  // S6: Build Windows/Linux menu
  // Creates a menu template for Windows and Linux
  buildWindowsLinuxMenu(window: BrowserWindow): any[] {
    try {
      const template: any[] = [
        {
          label: 'File',
          submenu: this.getFileSubmenu(window)
        },
        {
          label: 'Edit',
          submenu: this.getEditSubmenu(window)
        },
        {
          label: 'View',
          submenu: this.getViewSubmenu(window)
        },
        {
          label: 'AI',
          submenu: this.getAISubmenu(window)
        },
        {
          label: 'Help',
          submenu: [
            {
              label: `About ${app.name}`,
              id: 'about',
              click: () => {
                try {
                  this.showAboutDialog();
                } catch (error: unknown) {
                  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                  electronLog.error('Error showing about dialog:', errorMessage);
                }
              }
            },
            ...this.getHelpSubmenu(window)
          ]
        }
      ];
      
      return this.setupAccelerators(template);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Error building Windows/Linux menu:', errorMessage);
      throw error;
    }
  }
  
  // S7: Update menu state based on application state
  // Updates menu items based on current app state
  updateMenuState(state: { hasSelection: boolean, canUndo: boolean, canRedo: boolean }, _window: BrowserWindow): void {
    try {
      const menu = Menu.getApplicationMenu();
      if (!menu) {
        electronLog.warn('No application menu found to update');
        return;
      }
      
      // Update menu items based on state
      const updateMenuItem = (id: string, props: { enabled?: boolean, visible?: boolean }) => {
        try {
          const items = this.findMenuItemsById(menu.items, id);
          items.forEach(item => {
            if (props.enabled !== undefined) item.enabled = props.enabled;
            if (props.visible !== undefined) item.visible = props.visible;
          });
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          electronLog.error(`Error updating menu item ${id}:`, errorMessage);
        }
      };
      
      // Update edit operations
      updateMenuItem('undo', { enabled: state.canUndo });
      updateMenuItem('redo', { enabled: state.canRedo });
      updateMenuItem('cut', { enabled: state.hasSelection });
      updateMenuItem('copy', { enabled: state.hasSelection });
      
      // Update AI operations
      updateMenuItem('check-grammar', { enabled: state.hasSelection });
      updateMenuItem('rephrase-text', { enabled: state.hasSelection });
      updateMenuItem('rephrase-formal', { enabled: state.hasSelection });
      updateMenuItem('rephrase-casual', { enabled: state.hasSelection });
      updateMenuItem('rephrase-concise', { enabled: state.hasSelection });
      updateMenuItem('rephrase-detailed', { enabled: state.hasSelection });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Error updating menu state:', errorMessage);
    }
  }
  
  // Helper method to find menu items by ID
  private findMenuItemsById(items: MenuItem[], id: string): MenuItem[] {
    const result: MenuItem[] = [];
    
    const search = (menuItems: MenuItem[]) => {
      menuItems.forEach(item => {
        if (item.id === id) {
          result.push(item);
        }
        
        if (item.submenu) {
          search(item.submenu.items);
        }
      });
    };
    
    search(items);
    return result;
  }
  
  // Helper method to show about dialog
  private showAboutDialog(): void {
    try {
      dialog.showMessageBox({
        title: `About ${app.name}`,
        message: `${app.name} v${app.getVersion()}`,
        detail: 'An AI-powered notepad application with grammar checking and text rephrasing capabilities.',
        buttons: ['OK'],
        type: 'info'
      }).catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        electronLog.error('Error showing about dialog:', errorMessage);
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      electronLog.error('Error in showAboutDialog:', errorMessage);
    }
  }
  
  // Helper method to get File submenu
  private getFileSubmenu(window: BrowserWindow): any[] {
    return [
      {
        label: 'New',
        id: 'new-file',
        click: () => this.handleMenuClick({ id: 'new-file' } as MenuItem, window)
      },
      {
        label: 'Open...',
        id: 'open-file',
        click: () => this.handleMenuClick({ id: 'open-file' } as MenuItem, window)
      },
      {
        label: 'Open Recent',
        submenu: [
          {
            label: 'No Recent Files',
            enabled: false,
            id: 'no-recent-files'
          }
        ]
      },
      { type: 'separator' },
      {
        label: 'Save',
        id: 'save-file',
        click: () => this.handleMenuClick({ id: 'save-file' } as MenuItem, window)
      },
      {
        label: 'Save As...',
        id: 'save-as',
        click: () => this.handleMenuClick({ id: 'save-as' } as MenuItem, window)
      },
      { type: 'separator' },
      {
        label: 'Settings',
        id: 'settings',
        click: () => this.handleMenuClick({ id: 'settings' } as MenuItem, window)
      },
      { type: 'separator' },
      {
        label: 'Exit',
        role: 'quit'
      }
    ];
  }
  
  // Helper method to get Edit submenu
  private getEditSubmenu(window: BrowserWindow): any[] {
    return [
      {
        label: 'Undo',
        id: 'undo',
        click: () => this.handleMenuClick({ id: 'undo' } as MenuItem, window)
      },
      {
        label: 'Redo',
        id: 'redo',
        click: () => this.handleMenuClick({ id: 'redo' } as MenuItem, window)
      },
      { type: 'separator' },
      {
        label: 'Cut',
        id: 'cut',
        click: () => this.handleMenuClick({ id: 'cut' } as MenuItem, window)
      },
      {
        label: 'Copy',
        id: 'copy',
        click: () => this.handleMenuClick({ id: 'copy' } as MenuItem, window)
      },
      {
        label: 'Paste',
        id: 'paste',
        click: () => this.handleMenuClick({ id: 'paste' } as MenuItem, window)
      },
      {
        label: 'Select All',
        id: 'select-all',
        click: () => this.handleMenuClick({ id: 'select-all' } as MenuItem, window)
      },
      { type: 'separator' },
      {
        label: 'Find...',
        id: 'find',
        click: () => this.handleMenuClick({ id: 'find' } as MenuItem, window)
      },
      {
        label: 'Replace...',
        id: 'replace',
        click: () => this.handleMenuClick({ id: 'replace' } as MenuItem, window)
      }
    ];
  }
  
  // Helper method to get View submenu
  private getViewSubmenu(window: BrowserWindow): any[] {
    return [
      {
        label: 'Toggle Theme',
        id: 'toggle-theme',
        click: () => this.handleMenuClick({ id: 'toggle-theme' } as MenuItem, window)
      },
      { type: 'separator' },
      {
        label: 'Zoom In',
        id: 'zoom-in',
        click: () => this.handleMenuClick({ id: 'zoom-in' } as MenuItem, window)
      },
      {
        label: 'Zoom Out',
        id: 'zoom-out',
        click: () => this.handleMenuClick({ id: 'zoom-out' } as MenuItem, window)
      },
      {
        label: 'Reset Zoom',
        id: 'reset-zoom',
        click: () => this.handleMenuClick({ id: 'reset-zoom' } as MenuItem, window)
      },
      { type: 'separator' },
      {
        label: 'Toggle Developer Tools',
        role: 'toggleDevTools'
      }
    ];
  }
  
  // Helper method to get AI submenu
  private getAISubmenu(window: BrowserWindow): any[] {
    return [
      {
        label: 'Check Grammar',
        id: 'check-grammar',
        click: () => this.handleMenuClick({ id: 'check-grammar' } as MenuItem, window)
      },
      {
        label: 'Rephrase Text',
        id: 'rephrase-text',
        submenu: [
          {
            label: 'Formal',
            id: 'rephrase-formal',
            click: () => this.handleMenuClick({ id: 'rephrase-formal' } as MenuItem, window)
          },
          {
            label: 'Casual',
            id: 'rephrase-casual',
            click: () => this.handleMenuClick({ id: 'rephrase-casual' } as MenuItem, window)
          },
          {
            label: 'Concise',
            id: 'rephrase-concise',
            click: () => this.handleMenuClick({ id: 'rephrase-concise' } as MenuItem, window)
          },
          {
            label: 'Detailed',
            id: 'rephrase-detailed',
            click: () => this.handleMenuClick({ id: 'rephrase-detailed' } as MenuItem, window)
          }
        ]
      }
    ];
  }
  
  // Helper method to get Help submenu
  private getHelpSubmenu(window: BrowserWindow): any[] {
    return [
      {
        label: 'Documentation',
        id: 'documentation',
        click: () => this.handleMenuClick({ id: 'documentation' } as MenuItem, window)
      }
    ];
  }
}
