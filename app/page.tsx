"use client";

import { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { CVForm } from "@/components/cv-form";
import { CVData } from "@/types/cv";

import "jspdf-autotable";

export default function CVGenerator() {
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Clean up the object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  // Update preview when CV data changes
  useEffect(() => {
    if (cvData) generatePreview();
  }, [cvData]);

  const generatePreview = async () => {
    if (!cvData) return;
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);

    const pdfDoc = await createPDF(cvData, false);
    const pdfBlob = pdfDoc.output("blob");
    setPdfPreviewUrl(URL.createObjectURL(pdfBlob));
  };

  const generatePDF = async () => {
    if (!cvData) return;
    const pdfDoc = await createPDF(cvData, true);
    pdfDoc.save(`${cvData.firstName}_${cvData.lastName}_CV.pdf`);
  };

  const createPDF = async (data: CVData, forDownload: boolean) => {
    // Create PDF document
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Register fonts and set document properties
    pdf.addFont("helvetica", "normal", "helvetica", "normal");
    pdf.addFont("helvetica", "bold", "helvetica", "bold");
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
    let yPos = margin.top;

    // Define standardized spacing - slightly increased internal padding
    const spacing = {
      afterH1: 10, // Keep the same
      beforeH2: 12, // Keep the same
      afterH2: 6, // Keep the same
      beforeH3: 8, // Keep the same
      afterH3: 6, // Increased from 5
      paragraphGap: 6, // Increased from 5
      lineHeight: 7, // Increased from 6
      itemGap: 9, // Increased from 8
      sectionGap: 10, // Keep the same
    };

    // Define style type
    type PDFStyle = {
      fontSize: number;
      fontStyle: "bold" | "normal";
      color: [number, number, number];
    };

    // Define heading styles with consistent hierarchy - increased font sizes
    const styles: Record<string, PDFStyle> = {
      // Heading level styles
      h1: {
        fontSize: 26, // Increased from 24
        fontStyle: "bold",
        color: [0, 0, 0],
      },
      h2: {
        fontSize: 17, // Increased from 16
        fontStyle: "bold",
        color: [0, 0, 0],
      },
      h3: {
        fontSize: 13, // Increased from 12
        fontStyle: "bold",
        color: [0, 0, 0],
      },
      h4: {
        fontSize: 12, // Increased from 11
        fontStyle: "bold",
        color: [0, 0, 0],
      },

      // Text styles - increased sizes
      normal: {
        fontSize: 11, // Increased from 10
        fontStyle: "normal",
        color: [0, 0, 0],
      },
      small: {
        fontSize: 10, // Increased from 9
        fontStyle: "normal",
        color: [0, 0, 0],
      },
      link: {
        fontSize: 11, // Increased from 10
        fontStyle: "normal",
        color: [0, 0, 238],
      },
      muted: {
        fontSize: 10, // Increased from 9
        fontStyle: "normal",
        color: [100, 100, 100],
      },
      accent: {
        fontSize: 11, // Increased from 10
        fontStyle: "normal",
        color: [50, 90, 140],
      },
    };

    // Helper functions
    const applyStyle = (style: keyof typeof styles) => {
      pdf.setFontSize(styles[style].fontSize);
      pdf.setFont("helvetica", styles[style].fontStyle);
      pdf.setTextColor(...(styles[style].color || [0, 0, 0]));
    };

    const addSectionHeader = (title: string) => {
      // Add consistent spacing before each section
      yPos += spacing.beforeH2;

      applyStyle("h2");
      pdf.text(title, margin.left, yPos);
      yPos += spacing.lineHeight * 0.8;

      // Section divider
      pdf.setDrawColor(50, 90, 140);
      pdf.setLineWidth(0.5);
      pdf.line(margin.left, yPos, pageWidth - margin.right, yPos);
      yPos += spacing.afterH2;
    };

    const renderTextWithBold = (
      text: string,
      x: number,
      y: number,
      maxWidth: number
    ) => {
      if (!text.includes("**")) {
        const lines = pdf.splitTextToSize(text, maxWidth);
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
            pdf.setFont("helvetica", "bold");
            pdf.text(boldText, x + xOffset, y + heightUsed);
            xOffset += pdf.getTextWidth(boldText);
          } else if (part) {
            pdf.setFont("helvetica", "normal");
            pdf.text(part, x + xOffset, y + heightUsed);
            xOffset += pdf.getTextWidth(part);
          }
        });
        heightUsed += spacing.lineHeight;
      });
      return heightUsed;
    };

    const checkForNewPage = (requiredSpace: number) => {
      if (yPos + requiredSpace > pageHeight - margin.bottom) {
        pdf.addPage();
        yPos = margin.top;
        return true;
      }
      return false;
    };

    // Helper function to draw consistent badges - slightly larger for better readability
    const drawBadge = (
      text: string,
      x: number,
      y: number,
      isBold: boolean = false
    ) => {
      const badgePadding = 3;
      const badgeHeight = 6.5; // Slightly increased from 6
      const textWidth = pdf.getTextWidth(text);
      const badgeWidth = textWidth + badgePadding * 2;

      // Draw badge background
      pdf.setFillColor(240, 240, 245);
      pdf.roundedRect(x, y - 4, badgeWidth, badgeHeight, 1, 1, "F");

      // Draw text
      if (isBold) pdf.setFont("helvetica", "bold");
      else pdf.setFont("helvetica", "normal");
      pdf.text(text, x + badgePadding, y);

      return badgeWidth;
    };

    // Header - Name (h1)
    applyStyle("h1");
    pdf.text(`${data.firstName} ${data.lastName}`, margin.left, yPos);
    yPos += spacing.afterH1;

    // Contact information - fixed to prevent overlap
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

    // Display in a 2x2 grid with fixed positioning
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

    // Section: About
    if (data.about) {
      addSectionHeader("About");
      applyStyle("normal");
      yPos += renderTextWithBold(data.about, margin.left, yPos, contentWidth);
    }

    // Section: Skills with evenly padded badges
    if (data.skills?.length) {
      checkForNewPage(spacing.beforeH2 + spacing.lineHeight * 2);
      addSectionHeader("Skills");

      applyStyle("normal");
      let currentX = margin.left;
      const maxWidth = contentWidth;

      for (const skill of data.skills) {
        const cleanSkill = skill.replace(/\*\*/g, "");
        const isBold = skill.includes("**");

        // Get badge width to check for wrapping
        const skillWidth = pdf.getTextWidth(cleanSkill) + 6;
        if (currentX + skillWidth > margin.left + maxWidth) {
          currentX = margin.left;
          yPos += spacing.lineHeight + 2; // Added more vertical space between skill rows
        }

        // Draw skill badge using the common function
        const badgeWidth = drawBadge(cleanSkill, currentX, yPos, isBold);
        currentX += badgeWidth + 4; // Increased from 3
      }
      yPos += spacing.paragraphGap;
    }

    // Experience Section
    if (data.experience?.length) {
      checkForNewPage(spacing.beforeH2 + spacing.lineHeight * 3);
      addSectionHeader("Experience");

      for (let i = 0; i < data.experience.length; i++) {
        const exp = data.experience[i];
        checkForNewPage(spacing.lineHeight * 3);

        // Position and company (h3)
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
          yPos +=
            spacing.lineHeight * summaryLines.length + spacing.paragraphGap;
        }

        // Projects
        if (exp.projects?.length) {
          for (let j = 0; j < exp.projects.length; j++) {
            const project = exp.projects[j];
            checkForNewPage(spacing.lineHeight * 3);

            // Project title (h4)
            applyStyle("h4");
            pdf.text(`• ${project.name}`, margin.left + 3, yPos);
            yPos += spacing.lineHeight; // Restored to normal lineHeight (was -1)

            // Description
            applyStyle("normal");
            const descLines = pdf.splitTextToSize(
              project.description,
              contentWidth - 6
            );
            pdf.text(descLines, margin.left + 6, yPos);
            yPos +=
              spacing.lineHeight * descLines.length +
              spacing.paragraphGap * 0.5;

            // Technologies
            if (project.technologies?.length) {
              applyStyle("accent");
              const techLabel = "Technologies:";
              pdf.text(techLabel, margin.left + 6, yPos);

              let techX = margin.left + 6 + pdf.getTextWidth(techLabel + " ");
              let techY = yPos;

              for (const tech of project.technologies) {
                applyStyle("small");
                const techWidth = pdf.getTextWidth(tech) + 6;

                if (techX + techWidth > pageWidth - margin.right) {
                  techX = margin.left + 6 + pdf.getTextWidth(techLabel + " ");
                  techY += spacing.lineHeight;
                }

                // Use common badge function
                const badgeWidth = drawBadge(tech, techX, techY);
                techX += badgeWidth + 4;
              }

              yPos = techY + spacing.lineHeight;
            }

            // Add more space after project except for last one
            if (j < exp.projects.length - 1) {
              yPos += spacing.paragraphGap + 1; // Added 1 point extra
            }
          }
        }

        // Add space between experiences
        if (i < data.experience.length - 1) {
          yPos += spacing.itemGap;
        }
      }
    }

    // Education Section
    if (data.education?.length) {
      checkForNewPage(spacing.beforeH2 + spacing.lineHeight * 3);
      addSectionHeader("Education");

      for (let i = 0; i < data.education.length; i++) {
        const edu = data.education[i];
        checkForNewPage(spacing.lineHeight * 3);

        // Degree (h3)
        applyStyle("h3");
        pdf.text(edu.degree, margin.left, yPos);

        // Graduation date
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

        // Add space between education items
        if (i < data.education.length - 1) {
          yPos += spacing.paragraphGap;
        }
      }
    }

    // Projects Section - with clear visual separation
    if (data.projects?.length) {
      checkForNewPage(spacing.beforeH2 + spacing.lineHeight * 3);
      addSectionHeader("Projects");

      for (let i = 0; i < data.projects.length; i++) {
        const project = data.projects[i];
        checkForNewPage(spacing.lineHeight * 4);

        // Project header background for emphasis and visual separation
        pdf.setFillColor(245, 245, 250);
        pdf.roundedRect(
          margin.left - 2,
          yPos - 5,
          contentWidth + 4,
          spacing.lineHeight + 4,
          1,
          1,
          "F"
        );

        // Project name (h3)
        applyStyle("h3");
        pdf.text(project.name, margin.left, yPos);
        yPos += spacing.afterH3 + 2; // Extra space after project title

        // Links
        const links = [
          {
            label: "GitHub",
            value: project.github,
            url: project.github?.startsWith("http")
              ? project.github
              : `https://github.com/${project.github}`,
          },
          {
            label: "URL",
            value: project.url,
            url: project.url?.startsWith("http")
              ? project.url
              : `https://${project.url}`,
          },
        ].filter((link) => link.value);

        if (links.length) {
          applyStyle("link");
          links.forEach((link, index) => {
            const x = margin.left + (index * contentWidth) / 2;
            pdf.text(`${link.label}: ${link.value}`, x, yPos);
            pdf.link(x, yPos - 5, 100, 6, { url: link.url });
          });
          yPos += spacing.lineHeight;
        }

        // Description
        applyStyle("normal");
        const descLines = pdf.splitTextToSize(
          project.description,
          contentWidth
        );
        pdf.text(descLines, margin.left, yPos);
        yPos +=
          spacing.lineHeight * descLines.length + spacing.paragraphGap * 0.5;

        // Technologies
        if (project.technologies?.length) {
          applyStyle("accent");
          const techLabel = "Technologies:";
          pdf.text(techLabel, margin.left, yPos);

          let techX = margin.left + pdf.getTextWidth(techLabel) + 4;
          let techY = yPos;

          for (const tech of project.technologies) {
            applyStyle("small");
            const badgeWidth = drawBadge(tech, techX, techY);
            techX += badgeWidth + 5; // Increased from 4

            if (techX > pageWidth - margin.right - 10) {
              techX = margin.left + pdf.getTextWidth(techLabel) + 4;
              techY += spacing.lineHeight;
            }
          }
          yPos = techY + spacing.lineHeight + 1; // Added 1 point extra
        }

        // Add space between projects
        if (i < data.projects.length - 1) {
          yPos += spacing.itemGap;
        }
      }
    }

    // Languages Section - with tighter spacing
    if (data.languages && Object.keys(data.languages).length) {
      checkForNewPage(spacing.beforeH2 + spacing.lineHeight * 2);
      addSectionHeader("Languages");

      const languageEntries = Object.entries(data.languages);
      const languagesPerRow = 3;
      const colWidth = contentWidth / languagesPerRow;

      for (let i = 0; i < languageEntries.length; i += languagesPerRow) {
        checkForNewPage(spacing.lineHeight * 1.5);

        const rowItems = languageEntries.slice(i, i + languagesPerRow);
        rowItems.forEach(([language, level], idx) => {
          const xPos = margin.left + idx * colWidth;

          // Draw language as badge for consistency
          applyStyle("small");
          const fullText = `${language} (${level})`;
          drawBadge(fullText, xPos, yPos, true);
        });

        yPos += spacing.lineHeight * 1.5; // Increased from 1.3
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
  };

  return (
    <div className="flex h-screen">
      {/* Left column - Form */}
      <div className="w-1/2 border-r overflow-y-auto">
        <CVForm onDataChange={setCvData} initialData={cvData || undefined} />
      </div>

      {/* Right column - PDF Preview */}
      <div className="w-1/2 overflow-hidden bg-gray-100 flex flex-col">
        <div className="sticky top-0 z-10 bg-white p-4 shadow flex items-center justify-between">
          <h2 className="text-xl font-bold">PDF Preview</h2>
          {cvData && <Button onClick={generatePDF}>Download PDF</Button>}
        </div>

        {pdfPreviewUrl ? (
          <iframe
            ref={iframeRef}
            src={pdfPreviewUrl}
            className="w-full h-full border-none"
            title="PDF Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              Enter your details to generate a preview
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
