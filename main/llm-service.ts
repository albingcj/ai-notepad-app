import * as electronLog from 'electron-log';
import axios from 'axios';
import { LRUCache } from 'lru-cache';
import { ErrorCodes } from './constants';

// Define interfaces
interface LLMRequest {
  text: string;
  operation: string;
  style?: string;
  language?: string;
}

interface LLMResponse {
  original: string;
  suggestions: Array<{
    text: string;
    confidence: number;
    type: string;
  }>;
  error?: string;
}

// Rate limiter implementation
class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number; // tokens per second
  private lastRefillTimestamp: number;
  
  constructor(maxTokens: number, refillRate: number) {
    this.tokens = maxTokens;
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.lastRefillTimestamp = Date.now();
  }
  
  // Check if request can be made and consume token if possible
  async consume(tokens: number = 1): Promise<boolean> {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    // Wait until enough tokens are available
    const waitTime = (tokens - this.tokens) * (1000 / this.refillRate);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    this.refill();
    this.tokens -= tokens;
    return true;
  }
  
  // Refill tokens based on elapsed time
  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTimestamp) / 1000;
    const tokensToAdd = elapsedSeconds * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefillTimestamp = now;
  }
}

export class LLMService {
  private provider: string;
  private apiKeys: Record<string, string>;
  private cache: LRUCache<string, LLMResponse>;
  private rateLimiter: RateLimiter;
  
  // S1: Initialize LLMService
  // Sets up the LLM service with provider settings and caching
  constructor() {
    this.provider = process.env.DEFAULT_LLM_PROVIDER || 'local';
    this.apiKeys = {
      openai: process.env.OPENAI_API_KEY || '',
      anthropic: process.env.ANTHROPIC_API_KEY || ''
    };
    this.cache = new LRUCache({
      max: 100, // Store max 100 responses
      ttl: 1000 * 60 * 60, // Cache for 1 hour
      allowStale: false
    });
    this.rateLimiter = new RateLimiter(10, 2); // 10 tokens, refill rate of 2 tokens per second
    
    electronLog.info('LLMService initialized with provider:', this.provider);
  }
  
  // S2: Initialize LLM provider with settings
  // Updates LLM provider settings
  initialize(provider: string, apiKeys: Record<string, string>): void {
    this.provider = provider;
    this.apiKeys = apiKeys;
    
    electronLog.info('LLMService provider updated:', provider);
  }
  
