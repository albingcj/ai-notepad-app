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
      gemini: process.env.GEMINI_API_KEY || '',
      lmstudio: '' // LM Studio doesn't need API key for local access
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
    this.apiKeys = { ...this.apiKeys, ...apiKeys };
    
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
      
      if (this.provider === 'local' || this.provider === 'lmstudio') {
        response = await this.callLMStudio(request);
      } else {
        response = await this.callGemini(request);
      }
      
      // Cache response
      this.cacheResponse(request, response);
      
      return response;
    } catch (error: unknown) {
      electronLog.error('Error processing LLM request:', error);
      return this.handleError(error, request);
    }
  }
  
  // S6: Call LM Studio local instance
  // Makes requests to local LM Studio instance
  async callLMStudio(request: LLMRequest): Promise<LLMResponse> {
    try {
      const lmStudioUrl = process.env.LM_STUDIO_URL || 'http://localhost:1234/v1';
      
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
      
      // Make request to LM Studio using OpenAI-compatible API
      const response = await axios.post(`${lmStudioUrl}/chat/completions`, {
        model: "local-model", // LM Studio uses whatever model is loaded
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        stream: false
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout for local processing
      });
      
      // Parse and format response
      const responseText = response.data.choices[0].message.content;
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\[.*\]/s);
      if (!jsonMatch) {
        throw new Error('Failed to parse LM Studio response');
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
      electronLog.error('Error calling LM Studio:', error);
      
      // Try fallback to Gemini if configured
      if (this.apiKeys.gemini) {
        electronLog.info('Falling back to Gemini API');
        return this.callGemini(request);
      }
      
      throw error;
    }
  }
  
  // S7: Call Google Gemini API
  // Makes requests to Google Gemini API
  async callGemini(request: LLMRequest): Promise<LLMResponse> {
    try {
      if (!this.apiKeys.gemini) {
        throw new Error('Gemini API key not configured');
      }
      
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKeys.gemini}`;
      
      // Prepare prompt based on operation
      let prompt: string;
      
      if (request.operation === 'grammar-check') {
        prompt = `You are a professional grammar checker. Check the following text for grammar, spelling, and punctuation errors.
                  Provide corrections with confidence scores (0-1) and error types.
                  Return ONLY a JSON array of objects with properties: text (corrected text), confidence (0-1), type (grammar/spelling/punctuation).
                  Do not include any other text in your response, just the JSON array.
                  
                  Text: "${request.text}"
                  Language: ${request.language || 'English'}`;
      } else if (request.operation === 'rephrase') {
        prompt = `You are a professional text rephraser. Rephrase the following text in a ${request.style || 'formal'} style.
                  Provide multiple options with confidence scores (0-1).
                  Return ONLY a JSON array of objects with properties: text (rephrased text), confidence (0-1), type (rephrasing).
                  Do not include any other text in your response, just the JSON array.
                  
                  Text: "${request.text}"`;
      } else {
        throw new Error(`Unsupported operation: ${request.operation}`);
      }
      
      // Make request to Gemini
      const response = await axios.post(apiUrl, {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });
      
      // Parse and format response
      const responseText = response.data.candidates[0].content.parts[0].text;
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\[.*\]/s);
      if (!jsonMatch) {
        throw new Error('Failed to parse Gemini response');
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
      electronLog.error('Error calling Gemini API:', error);
      throw error;
    }
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
        const responseData = error.response.data;
        if (responseData?.error?.message) {
          // Gemini error format
          errorMessage = `API Error: ${error.response.status} - ${responseData.error.message}`;
        } else {
          // Generic error format
          errorMessage = `API Error: ${error.response.status} - ${responseData?.error || error.response.statusText}`;
        }
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
