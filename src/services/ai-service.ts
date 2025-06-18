/**
 * AI Service for handling Google Gemini AI interactions
 */
import { GoogleGenAI } from '@google/genai';
import { AI_CONFIG, ERROR_MESSAGES } from '../constants/index.js';
import { parseErrorMessage } from '../utils/index.js';

/**
 * Service class for managing AI chat interactions
 */
export class AIService {
  private ai: GoogleGenAI;
  private chat: any;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({
      apiKey,
      apiVersion: AI_CONFIG.API_VERSION,
    });
    this.initializeChat();
  }

  /**
   * Initialize a new chat session
   */
  private initializeChat(): void {
    this.chat = this.ai.chats.create({
      model: AI_CONFIG.MODEL,
      config: {
        systemInstruction: AI_CONFIG.SYSTEM_INSTRUCTIONS,
        thinkingConfig: {
          includeThoughts: true,
        },
      },
    });
  }

  /**
   * Reset the chat session
   */
  resetChat(): void {
    this.initializeChat();
  }

  /**
   * Send message to AI and get streaming response
   * @param message - Message to send
   * @returns Async generator for streaming response
   */
  async *sendMessageStream(message: Array<{ role: string; text: string }>) {
    try {
      const response = await this.chat.sendMessageStream({ message });
      
      for await (const chunk of response) {
        for (const candidate of chunk.candidates ?? []) {
          for (const part of candidate.content.parts ?? []) {
            yield {
              isThought: !!part.thought,
              content: part.text || '',
            };
          }
        }
      }
    } catch (error) {
      throw new Error(`${ERROR_MESSAGES.GENAI_ERROR} ${parseErrorMessage(error)}`);
    }
  }

  /**
   * Check if API key is available
   * @returns Whether API key is configured
   */
  static isApiKeyAvailable(): boolean {
    const apiKey = globalThis.process?.env?.GEMINI_API_KEY || 
                   (globalThis as any).VITE_GEMINI_API_KEY ||
                   (import.meta as any).env?.VITE_GEMINI_API_KEY;
    return !!apiKey;
  }
} 