"use client";

import { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CVData } from "@/types/cv";
import { Github, Mail, Phone, Linkedin } from "lucide-react";
import { CVForm } from "@/components/cv-form";

export default function CVGenerator() {
  const [cvData, setCvData] = useState<CVData | null>(null);
  const cvRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const generatePDF = async () => {
    if (!cvRef.current || !cvData) return;

    try {
      const canvas = await html2canvas(cvRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      // If CV is longer than one page, add additional pages as needed
      if (imgHeight > 297) {
        const pageCount = Math.ceil(imgHeight / 297);

        for (let i = 1; i < pageCount; i++) {
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, -297 * i, imgWidth, imgHeight);
        }
      }

      pdf.save(`${cvData.firstName}_${cvData.lastName}_CV.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left column - Form */}
      <div className="w-1/2 border-r">
        <CVForm
          onDataChange={(data) => setCvData(data)}
          initialData={cvData || undefined}
        />
      </div>

      {/* Right column - Preview */}
      <div className="w-1/2 overflow-y-auto bg-gray-100 p-4">
        <div className="sticky top-0 z-10 bg-white p-4 shadow mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Preview</h2>
          {cvData && <Button onClick={generatePDF}>Generate PDF</Button>}
        </div>

        {cvData && (
          <div className="space-y-4">
            <Card className="a4-page" ref={cvRef}>
              <div className="cv-content p-6 max-w-full">
                {/* Header */}
                <div className="mb-5">
                  <h1 className="text-3xl font-bold mb-4 text-gray-900">
                    {cvData.firstName} {cvData.lastName}
                  </h1>

                  <div className="flex flex-wrap justify-between gap-y-1">
                    <div className="space-y-2 w-1/2">
                      {cvData.email && (
                        <div className="flex items-center">
                          <Mail
                            size={18}
                            className="flex-shrink-0 text-gray-700 mr-3"
                          />
                          <span>{cvData.email}</span>
                        </div>
                      )}
                      {cvData.github && (
                        <div className="flex items-center">
                          <Github
                            size={18}
                            className="flex-shrink-0 text-gray-700 mr-3"
                          />
                          <span>{cvData.github}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 w-1/2">
                      {cvData.phone && (
                        <div className="flex items-center">
                          <Phone
                            size={18}
                            className="flex-shrink-0 text-gray-700 mr-3"
                          />
                          <span>{cvData.phone}</span>
                        </div>
                      )}
                      {cvData.linkedin && (
                        <div className="flex items-center">
                          <Linkedin
                            size={18}
                            className="flex-shrink-0 text-gray-700 mr-3"
                          />
                          <span>{cvData.linkedin}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* About */}
                {cvData.about && (
                  <div className="mb-5">
                    <h2 className="text-xl font-bold mb-1.5 text-gray-800">
                      About
                    </h2>
                    <div className="h-px w-full bg-gray-300 mb-2"></div>
                    <p className="text-sm leading-snug text-gray-700">
                      {cvData.about}
                    </p>
                  </div>
                )}

                {/* Skills */}
                {cvData.skills && cvData.skills.length > 0 && (
                  <div className="mb-5">
                    <h2 className="text-xl font-bold mb-1.5 text-gray-800">
                      Skills
                    </h2>
                    <div className="h-px w-full bg-gray-300 mb-2"></div>
                    <p className="text-sm leading-snug text-gray-700">
                      {cvData.skills.join(" • ")}
                    </p>
                  </div>
                )}

                {/* Languages */}
                {cvData.languages &&
                  Object.keys(cvData.languages).length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold mb-2 text-gray-800">
                        Languages
                      </h2>
                      <div className="h-px w-full bg-gray-300 mb-4"></div>
                      <div className="flex flex-wrap">
                        {Object.entries(cvData.languages).map(
                          ([language, level], index) => (
                            <div key={index} className="w-1/3 mb-2">
                              <span className="font-medium">{language}:</span>{" "}
                              <span className="text-gray-600">{level}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Experience */}
                {cvData.experience && cvData.experience.length > 0 && (
                  <div className="mb-5">
                    <h2 className="text-xl font-bold mb-1.5 text-gray-800">
                      Experience
                    </h2>
                    <div className="h-px w-full bg-gray-300 mb-2"></div>
                    {cvData.experience.map((exp, index) => (
                      <div key={index} className="mb-4">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="text-base font-semibold text-gray-800">
                            {exp.position} at {exp.company}
                          </h3>
                          <p className="text-sm text-gray-600 whitespace-nowrap">
                            {exp.startDate} - {exp.endDate}
                          </p>
                        </div>

                        {exp.summary && (
                          <p className="text-sm leading-snug mb-2 text-gray-700">
                            {exp.summary}
                          </p>
                        )}

                        {exp.projects && exp.projects.length > 0 && (
                          <div className="space-y-2 pl-3">
                            {exp.projects.map((project, pidx) => (
                              <div
                                key={pidx}
                                className="border-l border-gray-400 pl-2 py-0.5"
                              >
                                <h4 className="text-sm font-medium text-gray-800">
                                  {project.name}
                                </h4>
                                <p className="text-sm leading-snug text-gray-700">
                                  {project.description}
                                </p>
                                <div className="text-xs text-gray-600">
                                  <span className="font-medium">Tech:</span>{" "}
                                  {project.technologies.join(", ")}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Education */}
                {cvData.education && cvData.education.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">
                      Education
                    </h2>
                    <div className="h-px w-full bg-gray-300 mb-4"></div>
                    {cvData.education.map((edu, index) => (
                      <div key={index} className="mb-4">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {edu.degree}
                          </h3>
                          <p className="text-gray-600">{edu.graduationDate}</p>
                        </div>
                        <p className="text-gray-700">{edu.institution}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Projects */}
                {cvData.projects && cvData.projects.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">
                      Projects
                    </h2>
                    <div className="h-px w-full bg-gray-300 mb-4"></div>
                    {cvData.projects.map((project, index) => (
                      <div key={index} className="mb-5">
                        <div className="flex justify-between items-baseline mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {project.name}
                          </h3>
                          <div className="text-sm space-x-4">
                            {project.github && (
                              <span className="text-gray-600">
                                GitHub: {project.github}
                              </span>
                            )}
                            {project.url && (
                              <span className="text-gray-600">
                                URL: {project.url}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">
                          {project.description}
                        </p>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Technologies:</span>{" "}
                          {project.technologies.join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-xs text-gray-500 text-center mt-6">
                  Generated with CV Generator -{" "}
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </Card>
            <div className="flex justify-center gap-2">
              {Array.from({
                length: Math.ceil(cvRef.current?.scrollHeight || 0 / 1122),
              }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    currentPage === i + 1 ? "bg-primary" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
