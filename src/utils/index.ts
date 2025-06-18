/**
 * Utility functions for the P5.js Playground application
 */

/**
 * Debounce function to limit the rate of function calls
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Extract JavaScript code from markdown text
 * @param text - Text containing markdown code block
 * @returns Extracted JavaScript code
 */
export function extractCodeFromMarkdown(text: string): string {
  const startMark = '```javascript';
  const codeStart = text.indexOf(startMark);
  let codeEnd = text.lastIndexOf('```');

  if (codeStart === -1) {
    return '';
  }

  if (codeEnd < 0) {
    return text.substring(codeStart + startMark.length);
  }
  
  return text.substring(codeStart + startMark.length, codeEnd);
}

/**
 * Generate a random example prompt
 * @param prompts - Array of example prompts
 * @returns Random prompt
 */
export function getRandomPrompt(prompts: readonly string[]): string {
  return prompts[Math.floor(Math.random() * prompts.length)];
}

/**
 * Sanitize HTML content to prevent XSS
 * @param content - HTML content to sanitize
 * @returns Sanitized HTML content
 */
export function sanitizeHtml(content: string): string {
  const div = document.createElement('div');
  div.textContent = content;
  return div.innerHTML;
}

/**
 * Create DOM element with classes and attributes
 * @param tag - HTML tag name
 * @param options - Element options
 * @returns Created element
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: {
    classes?: string[];
    attributes?: Record<string, string>;
    textContent?: string;
    innerHTML?: string;
  } = {}
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  
  if (options.classes) {
    element.classList.add(...options.classes);
  }
  
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  
  if (options.textContent) {
    element.textContent = options.textContent;
  }
  
  if (options.innerHTML) {
    element.innerHTML = options.innerHTML;
  }
  
  return element;
}

/**
 * Smooth scroll to element
 * @param element - Element to scroll to
 * @param behavior - Scroll behavior
 */
export function scrollToElement(
  element: HTMLElement | null,
  behavior: ScrollBehavior = 'smooth'
): void {
  if (!element) return;
  
  element.scrollIntoView({
    behavior,
    block: 'end',
  });
}

/**
 * Parse error message from SDK error
 * @param error - Error object or message
 * @returns Parsed error message
 */
export function parseErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    const splitPos = error.message.indexOf('{');
    if (splitPos > -1) {
      const msgJson = error.message.substring(splitPos);
      try {
        const sdkError = JSON.parse(msgJson);
        if (sdkError.error?.message) {
          return sdkError.error.message;
        }
      } catch {
        // Failed to parse, return original message
      }
    }
    return error.message;
  }
  
  return 'Unknown error occurred';
}

/**
 * Check if code needs syntax highlighting update
 * @param oldCode - Previous code
 * @param newCode - New code
 * @returns Whether update is needed
 */
export function shouldUpdateSyntaxHighlighting(oldCode: string, newCode: string): boolean {
  return oldCode !== newCode && newCode.trim().length > 0;
} 