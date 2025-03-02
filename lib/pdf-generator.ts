import { jsPDF } from "jspdf";
import { CVData } from "@/types/cv";
import "jspdf-autotable";

// Import fonts for Unicode support
import { addFonts } from "./pdf-fonts";

// Types for configurable options
export interface PDFOptions {
  colorScheme?: {
    primary: [number, number, number];
    secondary: [number, number, number];
    accent: [number, number, number];
    muted: [number, number, number];
    link: [number, number, number];
  };
  spacing?: typeof defaultSpacing;
  styles?: Record<string, PDFStyle>;
  font?: string;
}

// Style type for text elements
interface PDFStyle {
  fontSize: number;
  fontStyle: "bold" | "normal";
  color: [number, number, number];
}

// Default spacing values
const defaultSpacing = {
  afterH1: 8,
  beforeH2: 4,
  afterH2: 5,
  beforeH3: 7,
  afterH3: 5,
  paragraphGap: 5,
  lineHeight: 7,
  itemGap: 7,
  sectionGap: 8,
  badgePadding: 2,
  badgeHeight: 5.5,
  badgeSpacing: 3,
};

// Default styles
const defaultStyles: Record<string, PDFStyle> = {
  h1: {
    fontSize: 26,
    fontStyle: "bold",
    color: [0, 0, 0],
  },
  h2: {
    fontSize: 17,
    fontStyle: "bold",
    color: [0, 0, 0],
  },
  h3: {
    fontSize: 13,
    fontStyle: "bold",
    color: [0, 0, 0],
  },
  h4: {
    fontSize: 12,
    fontStyle: "bold",
    color: [0, 0, 0],
  },
  normal: {
    fontSize: 11,
    fontStyle: "normal",
    color: [0, 0, 0],
  },
  small: {
    fontSize: 10,
    fontStyle: "normal",
    color: [0, 0, 0],
  },
  link: {
    fontSize: 11,
    fontStyle: "normal",
    color: [0, 0, 238],
  },
  muted: {
    fontSize: 10,
    fontStyle: "normal",
    color: [100, 100, 100],
  },
  accent: {
    fontSize: 11,
    fontStyle: "normal",
    color: [50, 90, 140],
  },
};

/**
 * Main function to generate a CV PDF
 * Now async to support font loading
 */
export async function generateCVPdf(
  data: CVData,
  options?: PDFOptions
): Promise<jsPDF> {
  // Create PDF document
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Add Unicode font support (now async)
  await addFonts(pdf);

  // Use a font that supports Polish characters
  const fontName = options?.font || "NotoSans";

  // Setup fonts and properties
  pdf.setProperties({
    title: `${data.firstName} ${data.lastName} - CV`,
    subject: "Curriculum Vitae",
    author: `${data.firstName} ${data.lastName}`,
    creator: "CV Generator",
  });

  // Define layout constants
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const contentWidth = pageWidth - margin.left - margin.right;

  // Merge default and custom options
  const styles = options?.styles || defaultStyles;
  const spacing = { ...defaultSpacing, ...(options?.spacing || {}) };

  // Initialize PDF context
  const ctx = {
    pdf,
    pageWidth,
    pageHeight,
    margin,
    contentWidth,
    styles,
    spacing,
    yPos: margin.top,
    fontName,
  };

  // Helper components
  const components = createPDFComponents(ctx);

  // Start building the CV
  renderCV(data, ctx, components);

  return pdf;
}

/**
 * Create reusable PDF components
 */
