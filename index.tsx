/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { ChatState, Playground } from './playground.js';
import { AIService } from './src/services/ai-service.js';
import { 
  AI_CONFIG, 
  CODE_TEMPLATES, 
  EXAMPLE_PROMPTS, 
  ERROR_MESSAGES,
  UI_TEXT
} from './src/constants/index.js';
import { 
  extractCodeFromMarkdown, 
  getRandomPrompt, 
  parseErrorMessage 
} from './src/utils/index.js';
import { marked } from './playground.js';

/**
 * Main application class for P5.js Playground
 */
class PlaygroundApp {
  private playground!: Playground;
  private aiService!: AIService;

  constructor() {
    this.initializeServices();
    this.setupPlayground();
  }

  /**
   * Initialize AI and other services
   */
  private initializeServices(): void {
    // Vercel environment variable'ı için birden fazla yoldan kontrol et
    const apiKey = globalThis.process?.env?.GEMINI_API_KEY || 
                   (globalThis as any).VITE_GEMINI_API_KEY ||
                   (import.meta as any).env?.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error(ERROR_MESSAGES.API_KEY_MISSING);
      return;
    }
    
    this.aiService = new AIService(apiKey);
  }

  /**
   * Setup the playground component
   */
  private setupPlayground(): void {
    this.playground = new Playground();
    this.setupEventHandlers();
    this.initializeDefaultState();
  }

  /**
   * Setup event handlers for the playground
   */
  private setupEventHandlers(): void {
    this.playground.sendMessageHandler = this.handleSendMessage.bind(this);
    this.playground.resetHandler = this.handleReset.bind(this);
  }

  /**
   * Initialize default playground state with Turkish content
   */
  private initializeDefaultState(): void {
    this.playground.setDefaultCode(CODE_TEMPLATES.EMPTY);
    this.playground.addMessage('USER', UI_TEXT.WELCOME_USER_MESSAGE);
    this.playground.addMessage('ASSISTANT', UI_TEXT.WELCOME_ASSISTANT_MESSAGE);
    this.playground.setCode(CODE_TEMPLATES.STARTUP);
    
    const randomPrompt = getRandomPrompt(EXAMPLE_PROMPTS);
    this.playground.setInputField(`${UI_TEXT.STARTUP_PROMPT_PREFIX}${randomPrompt}`);
  }

  /**
   * Handle message sending to AI
   * @param input - User input
   * @param role - Message role
   * @param code - Current code
   * @param codeHasChanged - Whether code has changed
   */
  private async handleSendMessage(
    input: string,
    role: string,
    code: string,
    codeHasChanged: boolean
  ): Promise<void> {
    console.log('📤 Mesaj gönderiliyor:', input, 'Role:', role, 'Kod değişti:', codeHasChanged);

    const { thinking, text } = this.playground.addMessage('assistant', '');
    const message = this.buildMessageArray(input, role, code, codeHasChanged);

    this.playground.setChatState(ChatState.GENERATING);
    text.innerHTML = '⏳ Hazırlanıyor...';

    let newCode = '';
    let thought = '';

    try {
      const responseStream = this.aiService.sendMessageStream(message);

      for await (const chunk of responseStream) {
        if (chunk.isThought) {
          this.playground.setChatState(ChatState.THINKING);
          thought += chunk.content;
          thinking.innerHTML = await marked.parse(thought);
          thinking.parentElement?.classList.remove('hidden');
        } else if (chunk.content) {
          this.playground.setChatState(ChatState.CODING);
          newCode += chunk.content;
          const p5Code = extractCodeFromMarkdown(newCode);

          // Remove the code block, it is available in the Code tab
          const explanation = newCode.replace(`\`\`\`javascript${p5Code}\`\`\``, '');
          text.innerHTML = await marked.parse(explanation);
        }
        this.playground.scrollToTheEnd();
      }
    } catch (error) {
      await this.handleAIError(error);
    }

    this.finalizeChatResponse(thinking, text, newCode);
  }

  /**
   * Build message array for AI request
   * @param input - User input
   * @param role - Message role
   * @param code - Current code
   * @param codeHasChanged - Whether code has changed
   * @returns Message array
   */
  private buildMessageArray(
    input: string, 
    role: string, 
    code: string, 
    codeHasChanged: boolean
  ): Array<{ role: string; text: string }> {
    const messages = [];

    if (role.toUpperCase() === 'USER' && codeHasChanged) {
      messages.push({
        role: 'user',
        text: `Kodu güncelledim: \`\`\`javascript\n${code}\n\`\`\``,
      });
    }

    if (role.toUpperCase() === 'SYSTEM') {
      messages.push({
        role: 'user',
        text: `Çalıştırıcı raporu: ${input}. Bunu iyileştirmek mümkün mü?`,
      });
    } else {
      messages.push({
        role,
        text: input,
      });
    }

    return messages;
  }

  /**
   * Handle AI errors with Turkish messages
   * @param error - Error object
   */
  private async handleAIError(error: unknown): Promise<void> {
    console.error('🚨', ERROR_MESSAGES.GENAI_ERROR, error);
    const message = parseErrorMessage(error);
    const parsedMessage = await marked.parse(`**Hata:** ${message}`);
    
    const { text } = this.playground.addMessage('error', '');
    text.innerHTML = parsedMessage;
  }

  /**
   * Finalize chat response and update code
   * @param thinking - Thinking element
   * @param text - Text element
   * @param newCode - Generated code
   */
  private finalizeChatResponse(
    thinking: HTMLElement, 
    text: HTMLElement, 
    newCode: string
  ): void {
    // Close thinking block
    thinking.parentElement?.removeAttribute('open');

    // If the answer was just code
    if (text.innerHTML.trim().length === 0 || text.innerHTML.includes('⏳')) {
      text.innerHTML = `✅ ${UI_TEXT.DONE}`;
    }

    const p5Code = extractCodeFromMarkdown(newCode);
    if (p5Code.trim().length > 0) {
      this.playground.setCode(p5Code);
      console.log('✨ Yeni kod uygulandı');
    } else {
      this.playground.addMessage('SYSTEM', ERROR_MESSAGES.NO_CODE_UPDATE);
    }
    
    this.playground.setChatState(ChatState.IDLE);
  }

  /**
   * Handle playground reset
   */
  private async handleReset(): Promise<void> {
    this.aiService.resetChat();
    console.log('🔄 Playground sıfırlandı');
  }

  /**
   * Mount the playground to the DOM
   * @param rootElement - Root element to mount to
   */
  mountToElement(rootElement: HTMLElement): void {
    rootElement.appendChild(this.playground);
  }
}

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 P5.js Playground başlatılıyor...');
  
  const rootElement = document.querySelector('#root') as HTMLElement;
  
  if (!rootElement) {
    console.error('❌', UI_TEXT.ROOT_ELEMENT_ERROR);
    return;
  }

  try {
    const app = new PlaygroundApp();
    app.mountToElement(rootElement);
    console.log('✅ Uygulama başarıyla yüklendi!');
  } catch (error) {
    console.error('❌ Uygulama başlatma hatası:', error);
    
    // Show user-friendly error message
    rootElement.innerHTML = `
      <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        height: 100vh; 
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: #f8fafc;
        font-family: 'Inter', sans-serif;
        text-align: center;
        padding: 2rem;
      ">
        <div style="
          background: rgba(51, 65, 85, 0.8);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 2rem;
          max-width: 500px;
        ">
          <h1 style="color: #ef4444; margin-bottom: 1rem; font-size: 1.5rem;">
            🚨 Başlatma Hatası
          </h1>
          <p style="margin-bottom: 1rem; line-height: 1.6;">
            Playground başlatılırken bir hata oluştu. Lütfen:
          </p>
          <ul style="text-align: left; line-height: 1.8; margin-bottom: 1rem;">
            <li>GEMINI_API_KEY'in doğru ayarlandığından emin olun</li>
            <li>Internet bağlantınızı kontrol edin</li>
            <li>Sayfayı yenileyin</li>
          </ul>
          <button 
            onclick="window.location.reload()" 
            style="
              background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 12px;
              cursor: pointer;
              font-weight: 500;
              transition: transform 0.2s;
            "
            onmouseover="this.style.transform='translateY(-2px)'"
            onmouseout="this.style.transform='translateY(0)'"
          >
            🔄 Sayfayı Yenile
          </button>
        </div>
      </div>
    `;
  }
});
