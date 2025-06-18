/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { html, LitElement } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import hljs from 'highlight.js';
import { classMap } from 'lit/directives/class-map.js';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';

import { 
  ChatState, 
  ChatTab, 
  PlaygroundState, 
  SendMessageHandler, 
  ResetHandler 
} from '../types/index.js';
import { UI_CONSTANTS, TIMING, ERROR_MESSAGES, UI_TEXT } from '../constants/index.js';
import { CodeExecutionService } from '../services/code-execution-service.js';
import { 
  debounce, 
  scrollToElement, 
  createElement, 
  shouldUpdateSyntaxHighlighting 
} from '../utils/index.js';

// Re-export types for external use
export { ChatState } from '../types/index.js';

/** Markdown formatting function with syntax highlighting */
export const marked = new Marked(
  markedHighlight({
    async: true,
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  }),
);

/** Modern Icon definitions with Turkish tooltips */
const ICONS = {
  BUSY: html`<svg
    class="rotating"
    xmlns="http://www.w3.org/2000/svg"
    height="24px"
    viewBox="0 -960 960 960"
    width="24px"
    fill="currentColor">
    <path
      d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q17 0 28.5 11.5T520-840q0 17-11.5 28.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-17 11.5-28.5T840-520q17 0 28.5 11.5T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Z" />
  </svg>`,
  
  EDIT: html`<svg
    xmlns="http://www.w3.org/2000/svg"
    height="16px"
    viewBox="0 -960 960 960"
    width="16px"
    fill="currentColor">
    <path
      d="M120-120v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm584-528 56-56-56-56-56 56 56 56Z" />
  </svg>`,
  
  SEND: html`<svg
    xmlns="http://www.w3.org/2000/svg"
    height="20px"
    viewBox="0 -960 960 960"
    width="20px"
    fill="currentColor">
    <path d="M120-160v-240l320-80-320-80v-240l760 320-760 320Z" />
  </svg>`,
  
  RELOAD: html`<svg
    xmlns="http://www.w3.org/2000/svg"
    height="24px"
    viewBox="0 -960 960 960"
    width="24px"
    fill="currentColor">
    <path
      d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
  </svg>`,
  
  PLAY: html`<svg
    xmlns="http://www.w3.org/2000/svg"
    height="32px"
    viewBox="0 -960 960 960"
    width="32px"
    fill="currentColor">
    <path
      d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
  </svg>`,
  
  STOP: html`<svg
    xmlns="http://www.w3.org/2000/svg"
    height="32px"
    viewBox="0 -960 960 960"
    width="32px"
    fill="currentColor">
    <path
      d="M320-320h320v-320H320v320ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
  </svg>`,
  
  CLEAR: html`<svg
    xmlns="http://www.w3.org/2000/svg"
    height="24px"
    viewBox="0 -960 960 960"
    width="24px"
    fill="currentColor">
    <path
      d="m376-300 104-104 104 104 56-56-104-104 104-104-56-56-104 104-104-104-56 56 104 104-104 104 56 56Zm-96 180q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Z" />
  </svg>`,
} as const;

/**
 * Optimized and Modernized Playground component for p5.js
 */
@customElement('gdm-playground')
export class Playground extends LitElement {
  @query('#anchor') anchor?: HTMLElement;
  @query('#reloadTooltip') reloadTooltip?: HTMLElement;
  private readonly codeSyntax: HTMLDivElement;
  private readonly codeExecutionService: CodeExecutionService;
  private debouncedCodeUpdate: (code: string) => void;

  @state() chatState = ChatState.IDLE;
  @state() isRunning = true;
  @state() selectedChatTab = ChatTab.GEMINI;
  @state() inputMessage = '';
  @state() code = '';
  @state() messages: HTMLElement[] = [];
  @state() codeHasChanged = true;
  @state() codeNeedsReload = false;

  private defaultCode = '';
  private lastError = '';
  private reportedError = false;

  sendMessageHandler?: SendMessageHandler;
  resetHandler?: ResetHandler;

