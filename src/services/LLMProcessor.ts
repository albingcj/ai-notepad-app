import { LRUCache } from 'lru-cache';
import IPCBridge from './IPCBridge';
import { IpcChannels } from '../interfaces/constants';
import { LLMResponse } from '../interfaces/types';

// Debouncer class for throttling requests
class Debouncer {
  private timeout: NodeJS.Timeout | null = null;
  private lastCall: number = 0;
  private delay: number;
  
  constructor(delay: number = 500) {
    this.delay = delay;
  }
  
  debounce<T>(func: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
    return new Promise((resolve, reject) => {
      // Clear any existing timeout
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      
      // Calculate time since last call
      const now = Date.now();
      const timeSinceLastCall = now - this.lastCall;
      
      // Set a new timeout
      this.timeout = setTimeout(async () => {
        this.lastCall = Date.now();
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, Math.max(0, this.delay - timeSinceLastCall));
    });
  }
}

class LLMProcessor {
  private requestDebouncer: Debouncer;
  private worker: Worker | null = null;
  private cache: LRUCache<string, LLMResponse>;
  
  // S1: Initialize LLM processor
  // Sets up the LLM processor with caching and debouncing
  constructor() {
    this.requestDebouncer = new Debouncer(500); // 500ms debounce delay
    this.cache = new LRUCache({
      max: 100, // Store max 100 responses
      ttl: 1000 * 60 * 60, // Cache for 1 hour
      allowStale: false
    });
    
    // Initialize web worker if supported
    this.initializeWorker();
  }
  
  // S2: Initialize web worker
  // Sets up a web worker for background processing if supported
  private initializeWorker(): void {
    // Check if Web Workers are supported
    if (typeof Worker !== 'undefined') {
      try {
        // In a real app, you'd have a separate worker file
        // For now, we'll just simulate it
        // this.worker = new Worker('/llm-worker.js');
        
        // Set up message handler
        /* this.worker.onmessage = (event) => {
          console.log('Received result from worker:', event.data);
        }; */
      } catch (error) {
        console.error('Failed to initialize Web Worker:', error);
      }
    }
  }
  
  // S3: Check grammar
  // Processes grammar checking request
  async checkGrammar(text: string, language?: string): Promise<LLMResponse> {
    try {
      // Generate cache key
      const cacheKey = `grammar:${language || 'en'}:${text}`;
      
      // Check cache
      const cachedResponse = this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        console.log('Returning cached grammar check response');
        return cachedResponse;
      }
      
      // Debounce request
      return await this.requestDebouncer.debounce(async () => {
        // Check if we're offline
        if (!navigator.onLine) {
          return this.handleOfflineMode(text);
        }
        
        // Make request to main process
        const response = await IPCBridge.invoke<LLMResponse>(
          IpcChannels.AI_CHECK_GRAMMAR,
          { text, language }
        );
        
        // Cache response
        if (response && !response.error) {
          this.cache.set(cacheKey, response);
        }
        
        return response;
      });
    } catch (error) {
      console.error('Error checking grammar:', error);
      throw error;
    }
  }
  
  // S4: Rephrase text
  // Processes text rephrasing request
  async rephraseText(text: string, style?: string): Promise<LLMResponse> {
    try {
      // Generate cache key
      const cacheKey = `rephrase:${style || 'formal'}:${text}`;
      
      // Check cache
      const cachedResponse = this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        console.log('Returning cached rephrase response');
        return cachedResponse;
      }
      
      // Debounce request
      return await this.requestDebouncer.debounce(async () => {
        // Check if we're offline
        if (!navigator.onLine) {
          return this.handleOfflineMode(text);
        }
        
        // Make request to main process
        const response = await IPCBridge.invoke<LLMResponse>(
          IpcChannels.AI_REPHRASE_TEXT,
          { text, style }
        );
        
        // Cache response
        if (response && !response.error) {
          this.cache.set(cacheKey, response);
        }
        
        return response;
      });
    } catch (error) {
      console.error('Error rephrasing text:', error);
      throw error;
    }
  }
  
  // S5: Process batch of texts
  // Processes multiple text requests in batch
  async processBatch(texts: string[], operation: 'grammar-check' | 'rephrase', options?: any): Promise<LLMResponse[]> {
    try {
      // Process each text and collect results
      const results = await Promise.all(
        texts.map(text => {
          if (operation === 'grammar-check') {
            return this.checkGrammar(text, options?.language);
          } else {
            return this.rephraseText(text, options?.style);
          }
        })
      );
      
      return results;
    } catch (error) {
      console.error('Error processing batch:', error);
      throw error;
    }
  }
  
  // S6: Handle offline mode
  // Provides basic functionality when offline
  handleOfflineMode(text: string): LLMResponse {
    console.log('Operating in offline mode');
    
    // Perform basic spell checking
    const words = text.split(/\s+/);
    const misspelledWords = this.findMisspelledWords(words);
    
    // Generate suggestions
    const suggestions = misspelledWords.map(word => ({
      text: word.suggestion,
      confidence: 0.7,
      type: 'spelling'
    }));
    
    return {
      original: text,
      suggestions,
      error: suggestions.length === 0 ? 'No issues found in offline mode' : undefined
    };
  }
  
  // S7: Get cached response
  // Retrieves a cached response if available
  getCachedResponse(key: string): LLMResponse | undefined {
    return this.cache.get(key);
  }
  
  // Helper method for basic spell checking
  private findMisspelledWords(words: string[]): Array<{ original: string, suggestion: string }> {
    // This is a very simplified spell checker for offline mode
    // In a real app, you'd use a proper spell checking library
    const commonMisspellings: Record<string, string> = {
      'teh': 'the',
      'adn': 'and',
      'waht': 'what',
      'thier': 'their',
      'recieve': 'receive',
      'alot': 'a lot',
      'seperate': 'separate',
      'definately': 'definitely',
      'accomodate': 'accommodate',
      'occured': 'occurred',
      'untill': 'until',
      'wierd': 'weird'
    };
    
    return words
      .filter(word => commonMisspellings[word.toLowerCase()])
      .map(word => ({
        original: word,
        suggestion: commonMisspellings[word.toLowerCase()]
      }));
  }
}

export default new LLMProcessor();