function createPDFComponents(ctx: PDFContext) {
  const {
    pdf,
    pageWidth,
    pageHeight,
    margin,
    contentWidth,
    styles,
    spacing,
    fontName,
  } = ctx;

  /**
   * Apply text style with Unicode support
   */
  const applyStyle = (style: keyof typeof styles) => {
    pdf.setFontSize(styles[style].fontSize);

    // Use the Unicode-compatible font with correct style
    const fontStyle = styles[style].fontStyle === "bold" ? "bold" : "normal";
    pdf.setFont(fontName, fontStyle);

    pdf.setTextColor(...styles[style].color);
    return { height: styles[style].fontSize / 4 };
  };

  /**
   * Check if we need a new page
   */
  const checkForNewPage = (requiredSpace: number, yPos: number): number => {
    if (yPos + requiredSpace > pageHeight - margin.bottom) {
      pdf.addPage();
      return margin.top;
    }
    return yPos;
  };

  /**
   * Render a section header with divider
   */
  const renderSectionHeader = (title: string, yPos: number): number => {
    yPos += spacing.beforeH2;
    applyStyle("h2");
    pdf.text(title, margin.left, yPos);
    yPos += spacing.lineHeight * 0.8;

    // Section divider
    pdf.setDrawColor(50, 90, 140);
    pdf.setLineWidth(0.5);
    pdf.line(margin.left, yPos, pageWidth - margin.right, yPos);
    return yPos + spacing.afterH2;
  };

  /**
   * Render a badge with text
   */
  const renderBadge = (
    text: string,
    x: number,
    y: number,
    isBold: boolean = false
  ): number => {
    const badgePadding = spacing.badgePadding;
    const badgeHeight = spacing.badgeHeight;
    const textWidth = pdf.getTextWidth(text);
    const badgeWidth = textWidth + badgePadding * 2;

    // Draw badge background
    pdf.setFillColor(240, 240, 245);
    pdf.roundedRect(x, y - 3.5, badgeWidth, badgeHeight, 1, 1, "F");

    // Draw text with proper Unicode font
    pdf.setFont(fontName, isBold ? "bold" : "normal");
    pdf.text(text, x + badgePadding, y);

    return badgeWidth;
  };

  /**
   * Render text with bold markdown support (**bold**)
   */
  const renderTextWithBold = (
    text: string,
    x: number,
    y: number,
    maxWidth: number
  ): number => {
    if (!text.includes("**")) {
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.setFont(fontName, "normal");
      pdf.text(lines, x, y);
      return spacing.lineHeight * lines.length;
    }

    const lines = pdf.splitTextToSize(text, maxWidth);
    let heightUsed = 0;

    lines.forEach((line: string) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      let xOffset = 0;

      parts.forEach((part: string) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          const boldText = part.slice(2, -2);
          pdf.setFont(fontName, "bold");
          pdf.text(boldText, x + xOffset, y + heightUsed);
          xOffset += pdf.getTextWidth(boldText);
        } else if (part) {
          pdf.setFont(fontName, "normal");
          pdf.text(part, x + xOffset, y + heightUsed);
          xOffset += pdf.getTextWidth(part);
        }
      });
      heightUsed += spacing.lineHeight;
    });
    return heightUsed;
  };

  /**
   * Render a row of badges (with wrapping)
   */
  const renderBadgeRow = (
    items: string[],
    startX: number,
    startY: number,
    maxWidth: number,
    labelWidth: number = 0
  ): number => {
    let currentX = startX;
    let currentY = startY;
    const initialX = startX; // Remember initial X for proper alignment on new lines

    for (const item of items) {
      const cleanItem = item.replace(/\*\*/g, "");
      const isBold = item.includes("**");

      // Calculate width with padding
      const itemWidth =
        pdf.getTextWidth(cleanItem) +
        spacing.badgePadding * 2 +
        spacing.badgeSpacing;

      // Check if we need to wrap to new line
      if (currentX + itemWidth > margin.left + maxWidth) {
        currentX = initialX; // Use initial X for proper alignment
        currentY += spacing.lineHeight;
      }

      // Draw the badge
      const badgeWidth = renderBadge(cleanItem, currentX, currentY, isBold);
      currentX += badgeWidth + spacing.badgeSpacing;
    }

    return currentY + spacing.lineHeight;
  };

  return {
    applyStyle,
    checkForNewPage,
    renderSectionHeader,
    renderBadge,
    renderTextWithBold,
    renderBadgeRow,
  };
}

/**
 * PDF Context type for simpler parameter passing
 */
interface PDFContext {
  pdf: jsPDF;
  pageWidth: number;
  pageHeight: number;
  margin: { top: number; right: number; bottom: number; left: number };
  contentWidth: number;
  styles: Record<string, PDFStyle>;
  spacing: typeof defaultSpacing;
  yPos: number;
  fontName: string; // Added fontName to context
}

/**
 * Render the complete CV
 */
