You are an expert senior software architect and full-stack developer with 10+ years of experience in Electron.js desktop application development, Node.js backend systems, React frontend development, and Large Language Model integration. You specialize in creating production-ready, secure, and performant desktop applications with modern AI capabilities.



I need to create a complete Electron.js desktop notepad application that functions like Grammarly, allowing users to select text and receive AI-powered grammar checking and rephrasing suggestions. The application should be built using modern best practices, secure IPC communication, and integrate with LLM services for text processing. This is for a developer who is new to Electron.js but familiar with Python, React, and Angular.



Create a complete, production-ready Electron.js desktop notepad application with the following specifications:

1. **Core Application Architecture**
2. **Text Editor Implementation** 
3. **Text Selection & Context Menu System**
4. **LLM Integration Service**
5. **User Interface & Styling**
6. **Security & Performance Features**
7. **Testing & Documentation**




- Multi-process Electron architecture (Main Process + Renderer Process + Preload Script)
- Secure IPC communication using contextBridge
- Context isolation enabled, Node.js integration disabled in renderer
- Modern ES6+ JavaScript with proper error handling
- Modular code structure with separation of concerns
- Local LLM integration using Ollama (preferred) or cloud API fallback



- Content Security Policy (CSP) implementation
- Input validation and sanitization for all user inputs
- Secure API key management using environment variables
- Rate limiting for LLM API calls
- No direct Node.js access in renderer process
- Proper preload script with minimal API exposure



1. **File Operations**: New, Open, Save, Save As, Recent Files, Auto-save
2. **Text Editor**: Rich text editing, syntax highlighting, word wrap, find/replace
3. **Text Selection**: Mouse/keyboard selection, word/line selection, selection persistence
4. **Context Menu**: Right-click menu with grammar check and rephrase options
5. **Grammar Checking**: AI-powered grammar analysis with inline suggestions
6. **Text Rephrasing**: Multiple rephrasing options with style variations
7. **UI Components**: Menu bar, toolbar, status bar, settings dialog
8. **Themes**: Light/dark theme support with system detection
9. **Auto-save**: Configurable auto-save intervals with backup system
10. **Performance**: Optimized for large documents, responsive UI




**package.json Requirements:**
- Include all necessary dependencies: electron, electron-builder, any UI libraries
- Configure proper main entry point and build scripts
- Set up development and production environment scripts
- Include security-focused electron settings

**main.js Requirements:**
- Implement secure BrowserWindow creation with context isolation
- Set up application lifecycle management (ready, window-all-closed, activate)
- Configure proper CSP headers and security settings
- Implement graceful error handling and logging

**window-manager.js Requirements:**
- Create and manage application windows with proper security settings
- Handle window events (close, minimize, maximize, focus)
- Implement window state persistence (size, position)
- Configure development tools access for debugging

**file-handler.js Requirements:**
- Implement all file operations with proper error handling
- Support multiple file formats (txt, md, rtf)
- Create auto-save system with configurable intervals
- Manage recent files list with persistence
- Implement backup and recovery system

**menu-manager.js Requirements:**
- Create native application menu (File, Edit, View, Window, Help)
- Implement keyboard shortcuts (accelerators) for all major functions
- Handle menu item clicks with proper IPC communication
- Support platform-specific menu adjustments (macOS vs Windows/Linux)

**llm-service.js Requirements:**
- Implement local LLM integration using Ollama
- Create fallback cloud API integration (OpenAI/Anthropic)
- Implement request queuing and rate limiting
- Add caching system for repeated requests
- Include comprehensive error handling and timeout management
- Support multiple LLM operations: grammar check, rephrase, style adjustment

**index.html Requirements:**
- Semantic HTML5 structure with proper accessibility attributes
- Include CSP meta tag for security
- Responsive layout supporting multiple screen sizes
- Modern CSS Grid/Flexbox layout
- Support for themes and dynamic styling

**styles.css Requirements:**
- Modern CSS with CSS custom properties for theming
- Light and dark theme implementations
- Responsive design for different window sizes
- Smooth animations and transitions
- Focus indicators for accessibility
- Print-friendly styles

**renderer.js Requirements:**
- Initialize all UI components and event listeners
- Set up secure IPC communication with main process
- Implement keyboard shortcuts and user interactions
- Manage application state and UI updates
- Handle window resize and responsive behavior

**text-editor.js Requirements:**
- Create rich text editor with syntax highlighting
- Implement undo/redo functionality with history management
- Support find and replace with regex options
- Add word wrap, line numbers, and formatting options
- Optimize performance for large documents
- Implement auto-completion and text suggestions

**selection-handler.js Requirements:**
- Detect and manage text selection (mouse, keyboard, programmatic)
- Support word, line, and paragraph selection modes
- Maintain selection state during UI operations
- Implement selection highlighting with multiple styles
- Handle selection persistence during context menu operations

**ui-controller.js Requirements:**
- Manage UI state (toolbar, status bar, panels)
- Handle theme switching and preferences
- Implement loading states and progress indicators
- Manage modal dialogs and user notifications
- Control responsive layout adjustments

**preload.js Requirements:**
- Expose minimal, secure API to renderer process
- Use contextBridge for all IPC communication
- Validate all inputs and outputs
- Implement proper error handling
- Document all exposed APIs

**constants.js Requirements:**
- Define all IPC channel names and message formats
- Include application constants and configuration
- Define error codes and status messages
- Set up theme and styling constants



Implement comprehensive LLM integration with the following features:

1. **Grammar Checking System:**
   - Analyze selected text for grammar, spelling, and punctuation errors
   - Provide confidence scores for suggestions
   - Support multiple languages and writing styles
   - Implement batch processing for large selections
   - Cache results to avoid redundant API calls