  constructor() {
    super();
    this.codeSyntax = createElement('div', { classes: ['code-syntax'] });
    this.codeExecutionService = new CodeExecutionService();
    this.debouncedCodeUpdate = debounce(
      (code: string) => this.updateCodeSyntax(code), 
      TIMING.DEBOUNCE_DELAY
    );
    
    this.setupCodeExecutionService();
  }

  /**
   * Setup code execution service
   */
  private setupCodeExecutionService(): void {
    this.codeExecutionService.setErrorCallback(this.handleRuntimeError.bind(this));
  }

  /** Disable shadow DOM */
  createRenderRoot() {
    return this;
  }

  /**
   * Set default code template
   * @param code - Default code template
   */
  setDefaultCode(code: string): void {
    this.defaultCode = code;
  }

  /**
   * Set and execute code
   * @param code - Code to set and execute
   */
  async setCode(code: string): Promise<void> {
    if (this.code === code) return;
    
    this.code = code;
    this.executeCode(code);
    await this.updateCodeSyntax(code);
  }

  /**
   * Set chat state
   * @param state - New chat state
   */
  setChatState(state: ChatState): void {
    this.chatState = state;
  }

  /**
   * Execute code in iframe
   * @param code - Code to execute
   */
  private executeCode(code: string): void {
    this.reportedError = false;
    this.lastError = '';
    
    const result = this.codeExecutionService.executeCode(code);
    if (!result.success && result.error) {
      this.handleRuntimeError(result.error);
    }
    
    this.codeNeedsReload = false;
  }

  /**
   * Handle runtime errors
   * @param errorMessage - Error message
   */
  private handleRuntimeError(errorMessage: string): void {
    this.reportedError = true;

    if (this.lastError !== errorMessage) {
      this.addMessage('system-ask', errorMessage);
    }
    this.lastError = errorMessage;
  }

  /**
   * Set input field value
   * @param message - Message to set
   */
  setInputField(message: string): void {
    this.inputMessage = message.trim();
  }

  /**
   * Add message to chat
   * @param role - Message role
   * @param message - Message content
   * @returns Message elements
   */
  addMessage(role: string, message: string): { thinking: HTMLElement; text: HTMLElement } {
    const messageContainer = this.createMessageContainer(role, message);
    const thinking = messageContainer.querySelector('.thinking div') as HTMLElement;
    const text = messageContainer.querySelector('.text') as HTMLElement;

    this.messages.push(messageContainer);
    this.requestUpdate();
    this.scrollToTheEnd();

    return { thinking, text };
  }

  /**
   * Create message container element
   * @param role - Message role
   * @param message - Message content
   * @returns Message container element
   */
  private createMessageContainer(role: string, message: string): HTMLElement {
    const div = createElement('div', { 
      classes: ['turn', `role-${role.trim()}`] 
    });

    // Create thinking details
    const thinkingDetails = createElement('details', { 
      classes: ['hidden', 'thinking'],
      attributes: { open: 'true' }
    });
    const summary = createElement('summary', { textContent: UI_TEXT.THINKING_LABEL });
    const thinking = createElement('div');
    thinkingDetails.append(summary, thinking);
    
    // Create text content
    const text = createElement('div', { 
      classes: ['text'], 
      textContent: message 
    });

    div.append(thinkingDetails, text);

    // Add improve button for system-ask messages
    if (role === 'system-ask') {
      const button = createElement('button', { textContent: UI_TEXT.IMPROVE });
      button.addEventListener('click', () => {
        div.removeChild(button);
        this.sendMessageAction(message, 'SYSTEM');
      });
      div.appendChild(button);
    }

    return div;
  }

  /**
   * Scroll to end of chat
   */
  scrollToTheEnd(): void {
    scrollToElement(this.anchor || null);
  }

  /**
   * Send message action
   * @param message - Optional message override
   * @param role - Optional role override
   */
  async sendMessageAction(message?: string, role?: string): Promise<void> {
    if (this.chatState !== ChatState.IDLE) return;

    this.chatState = ChatState.GENERATING;

    const messageText = message?.trim() || this.inputMessage.trim();
    if (!messageText) {
      this.chatState = ChatState.IDLE;
      return;
    }

    // Clear input if using user input
    if (!message) {
      this.inputMessage = '';
    }

    const messageRole = role?.toLowerCase() || 'user';

    if (messageRole === 'user' && messageText) {
      this.addMessage(messageRole, messageText);
    }

    if (this.sendMessageHandler) {
      await this.sendMessageHandler(
        messageText,
        messageRole,
        this.code,
        this.codeHasChanged
      );
      this.codeHasChanged = false;
    }

    this.chatState = ChatState.IDLE;
  }

