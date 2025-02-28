import { jsPDF } from "jspdf";

/**
 * Add Noto Sans fonts to jsPDF instance using fonts from public directory
 */
export async function addFonts(pdf: jsPDF): Promise<void> {
  // Check if fonts are already added to avoid re-adding
  try {
    // Try to get current font info
    const currentFont = pdf.getFont();
    if (currentFont && currentFont.fontName === "NotoSans") return;
  } catch (e) {
    // Continue if font check fails
  }

  try {
    // Load fonts from public directory
    const fontPaths = {
      normal: "/fonts/NotoSans-Regular.ttf",
      bold: "/fonts/NotoSans-Bold.ttf",
    };

    // Function to fetch and convert font to binary data
    const fetchFont = async (url: string): Promise<ArrayBuffer> => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load font from ${url}`);
      }
      return await response.arrayBuffer();
    };

    // Load fonts asynchronously
    const [regularFontData, boldFontData] = await Promise.all([
      fetchFont(fontPaths.normal),
      fetchFont(fontPaths.bold),
    ]);

    // Convert ArrayBuffer to Base64 string
    const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
      let binary = "";
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    };

    // Convert to base64 and add to VFS
    const regularBase64 = arrayBufferToBase64(regularFontData);
    const boldBase64 = arrayBufferToBase64(boldFontData);

    // Add to PDF virtual file system
    pdf.addFileToVFS("NotoSans-Regular.ttf", regularBase64);
    pdf.addFileToVFS("NotoSans-Bold.ttf", boldBase64);

    // Register fonts
    pdf.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
    pdf.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");

    // Set as default font
    pdf.setFont("NotoSans");
  } catch (error) {
    console.error("Error loading fonts:", error);
    // Fallback to default
    pdf.setFont("helvetica");
  }
}
