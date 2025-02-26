/**
 * Simple utility to parse basic Markdown formatting
 */

/**
 * Processes bold text (wrapped in ** markers) to proper bold formatting
 * @param text Text containing markdown bold syntax
 * @param renderer Function that handles the rendering of bold text
 */
export function processBoldText(
  text: string,
  renderer: (text: string, isBold: boolean) => void
): void {
  // Split text by bold markers
  const parts = text.split(/(\*\*.*?\*\*)/g);

  parts.forEach((part) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      // Extract text between ** markers and render as bold
      const boldText = part.slice(2, -2);
      renderer(boldText, true);
    } else if (part) {
      // Render regular text
      renderer(part, false);
    }
  });
}

/**
 * Processes italic text (wrapped in * markers) to proper italic formatting
 * @param text Text containing markdown italic syntax
 * @param renderer Function that handles the rendering of italic text
 */
export function processItalicText(
  text: string,
  renderer: (text: string, isItalic: boolean) => void
): void {
  // Split text by italic markers
  const parts = text.split(/(\*[^*]+\*)/g);

  parts.forEach((part) => {
    if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
      // Extract text between * markers and render as italic
      const italicText = part.slice(1, -1);
      renderer(italicText, true);
    } else if (part) {
      // Render regular text
      renderer(part, false);
    }
  });
}

/**
 * Check if text contains markdown formatting
 */
export function containsMarkdown(text: string): boolean {
  return /\*\*.*?\*\*|\*[^*]+\*/.test(text);
}

/**
 * Clean markdown formatting from text
 */
export function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold markers
    .replace(/\*([^*]+)\*/g, "$1"); // Remove italic markers
}
