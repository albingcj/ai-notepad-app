import { useState, useCallback } from 'react';
import { LLMResponse } from '../interfaces/types';
import LLMProcessor from '../services/LLMProcessor';

export default function useLLM() {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // S1: Check grammar of text
  // Processes text for grammar, spelling, and punctuation errors
  const checkGrammar = useCallback(async (text: string, language?: string): Promise<LLMResponse> => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const response = await LLMProcessor.checkGrammar(text, language);
      
      if (response.error) {
        setError(new Error(response.error));
      }
      
      return response;
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  // S2: Rephrase text with style
  // Generates rephrasing options for text with different styles
  const rephraseText = useCallback(async (text: string, style?: string): Promise<LLMResponse> => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const response = await LLMProcessor.rephraseText(text, style);
      
      if (response.error) {
        setError(new Error(response.error));
      }
      
      return response;
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  // S3: Process batch of texts
  // Handles multiple text processing requests in batch
  const processBatch = useCallback(async (
    texts: string[], 
    operation: 'grammar-check' | 'rephrase', 
    options?: any
  ): Promise<LLMResponse[]> => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const responses = await LLMProcessor.processBatch(texts, operation, options);
      
      // Check if any response has an error
      const errorResponse = responses.find(r => r.error);
      if (errorResponse) {
        setError(new Error(errorResponse.error));
      }
      
      return responses;
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  return {
    checkGrammar,
    rephraseText,
    processBatch,
    isProcessing,
    error
  };
}
