/**
 * Type definitions for the P5.js Playground application
 */

/** Chat state enumeration */
export enum ChatState {
  IDLE = 'idle',
  GENERATING = 'generating',
  THINKING = 'thinking',
  CODING = 'coding',
}

/** Chat tab enumeration */
export enum ChatTab {
  GEMINI = 'gemini',
  CODE = 'code',
}

/** Chat role enumeration */
export enum ChatRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  ERROR = 'error',
}

/** Message interface */
export interface ChatMessage {
  role: ChatRole;
  content: string;
  timestamp?: Date;
}

/** AI response interface */
export interface AIResponse {
  thinking?: string;
  text: string;
  code?: string;
}

/** Code execution result interface */
export interface CodeExecutionResult {
  success: boolean;
  error?: string;
  output?: string;
}

/** Event handler types */
export type SendMessageHandler = (
  input: string,
  role: string,
  code: string,
  codeHasChanged: boolean
) => Promise<void>;

export type ResetHandler = () => Promise<void>;

/** Component state interface */
export interface PlaygroundState {
  chatState: ChatState;
  isRunning: boolean;
  selectedChatTab: ChatTab;
  inputMessage: string;
  code: string;
  messages: HTMLElement[];
  codeHasChanged: boolean;
  codeNeedsReload: boolean;
}

/** Configuration interface */
export interface PlaygroundConfig {
  apiKey: string;
  model: string;
  systemInstructions: string;
}

/** DOM element refs interface */
export interface PlaygroundRefs {
  anchor?: HTMLElement;
  reloadTooltip?: HTMLElement;
  codeSyntax: HTMLDivElement;
  previewFrame: HTMLIFrameElement;
} 