  /**
   * Play action - start/resume code execution
   */
  private playAction(): void {
    if (this.isRunning) return;
    
    if (this.codeHasChanged) {
      this.executeCode(this.code);
    }
    
    this.isRunning = true;
    this.codeExecutionService.resumeExecution();
  }

  /**
   * Stop action - pause code execution
   */
  private stopAction(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.codeExecutionService.stopExecution();
  }

  /**
   * Clear action - reset playground
   */
  private async clearAction(): Promise<void> {
    await this.setCode(this.defaultCode);
    this.messages = [];
    this.codeHasChanged = true;
    
    if (this.resetHandler) {
      await this.resetHandler();
    }
  }

  /**
   * Handle code editing
   * @param code - New code
   */
  private async codeEditedAction(code: string): Promise<void> {
    if (this.chatState !== ChatState.IDLE) return;

    const oldCode = this.code;
    this.code = code;
    this.codeHasChanged = true;
    this.codeNeedsReload = true;

    if (shouldUpdateSyntaxHighlighting(oldCode, code)) {
      this.debouncedCodeUpdate(code);
    }
  }

  /**
   * Update code syntax highlighting
   * @param code - Code to highlight
   */
  private async updateCodeSyntax(code: string): Promise<void> {
    this.codeSyntax.innerHTML = await marked.parse(`\`\`\`javascript\n${code}\n\`\`\``);
  }

