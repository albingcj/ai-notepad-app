import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

export function configureMonaco() {
  // For Electron - disable web workers to avoid security issues
  if (typeof window !== 'undefined') {
    (window as any).MonacoEnvironment = {
      getWorker() {
        // Return a mock worker that runs on main thread
        // This avoids the import statement errors in Electron
        return {
          postMessage: () => {},
          terminate: () => {},
          addEventListener: () => {},
          removeEventListener: () => {}
        };
      }
    };
  }

  // Configure loader to use Monaco from npm module
  loader.config({ monaco });
}