function renderCV(
  data: CVData,
  ctx: PDFContext,
  components: ReturnType<typeof createPDFComponents>
) {
  const { pdf, pageWidth, pageHeight, margin, contentWidth, spacing } = ctx;
  let { yPos } = ctx;

  const {
    applyStyle,
    checkForNewPage,
    renderSectionHeader,
    renderBadge,
    renderTextWithBold,
    renderBadgeRow,
  } = components;

  // Header - Name
  applyStyle("h1");
  pdf.text(`${data.firstName} ${data.lastName}`, margin.left, yPos);
  yPos += spacing.afterH1;

  // Contact information
  applyStyle("normal");
  const contactInfo = [
    { label: "Email", value: data.email, link: `mailto:${data.email}` },
    { label: "Phone", value: data.phone, link: `tel:${data.phone}` },
    {
      label: "GitHub",
      value: data.github,
      link: data.github?.startsWith("http")
        ? data.github
        : `https://github.com/${data.github}`,
    },
    {
      label: "LinkedIn",
      value: data.linkedin,
      link: data.linkedin?.startsWith("http")
        ? data.linkedin
        : `https://linkedin.com/in/${data.linkedin}`,
    },
  ].filter((item) => item.value);

  // Display contacts in a 2x2 grid
  const contactColumns = 2;
  const contactRows = Math.ceil(contactInfo.length / contactColumns);

  for (let i = 0; i < contactInfo.length; i++) {
    const item = contactInfo[i];
    const col = i % contactColumns;
    const row = Math.floor(i / contactColumns);

    const x = margin.left + col * (contentWidth / contactColumns);
    const y = yPos + row * spacing.lineHeight;

    pdf.text(`${item.label}: ${item.value}`, x, y);

    applyStyle("link");
    pdf.link(x, y - 5, 100, 6, { url: item.link });
    applyStyle("normal");
  }

  yPos += contactRows * spacing.lineHeight + spacing.paragraphGap;

  // About Section
  if (data.about) {
    yPos = renderSectionHeader("About", yPos);
    applyStyle("normal");
    yPos += renderTextWithBold(data.about, margin.left, yPos, contentWidth);
  }

  // Skills Section
  if (data.skills?.length) {
    yPos = checkForNewPage(spacing.beforeH2 + spacing.lineHeight * 2, yPos);
    yPos = renderSectionHeader("Skills", yPos);
    applyStyle("normal");
    yPos = renderBadgeRow(data.skills, margin.left, yPos, contentWidth);
    yPos += spacing.paragraphGap;
  }

  // Experience Section
  if (data.experience?.length) {
    yPos = checkForNewPage(spacing.beforeH2 + spacing.lineHeight * 3, yPos);
    yPos = renderSectionHeader("Experience", yPos);

    for (let i = 0; i < data.experience.length; i++) {
      const exp = data.experience[i];
      yPos = checkForNewPage(spacing.lineHeight * 3, yPos);

      // Position and company
      applyStyle("h3");
      pdf.text(`${exp.position} at ${exp.company}`, margin.left, yPos);

      // Date range - right aligned
      applyStyle("normal");
      const dateText = `${exp.startDate} - ${exp.endDate}`;
      pdf.text(
        dateText,
        pageWidth - margin.right - pdf.getTextWidth(dateText),
        yPos
      );
      yPos += spacing.afterH3;

      // Summary
      if (exp.summary) {
        applyStyle("normal");
        const summaryLines = pdf.splitTextToSize(exp.summary, contentWidth);
        pdf.text(summaryLines, margin.left, yPos);
        yPos += spacing.lineHeight * summaryLines.length + spacing.paragraphGap;
      }

      // Projects
      if (exp.projects?.length) {
        for (let j = 0; j < exp.projects.length; j++) {
          const project = exp.projects[j];
          yPos = checkForNewPage(spacing.lineHeight * 3, yPos);

          // Project title
          applyStyle("h4");
          pdf.text(`• ${project.name}`, margin.left + 3, yPos);
          yPos += spacing.lineHeight;

          // Description
          applyStyle("normal");
          const descLines = pdf.splitTextToSize(
            project.description,
            contentWidth - 6
          );
          pdf.text(descLines, margin.left + 6, yPos);
          yPos +=
            spacing.lineHeight * descLines.length + spacing.paragraphGap * 0.5;

          // Technologies with proper alignment
          if (project.technologies?.length) {
            applyStyle("accent");
            // Use renderBadgeRow with label offset for proper alignment
            yPos = renderBadgeRow(
              project.technologies,
              margin.left,
              yPos,
              contentWidth - 6
            );
          }

          // Space after project
          if (j < exp.projects.length - 1) {
            yPos += spacing.paragraphGap;
          }
        }
      }

      // Space between experiences
      if (i < data.experience.length - 1) {
        yPos += spacing.itemGap;
      }
    }
  }

  // Education Section
  if (data.education?.length) {
    yPos = checkForNewPage(spacing.beforeH2 + spacing.lineHeight * 3, yPos);
    yPos = renderSectionHeader("Education", yPos);

    for (let i = 0; i < data.education.length; i++) {
      const edu = data.education[i];
      yPos = checkForNewPage(spacing.lineHeight * 3, yPos);

      // Degree
      applyStyle("h3");
      pdf.text(edu.degree, margin.left, yPos);

      // Graduation date - right aligned
      applyStyle("normal");
      pdf.text(
        edu.graduationDate,
        pageWidth - margin.right - pdf.getTextWidth(edu.graduationDate),
        yPos
      );
      yPos += spacing.afterH3;

      // Institution
      applyStyle("normal");
      pdf.text(edu.institution, margin.left, yPos);
      yPos += spacing.lineHeight;

      // Space between education items
      if (i < data.education.length - 1) {
        yPos += spacing.paragraphGap;
      }
    }
  }
  // Projects Section
  if (data.projects?.length) {
    yPos = checkForNewPage(spacing.beforeH2 + spacing.lineHeight * 3, yPos);
    yPos = renderSectionHeader("Projects", yPos);

    for (let i = 0; i < data.projects.length; i++) {
      const project = data.projects[i];
      yPos = checkForNewPage(spacing.lineHeight * 4, yPos);

      // Project header background
      pdf.setFillColor(245, 245, 250);
      pdf.roundedRect(
        margin.left - 2,
        yPos - 5,
        contentWidth + 4,
        spacing.lineHeight + 1,
        1,
        1,
        "F"
      );

      // Project name - make it hyperlink if URL exists
      if (project.url) {
        applyStyle("link");
        pdf.text(project.name, margin.left, yPos);
        const projectUrl = project.url.startsWith("http")
          ? project.url
          : `https://${project.url}`;
        pdf.link(margin.left, yPos - 5, pdf.getTextWidth(project.name), 6, {
          url: projectUrl,
        });
      } else {
        applyStyle("h3");
        pdf.text(project.name, margin.left, yPos);
      }

      // GitHub link - on the same row as project name, right aligned
      if (project.github) {
        const githubUrl = project.github.startsWith("http")
          ? project.github
          : `https://github.com/${project.github}`;

        applyStyle("link");
        const githubText = project.github;
        const githubX = pageWidth - margin.right - pdf.getTextWidth(githubText);
        pdf.text(githubText, githubX, yPos);
        pdf.link(githubX, yPos - 5, pdf.getTextWidth(githubText), 6, {
          url: githubUrl,
        });
      }

      yPos += spacing.afterH3 + 2;

      // Description
      applyStyle("normal");
      const descLines = pdf.splitTextToSize(project.description, contentWidth);
      pdf.text(descLines, margin.left, yPos);
      yPos +=
        spacing.lineHeight * descLines.length + spacing.paragraphGap * 0.5;

      // Technologies with proper alignment
      if (project.technologies?.length) {
        applyStyle("accent");
        // Use renderBadgeRow with label offset for proper alignment
        yPos = renderBadgeRow(
          project.technologies,
          margin.left,
          yPos,
          contentWidth
        );
      }

      // Space between projects
      if (i < data.projects.length - 1) {
        yPos += spacing.itemGap;
      }
    }
  }

  // Languages Section
  if (data.languages && Object.keys(data.languages).length) {
    yPos = checkForNewPage(spacing.beforeH2 + spacing.lineHeight * 2, yPos);
    yPos = renderSectionHeader("Languages", yPos);

    const languageEntries = Object.entries(data.languages);
    const languagesPerRow = 3;
    const colWidth = contentWidth / languagesPerRow;

    for (let i = 0; i < languageEntries.length; i += languagesPerRow) {
      yPos = checkForNewPage(spacing.lineHeight * 1.5, yPos);

      const rowItems = languageEntries.slice(i, i + languagesPerRow);
      rowItems.forEach(([language, level], idx) => {
        const xPos = margin.left + idx * colWidth;

        // Draw language as badge
        applyStyle("small");
        const fullText = `${language} (${level})`;
        renderBadge(fullText, xPos, yPos, true);
      });

      yPos += spacing.lineHeight * 1.3;
    }
  }

  // Footer
  applyStyle("muted");
  const footer = `Generated with CV Generator - ${new Date().toLocaleDateString()}`;
  pdf.text(
    footer,
    (pageWidth - pdf.getTextWidth(footer)) / 2,
    pageHeight - margin.bottom
  );

  return pdf;
}