  /**
   * Handle input key down events
   * @param event - Keyboard event
   */
  private inputKeyDownAction(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      this.sendMessageAction();
    }
  }

  /**
   * Reload code action
   */
  private reloadCodeAction(): void {
    this.executeCode(this.code);
    this.isRunning = true;
  }

  /**
   * Render the playground component
   */
  render() {
    const iframe = this.codeExecutionService.getIframe();
    
    return html`<div class="playground">
      <div class="sidebar">
        ${this.renderTabSelector()}
        ${this.renderChatTab()}
        ${this.selectedChatTab === ChatTab.CODE ? this.renderCodeTab() : ''}
      </div>
      <div class="main-container">
        ${iframe}
        ${this.renderToolbar()}
      </div>
    </div>`;
  }

  /**
   * Render tab selector with Turkish labels
   */
  private renderTabSelector() {
    return html`<div class="selector">
      <button
        id="geminiTab"
        class=${classMap({
          'selected-tab': this.selectedChatTab === ChatTab.GEMINI,
        })}
        @click=${() => { this.selectedChatTab = ChatTab.GEMINI; }}>
        <span>🤖</span> ${UI_TEXT.CHAT_TAB}
      </button>
      <button
        id="codeTab"
        class=${classMap({
          'selected-tab': this.selectedChatTab === ChatTab.CODE,
        })}
        @click=${() => { this.selectedChatTab = ChatTab.CODE; }}>
        <span>💻</span> ${UI_TEXT.CODE_TAB} ${this.codeHasChanged ? ICONS.EDIT : html``}
      </button>
    </div>`;
  }

  /**
   * Render chat tab
   */
  private renderChatTab() {
    return html`<div
      id="chat"
      class=${classMap({
        'tabcontent': true,
        'showtab': this.selectedChatTab === ChatTab.GEMINI,
      })}>
      <div class="chat-messages">
        ${this.messages}
        <div id="anchor"></div>
      </div>
      ${this.renderChatFooter()}
    </div>`;
  }

  /**
   * Render chat footer with modern styling
   */
  private renderChatFooter() {
    return html`<div class="footer">
      <div
        id="chatStatus"
        class=${classMap({ 'hidden': this.chatState === ChatState.IDLE })}>
        ${this.renderChatStatus()}
      </div>
      <div id="inputArea">
        <textarea
          id="messageInput"
          .value=${this.inputMessage}
          @input=${(e: InputEvent) => {
            this.inputMessage = (e.target as HTMLTextAreaElement).value;
          }}
          @keydown=${this.inputKeyDownAction.bind(this)}
          placeholder="${UI_TEXT.MESSAGE_PLACEHOLDER}"
          rows="1"
          autocomplete="off"></textarea>
        <button
          id="sendButton"
          class=${classMap({
            'disabled': this.chatState !== ChatState.IDLE,
          })}
          title="${UI_TEXT.SEND}"
          @click=${() => { this.sendMessageAction(); }}>
          ${ICONS.SEND}
        </button>
      </div>
    </div>`;
  }

  /**
   * Render chat status with Turkish text
   */
  private renderChatStatus() {
    const statusMap: Record<ChatState, any> = {
      [ChatState.IDLE]: html``,
      [ChatState.GENERATING]: html`${ICONS.BUSY} ${UI_TEXT.GENERATING}`,
      [ChatState.THINKING]: html`${ICONS.BUSY} ${UI_TEXT.THINKING}`,
      [ChatState.CODING]: html`${ICONS.BUSY} ${UI_TEXT.CODING}`,
    };
    
    return statusMap[this.chatState] || html``;
  }

  /**
   * Render code tab
   */
  private renderCodeTab() {
    return html`<div
      id="editor"
      class=${classMap({
        'tabcontent': true,
        'showtab': this.selectedChatTab === ChatTab.CODE,
      })}>
      <div class="code-container">
        ${this.codeSyntax}
        <textarea
          class="code-editor"
          .value=${this.code}
          .readonly=${this.chatState !== ChatState.IDLE}
          @keyup=${(e: KeyboardEvent) => {
            const val = (e.target as HTMLTextAreaElement).value;
            if (this.code !== val) {
              this.codeEditedAction(val);
              this.requestUpdate();
            }
          }}
          @change=${(e: InputEvent) => {
            this.codeEditedAction((e.target as HTMLTextAreaElement).value);
          }}
          @scroll=${(e: Event) => {
            const textarea = e.target as HTMLTextAreaElement;
            this.codeSyntax.scrollTop = textarea.scrollTop;
            this.codeSyntax.scrollLeft = textarea.scrollLeft;
          }}
          placeholder="// JavaScript kodunuzu buraya yazın..."
          spellcheck="false"></textarea>
      </div>
    </div>`;
  }

  /**
   * Render modern toolbar with Turkish labels
   */
  private renderToolbar() {
    return html`<div class="toolbar">
      <button
        id="reloadCode"
        title="${UI_TEXT.RELOAD_TOOLTIP}"
        @click=${this.reloadCodeAction.bind(this)}>
        ${ICONS.RELOAD}
        <div class="button-label">
          <p>${UI_TEXT.RELOAD}</p>
          <div
            id="reloadTooltip"
            class="button-tooltip ${classMap({
              'show-tooltip': this.codeNeedsReload,
            })}">
            <p>${UI_TEXT.RELOAD_TOOLTIP}</p>
          </div>
        </div>
      </button>
      
      <button
        id="runCode"
        class=${classMap({ 'disabled': this.isRunning })}
        title="${UI_TEXT.PLAY_TOOLTIP}"
        @click=${this.playAction.bind(this)}>
        ${ICONS.PLAY}
        <div class="button-label">
          <p>${UI_TEXT.PLAY}</p>
        </div>
      </button>
      
      <button
        id="stop"
        class=${classMap({ 'disabled': !this.isRunning })}
        title="${UI_TEXT.STOP_TOOLTIP}"
        @click=${this.stopAction.bind(this)}>
        ${ICONS.STOP}
        <div class="button-label">
          <p>${UI_TEXT.STOP}</p>
        </div>
      </button>
      
      <button
        id="clear"
        title="${UI_TEXT.RESET_TOOLTIP}"
        @click=${this.clearAction.bind(this)}>
        ${ICONS.CLEAR}
        <div class="button-label">
          <p>${UI_TEXT.RESET}</p>
        </div>
      </button>
    </div>`;
  }
} 