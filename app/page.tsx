"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CVForm } from "@/components/cv-form";
import { CVData } from "@/types/cv";
import { generateCVPdf } from "@/lib/pdf-generator";

export default function CVGenerator() {
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
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

    setIsGenerating(true);
    try {
      const pdfDoc = await generateCVPdf(cvData);
      const pdfBlob = pdfDoc.output("blob");
      setPdfPreviewUrl(URL.createObjectURL(pdfBlob));
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDF = async () => {
    if (!cvData) return;
    setIsGenerating(true);
    try {
      const pdfDoc = await generateCVPdf(cvData);
      pdfDoc.save(`${cvData.firstName}_${cvData.lastName}_CV.pdf`);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left column - Form */}
      <div className="w-1/2 border-r overflow-y-auto">
        <CVForm onDataChange={setCvData} initialData={cvData || undefined} />
      </div>

      {/* Right column - PDF Preview */}
      <div className="w-1/2 overflow-hidden bg-muted/20 flex flex-col">
        <div className="sticky top-0 z-10 bg-white p-4 shadow flex items-center justify-between">
          <h2 className="text-xl font-bold">PDF Preview</h2>
          {cvData && (
            <Button onClick={generatePDF} disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Download PDF"}
            </Button>
          )}
        </div>

        {isGenerating ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Generating PDF...</p>
          </div>
        ) : pdfPreviewUrl ? (
          <iframe
            ref={iframeRef}
            src={pdfPreviewUrl}
            className="w-full h-full border-none"
            title="PDF Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="">Enter your details to generate a preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