  // S3: Check text grammar
  // Analyzes text for grammar, spelling, and punctuation errors
  async checkGrammar(text: string, language: string = 'en'): Promise<LLMResponse> {
    try {
      // Validate input
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid text input');
      }
      
      // Create request
      const request: LLMRequest = {
        text,
        operation: 'grammar-check',
        language
      };
      
      // Process request
      return await this.processRequest(request);
    } catch (error: unknown) {
      electronLog.error('Grammar check error:', error);
      return this.handleError(error, { text, operation: 'grammar-check', language });
    }
  }
  
  // S4: Rephrase text with specified style
  // Generates rephrasing options for text with different styles
  async rephraseText(text: string, style: string = 'formal'): Promise<LLMResponse> {
    try {
      // Validate input
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid text input');
      }
      
      // Create request
      const request: LLMRequest = {
        text,
        operation: 'rephrase',
        style
      };
      
      // Process request
      return await this.processRequest(request);
    } catch (error: unknown) {
      electronLog.error('Text rephrasing error:', error);
      return this.handleError(error, { text, operation: 'rephrase', style });
    }
  }
  
  // S5: Process LLM request
  // Handles request processing, caching, and queuing
  async processRequest(request: LLMRequest): Promise<LLMResponse> {
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(request);
      
      // Check cache
      const cachedResponse = this.cache.get(cacheKey);
      if (cachedResponse) {
        electronLog.debug('Returning cached LLM response');
        return cachedResponse;
      }
      
      // Check if we need to rate limit
      await this.rateLimiter.consume();
      
      // Process request based on provider
      let response: LLMResponse;
      
      if (this.provider === 'local') {
        response = await this.callLocalLLM(request);
      } else {
        response = await this.callCloudLLM(request);
      }
      
      // Cache response
      this.cacheResponse(request, response);
      
      return response;
    } catch (error: unknown) {
      electronLog.error('Error processing LLM request:', error);
      return this.handleError(error, request);
    }
  }
  
  // S6: Call local LLM (Ollama)
  // Makes requests to local Ollama instance
  async callLocalLLM(request: LLMRequest): Promise<LLMResponse> {
    try {
      const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api';
      
      // Prepare prompt based on operation
      let prompt: string;
      let model = 'llama2'; // Default model
      
      if (request.operation === 'grammar-check') {
        prompt = `Please check the following text for grammar, spelling, and punctuation errors. 
                  Provide corrections with confidence scores (0-1) and error types.
                  Text: "${request.text}"
                  Language: ${request.language || 'English'}
                  Format: Return a JSON array of objects with properties: 
                  - text (corrected text)
                  - confidence (0-1)
                  - type (grammar/spelling/punctuation)`;
      } else if (request.operation === 'rephrase') {
        prompt = `Please rephrase the following text in a ${request.style || 'formal'} style.
                  Provide multiple options with confidence scores (0-1).
                  Text: "${request.text}"
                  Format: Return a JSON array of objects with properties:
                  - text (rephrased text)
                  - confidence (0-1)
                  - type (rephrasing)`;
      } else {
        throw new Error(`Unsupported operation: ${request.operation}`);
      }
      
      // Make request to Ollama
      const response = await axios.post(`${ollamaUrl}/generate`, {
        model,
        prompt,
        stream: false
      }, {
        timeout: 30000 // 30 second timeout
      });
      
      // Parse and format response
      const responseText = response.data.response;
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\[.*\]/s);
      if (!jsonMatch) {
        throw new Error('Failed to parse LLM response');
      }
      
      const suggestions = JSON.parse(jsonMatch[0]);
      
      return {
        original: request.text,
        suggestions: suggestions.map((s: any) => ({
          text: s.text,
          confidence: s.confidence || 0.8,
          type: s.type || 'unknown'
        }))
      };
    } catch (error: unknown) {
      electronLog.error('Error calling local LLM:', error);
      
      // Try fallback to cloud if configured
      if (this.apiKeys.openai || this.apiKeys.anthropic) {
        electronLog.info('Falling back to cloud LLM');
        return this.callCloudLLM(request);
      }
      
      throw error;
    }
  }
  
  // S7: Call cloud LLM API
  // Makes requests to cloud LLM providers (OpenAI/Anthropic)
  async callCloudLLM(request: LLMRequest): Promise<LLMResponse> {
    try {
      // Determine which cloud provider to use
      const useAnthropicFallback = !this.apiKeys.openai && this.apiKeys.anthropic;
      const provider = (this.provider === 'anthropic' || useAnthropicFallback) ? 'anthropic' : 'openai';
      
      if (provider === 'openai' && !this.apiKeys.openai) {
        throw new Error('OpenAI API key not configured');
      }
      
      if (provider === 'anthropic' && !this.apiKeys.anthropic) {
        throw new Error('Anthropic API key not configured');
      }
      
      let response;
      
      if (provider === 'openai') {
        response = await this.callOpenAI(request);
      } else {
        response = await this.callAnthropic(request);
      }
      
      return response;
    } catch (error: unknown) {
      electronLog.error('Error calling cloud LLM:', error);
      throw error;
    }
  }
  
  // Helper method to call OpenAI API
  private async callOpenAI(request: LLMRequest): Promise<LLMResponse> {
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    
    // Prepare prompt based on operation
    let systemPrompt: string;
    let userPrompt: string;
    
    if (request.operation === 'grammar-check') {
      systemPrompt = `You are a professional grammar checker. Check the provided text for grammar, spelling, and punctuation errors. 
                      Provide corrections with confidence scores (0-1) and error types.
                      Return ONLY a JSON array of objects with properties: text (corrected text), confidence (0-1), type (grammar/spelling/punctuation).
                      Do not include any other text in your response, just the JSON array.`;
      
      userPrompt = `Text: "${request.text}"
                    Language: ${request.language || 'English'}`;
    } else if (request.operation === 'rephrase') {
      systemPrompt = `You are a professional text rephraser. Rephrase the provided text in a ${request.style || 'formal'} style.
                      Provide multiple options with confidence scores (0-1).
                      Return ONLY a JSON array of objects with properties: text (rephrased text), confidence (0-1), type (rephrasing).
                      Do not include any other text in your response, just the JSON array.`;
      
      userPrompt = `Text: "${request.text}"`;
    } else {
      throw new Error(`Unsupported operation: ${request.operation}`);
    }
    
    // Make request to OpenAI
    const response = await axios.post(apiUrl, {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${this.apiKeys.openai}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
    
    // Parse and format response
    const responseText = response.data.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\[.*\]/s);
    if (!jsonMatch) {
      throw new Error('Failed to parse OpenAI response');
    }
    
    const suggestions = JSON.parse(jsonMatch[0]);
    
    return {
      original: request.text,
      suggestions: suggestions.map((s: any) => ({
        text: s.text,
        confidence: s.confidence || 0.8,
        type: s.type || 'unknown'
      }))
    };
  }
  
  // Helper method to call Anthropic API
  private async callAnthropic(request: LLMRequest): Promise<LLMResponse> {
    const apiUrl = 'https://api.anthropic.com/v1/messages';
    
    // Prepare prompt based on operation
    let systemPrompt: string;
    let userPrompt: string;
    
    if (request.operation === 'grammar-check') {
      systemPrompt = `Check the provided text for grammar, spelling, and punctuation errors. 
                      Provide corrections with confidence scores (0-1) and error types.
                      Return ONLY a JSON array of objects with properties: text (corrected text), confidence (0-1), type (grammar/spelling/punctuation).
                      Do not include any other text in your response, just the JSON array.`;
      
      userPrompt = `Text: "${request.text}"
                    Language: ${request.language || 'English'}`;
    } else if (request.operation === 'rephrase') {
      systemPrompt = `Rephrase the provided text in a ${request.style || 'formal'} style.
                      Provide multiple options with confidence scores (0-1).
                      Return ONLY a JSON array of objects with properties: text (rephrased text), confidence (0-1), type (rephrasing).
                      Do not include any other text in your response, just the JSON array.`;
      
      userPrompt = `Text: "${request.text}"`;
    } else {
      throw new Error(`Unsupported operation: ${request.operation}`);
    }
    
    // Make request to Anthropic
    const response = await axios.post(apiUrl, {
      model: 'claude-2',
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1000
    }, {
      headers: {
        'x-api-key': this.apiKeys.anthropic,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
    
    // Parse and format response
    const responseText = response.data.content[0].text;
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\[.*\]/s);
    if (!jsonMatch) {
      throw new Error('Failed to parse Anthropic response');
    }
    
    const suggestions = JSON.parse(jsonMatch[0]);
    
    return {
      original: request.text,
      suggestions: suggestions.map((s: any) => ({
        text: s.text,
        confidence: s.confidence || 0.8,
        type: s.type || 'unknown'
      }))
    };
  }
  
  // S8: Cache LLM response
  // Stores response in LRU cache for future use
  cacheResponse(request: LLMRequest, response: LLMResponse): void {
    const cacheKey = this.generateCacheKey(request);
    this.cache.set(cacheKey, response);
    electronLog.debug(`Cached LLM response for key: ${cacheKey}`);
  }
  
  // S9: Handle errors from LLM requests
  // Creates error response for failed LLM requests
  handleError(error: unknown, request: LLMRequest): LLMResponse {
    let errorMessage = 'Unknown error occurred';
    let errorCode = ErrorCodes.UNKNOWN_ERROR;
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // API error response
        errorMessage = `API Error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`;
        errorCode = ErrorCodes.API_ERROR;
      } else if (error.request) {
        // No response received
        errorMessage = 'No response received from LLM service';
        errorCode = ErrorCodes.NETWORK_ERROR;
      }
    } else if (error instanceof Error) {
      // Error message available
      errorMessage = error.message;
      
      if (error.message.includes('API key')) {
        errorCode = ErrorCodes.AUTH_ERROR;
      } else if (error.message.includes('timeout')) {
        errorCode = ErrorCodes.TIMEOUT_ERROR;
      }
    }
    
    electronLog.error(`LLM error (${errorCode}): ${errorMessage}`);
    
    return {
      original: request.text || '',
      suggestions: [],
      error: `${errorCode}: ${errorMessage}`
    };
  }
  
  // Helper method to generate cache key
  private generateCacheKey(request: LLMRequest): string {
    return `${request.operation}:${request.style || ''}:${request.language || ''}:${request.text}`;
  }
}