2. **Text Rephrasing Engine:**
   - Generate multiple rephrasing options for selected text
   - Support different styles: formal, casual, concise, detailed
   - Maintain original meaning while improving clarity
   - Provide preview functionality before applying changes
   - Track user preferences for suggestion types

3. **Performance Optimization:**
   - Implement request debouncing to prevent excessive API calls
   - Use Web Workers for text processing (if applicable)
   - Create efficient caching system with LRU eviction
   - Handle rate limiting gracefully with user feedback
   - Provide offline mode with basic spell checking

4. **User Experience Features:**
   - Inline highlighting of errors with color coding
   - Tooltip suggestions on hover
   - Accept/reject individual suggestions
   - Batch apply multiple suggestions with review
   - Undo functionality for all AI-assisted changes



- Use modern ES6+ features with proper async/await patterns
- Implement comprehensive error handling with user-friendly messages
- Add extensive JSDoc comments for all functions and classes
- Follow consistent naming conventions and code formatting
- Include input validation for all user inputs and API responses
- Implement logging system for debugging and monitoring
- Use TypeScript types in JSDoc for better IDE support
- Create modular, reusable components with single responsibility
- Optimize performance with lazy loading and efficient DOM manipulation
- Implement proper memory management to prevent leaks



Include basic testing setup with:
- Unit test examples for core business logic
- Integration test examples for IPC communication
- Manual testing instructions for each major feature
- Performance testing guidelines for large documents
- Cross-platform testing checklist
- Security testing recommendations




Provide the complete implementation in the following format:

1. **Project Setup Section:**
   - Complete package.json with all dependencies and scripts
   - Installation and setup instructions
   - Development environment configuration

2. **Core Application Files:**
   - All main process files with complete implementation
   - All renderer process files with complete implementation
   - Preload script with secure API definitions
   - Shared constants and utilities

3. **Styling and Assets:**
   - Complete CSS with theme support
   - Any required asset files or configurations

4. **Documentation:**
   - Comprehensive README.md with setup instructions
   - API documentation for IPC channels
   - User guide for application features
   - Troubleshooting guide

5. **Testing and Quality Assurance:**
   - Test file examples
   - Manual testing checklist
   - Performance optimization tips
   - Security checklist verification

For each file, provide:
- Complete, production-ready code
- Extensive comments explaining functionality
- Error handling for all operations
- Security considerations implementation
- Performance optimization techniques
- Cross-platform compatibility considerations



Here's an example of the expected code quality and structure:

```
/**
 * Main Process Window Manager
 * Handles BrowserWindow creation, management, and security configuration
 * @author AI Assistant
 * @version 1.0.0
 */

const { BrowserWindow, app } = require('electron');
const path = require('path');

class WindowManager {
    constructor() {
        this.mainWindow = null;
        this.isDevelopment = process.env.NODE_ENV === 'development';
    }

    /**
     * Creates the main application window with secure configuration
     * @returns {BrowserWindow} The created window instance
     * @throws {Error} If window creation fails
     */
    createMainWindow() {
        try {
            // Security-first BrowserWindow configuration
            this.mainWindow = new BrowserWindow({
                width: 1200,
                height: 800,
                minWidth: 800,
                minHeight: 600,
                webPreferences: {
                    nodeIntegration: false,           // Security: Disable Node.js in renderer
                    contextIsolation: true,           // Security: Enable context isolation
                    enableRemoteModule: false,        // Security: Disable remote module
                    preload: path.join(__dirname, '../preload/preload.js'),
                    sandbox: false,                   // Allow preload script access
                    webSecurity: true,                // Enable web security
                },
                show: false,                          // Don't show until ready
                icon: path.join(__dirname, '../../assets/icon.png'),
            });

            // Load the main HTML file
            this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

            // Configure window events
            this.setupWindowEvents();

            // Show window when ready to prevent visual flash
            this.mainWindow.once('ready-to-show', () => {
                this.mainWindow.show();
                if (this.isDevelopment) {
                    this.mainWindow.webContents.openDevTools();
                }
            });

            return this.mainWindow;
        } catch (error) {
            console.error('Failed to create main window:', error);
            throw new Error(`Window creation failed: ${error.message}`);
        }
    }

    // ... Continue with complete implementation
}

module.exports = WindowManager;
```



Before generating the code, think through:

1. **Architecture Planning:**
   - How will the main and renderer processes communicate securely?
   - What's the optimal file structure for maintainability?
   - How will the LLM integration be implemented for best performance?

2. **Security Considerations:**
   - How to prevent XSS and code injection attacks?
   - What's the minimal API surface to expose to the renderer?
   - How to securely manage API keys and sensitive data?

3. **Performance Optimization:**
   - How to handle large text documents efficiently?
   - What caching strategies will improve LLM response times?
   - How to prevent UI blocking during text processing?

4. **User Experience:**
   - How to provide immediate feedback during LLM operations?
   - What's the best UI pattern for displaying suggestions?
   - How to handle errors gracefully with helpful messages?

5. **Cross-Platform Compatibility:**
   - What platform-specific considerations are needed?
   - How to ensure consistent behavior across OS?
   - What file path handling is required?



The generated code must be:
✅ Complete and immediately runnable after npm install
✅ Production-ready with proper error handling
✅ Secure following Electron security best practices
✅ Well-documented with extensive comments
✅ Performant and optimized for real-world usage
✅ Cross-platform compatible (Windows, macOS, Linux)
✅ Accessible and user-friendly
✅ Extensible and maintainable
✅ Include comprehensive testing approach
✅ Follow modern JavaScript and Electron conventions

Generate the complete application code now, ensuring every file is fully implemented and ready for development use.