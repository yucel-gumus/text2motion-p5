/**
 * Code Execution Service for handling p5.js code execution
 */
import { EXTERNAL_URLS, ERROR_MESSAGES, UI_TEXT } from '../constants/index.js';
import { CodeExecutionResult } from '../types/index.js';
import { parseErrorMessage } from '../utils/index.js';

/**
 * Service class for managing p5.js code execution in iframe
 */
export class CodeExecutionService {
  private iframe: HTMLIFrameElement;
  private onErrorCallback?: (error: string) => void;

  constructor() {
    this.iframe = this.createIframe();
    this.setupMessageListener();
  }

  /**
   * Create and configure iframe for code execution
   * @returns Configured iframe element
   */
  private createIframe(): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.classList.add('preview-iframe');
    iframe.setAttribute('allowTransparency', 'true');
    return iframe;
  }

  /**
   * Setup message listener for iframe communication
   */
  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      if (event.data && typeof event.data === 'string') {
        try {
          const message = JSON.parse(event.data).message;
          this.handleRuntimeError(message);
        } catch (error) {
          console.error(ERROR_MESSAGES.PARSE_ERROR, error);
        }
      }
    }, false);
  }

  /**
   * Handle runtime errors from iframe
   * @param errorMessage - Error message from iframe
   */
  private handleRuntimeError(errorMessage: string): void {
    if (this.onErrorCallback) {
      this.onErrorCallback(errorMessage);
    }
  }

  /**
   * Generate HTML content for iframe with Turkish error messages
   * @param code - p5.js code to execute
   * @returns HTML content string
   */
  private generateIframeContent(code: string): string {
    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>p5.js Çizimi</title>
          <style>
              body { 
                margin: 0; 
                overflow: hidden; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              }
              main { 
                display: flex; 
                justify-content: center; 
                align-items: center; 
              }
              .console { 
                position: absolute; 
                bottom: 0; 
                left: 0; 
                right: 0;
                background: rgba(239, 68, 68, 0.95);
                backdrop-filter: blur(8px);
                color: white;
                padding: 1rem 1.5rem;
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.9rem;
                line-height: 1.5;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
              }
              .console::before {
                content: '🚨';
                margin-right: 0.5rem;
                font-size: 1.1rem;
              }
          </style>
          <script src="${EXTERNAL_URLS.P5JS_CDN}"></script>
          <script src="${EXTERNAL_URLS.P5JS_SOUND_CDN}"></script>
          <script>
            window.addEventListener('message', (event) => {
                if (event.data === 'stop' && typeof noLoop === 'function') { 
                  noLoop(); 
                  console.log('${UI_TEXT.SKETCH_STOPPED}'); 
                }
                else if (event.data === 'resume' && typeof loop === 'function') { 
                  loop(); 
                  console.log('${UI_TEXT.SKETCH_RESUMED}'); 
                }
            }, false);
          </script>
      </head>
      <body>
          <script>
              // Basic error handling within the iframe
              try {
                  ${code}
              } catch (error) {
                  console.error("${ERROR_MESSAGES.SKETCH_ERROR}", error);
                  parent.postMessage(
                    JSON.stringify({
                      message: error.toString()
                    })
                  );
                  const errorHtml = \`
                    <div class="console">
                      <strong>${UI_TEXT.CONSOLE_ERROR_PREFIX}\${error.message}</strong>
                      <br>
                      <small>${UI_TEXT.CONSOLE_ERROR_SUFFIX}</small>
                    </div>
                  \`;
                  document.body.innerHTML = errorHtml;
              }
          </script>
      </body>
      </html>
    `;
  }

  /**
   * Execute p5.js code in iframe
   * @param code - p5.js code to execute
   * @returns Execution result
   */
  executeCode(code: string): CodeExecutionResult {
    try {
      const htmlContent = this.generateIframeContent(code);
      this.iframe.setAttribute('srcdoc', htmlContent);
      return { success: true };
    } catch (error) {
      const errorMessage = parseErrorMessage(error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Stop code execution
   */
  stopExecution(): void {
    this.iframe.contentWindow?.postMessage('stop', '*');
  }

  /**
   * Resume code execution
   */
  resumeExecution(): void {
    this.iframe.contentWindow?.postMessage('resume', '*');
  }

  /**
   * Get iframe element
   * @returns Iframe element
   */
  getIframe(): HTMLIFrameElement {
    return this.iframe;
  }

  /**
   * Set error callback
   * @param callback - Callback function for errors
   */
  setErrorCallback(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }
} 