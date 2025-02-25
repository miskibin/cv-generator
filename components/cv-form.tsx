"use client";

import { CVData } from "@/types/cv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Upload } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CVFormProps {
  onDataChange: (data: CVData) => void;
  initialData?: CVData;
}

export function CVForm({ onDataChange, initialData }: CVFormProps) {
  const defaultData: CVData = {
    firstName: "",
    lastName: "",
    email: "",
    ...initialData,
  };

  const [data, setData] = useState<CVData>(defaultData);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const updateData = (updates: Partial<CVData>) => {
    const newData = { ...data, ...updates };
    setData(newData);
    onDataChange(newData);
  };

  const addArrayItem = (field: keyof CVData, item: any) => {
    const currentArray = (data[field] as any[]) || [];
    updateData({ [field]: [...currentArray, item] });
  };

  const removeArrayItem = (field: keyof CVData, index: number) => {
    const currentArray = (data[field] as any[]) || [];
    updateData({
      [field]: currentArray.filter((_, i) => i !== index),
    });
  };

  const handleJsonInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      if (!event.target.value) {
        setData(defaultData);
        setJsonError(null);
        return;
      }

      const jsonData = JSON.parse(event.target.value) as CVData;
      setData(jsonData);
      onDataChange(jsonData);
      setJsonError(null);
    } catch (error) {
      setJsonError("Invalid JSON format");
    }
  };

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-2rem)] p-4">
      <Card className="mb-4">
        <CardContent className="pt-6">
          <Textarea
            placeholder="Paste your CV data in JSON format here..."
            className="min-h-[100px] font-mono text-sm"
            onChange={handleJsonInput}
          />
          {jsonError && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{jsonError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="personal">
          <AccordionTrigger>Personal Information</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="First Name"
                  value={data.firstName}
                  onChange={(e) => updateData({ firstName: e.target.value })}
                />
                <Input
                  placeholder="Last Name"
                  value={data.lastName}
                  onChange={(e) => updateData({ lastName: e.target.value })}
                />
              </div>
              <Input
                placeholder="Email"
                type="email"
                value={data.email}
                onChange={(e) => updateData({ email: e.target.value })}
              />
              <Input
                placeholder="Phone"
                value={data.phone || ""}
                onChange={(e) => updateData({ phone: e.target.value })}
              />
              <Input
                placeholder="GitHub URL"
                value={data.github || ""}
                onChange={(e) => updateData({ github: e.target.value })}
              />
              <Input
                placeholder="LinkedIn URL"
                value={data.linkedin || ""}
                onChange={(e) => updateData({ linkedin: e.target.value })}
              />
              <Textarea
                placeholder="About yourself"
                value={data.about || ""}
                onChange={(e) => updateData({ about: e.target.value })}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="skills">
          <AccordionTrigger>Skills</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-4">
              {data.skills?.map((skill, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={skill}
                    onChange={(e) => {
                      const newSkills = [...(data.skills || [])];
                      newSkills[index] = e.target.value;
                      updateData({ skills: newSkills });
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeArrayItem("skills", index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => addArrayItem("skills", "")}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Skill
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="languages">
          <AccordionTrigger>Languages</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-4">
              {Object.entries(data.languages || {}).map(
                ([language, level], index) => (
                  <div key={language} className="flex items-center gap-2">
                    <Input
                      placeholder="Language"
                      value={language}
                      onChange={(e) => {
                        const newLanguages = { ...data.languages } as Record<
                          string,
                          string
                        >;
                        delete newLanguages[language];
                        newLanguages[e.target.value] = level;
                        updateData({ languages: newLanguages });
                      }}
                    />
                    <Input
                      placeholder="Level"
                      value={level}
                      onChange={(e) => {
                        updateData({
                          languages: {
                            ...(data.languages || {}),
                            [language]: e.target.value,
                          },
                        });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newLanguages = { ...data.languages } as Record<
                          string,
                          string
                        >;
                        delete newLanguages[language];
                        updateData({ languages: newLanguages });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              )}
              <Button
                variant="outline"
                onClick={() => {
                  const newLanguages = { ...data.languages, "": "" };
                  updateData({ languages: newLanguages });
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Language
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="experience">
          <AccordionTrigger>Experience</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              {data.experience?.map((exp, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Company"
                        value={exp.company}
                        onChange={(e) => {
                          const newExp = [...(data.experience || [])];
                          newExp[index] = { ...exp, company: e.target.value };
                          updateData({ experience: newExp });
                        }}
                      />
                      <Input
                        placeholder="Position"
                        value={exp.position}
                        onChange={(e) => {
                          const newExp = [...(data.experience || [])];
                          newExp[index] = { ...exp, position: e.target.value };
                          updateData({ experience: newExp });
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Start Date"
                        value={exp.startDate}
                        onChange={(e) => {
                          const newExp = [...(data.experience || [])];
                          newExp[index] = { ...exp, startDate: e.target.value };
                          updateData({ experience: newExp });
                        }}
                      />
                      <Input
                        placeholder="End Date"
                        value={exp.endDate}
                        onChange={(e) => {
                          const newExp = [...(data.experience || [])];
                          newExp[index] = { ...exp, endDate: e.target.value };
                          updateData({ experience: newExp });
                        }}
                      />
                    </div>
                    <Textarea
                      placeholder="Summary"
                      value={exp.summary || ""}
                      onChange={(e) => {
                        const newExp = [...(data.experience || [])];
                        newExp[index] = { ...exp, summary: e.target.value };
                        updateData({ experience: newExp });
                      }}
                    />

                    <div className="space-y-2">
                      <h4 className="font-medium">Projects</h4>
                      {exp.projects?.map((project, pIndex) => (
                        <div
                          key={pIndex}
                          className="border-l-2 border-gray-200 pl-4 space-y-2"
                        >
                          <Input
                            placeholder="Project Name"
                            value={project.name}
                            onChange={(e) => {
                              const newExp = [...(data.experience || [])];
                              const newProjects = [...(exp.projects || [])];
                              newProjects[pIndex] = {
                                ...project,
                                name: e.target.value,
                              };
                              newExp[index] = { ...exp, projects: newProjects };
                              updateData({ experience: newExp });
                            }}
                          />
                          <Textarea
                            placeholder="Project Description"
                            value={project.description}
                            onChange={(e) => {
                              const newExp = [...(data.experience || [])];
                              const newProjects = [...(exp.projects || [])];
                              newProjects[pIndex] = {
                                ...project,
                                description: e.target.value,
                              };
                              newExp[index] = { ...exp, projects: newProjects };
                              updateData({ experience: newExp });
                            }}
                          />
                          <Input
                            placeholder="Technologies (comma-separated)"
                            value={project.technologies.join(", ")}
                            onChange={(e) => {
                              const newExp = [...(data.experience || [])];
                              const newProjects = [...(exp.projects || [])];
                              newProjects[pIndex] = {
                                ...project,
                                technologies: e.target.value
                                  .split(",")
                                  .map((t) => t.trim()),
                              };
                              newExp[index] = { ...exp, projects: newProjects };
                              updateData({ experience: newExp });
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newExp = [...(data.experience || [])];
                              const newProjects =
                                exp.projects?.filter((_, i) => i !== pIndex) ||
                                [];
                              newExp[index] = { ...exp, projects: newProjects };
                              updateData({ experience: newExp });
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Remove Project
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newExp = [...(data.experience || [])];
                          const newProjects = [
                            ...(exp.projects || []),
                            {
                              name: "",
                              description: "",
                              technologies: [],
                            },
                          ];
                          newExp[index] = { ...exp, projects: newProjects };
                          updateData({ experience: newExp });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Project
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="mt-4"
                    onClick={() => removeArrayItem("experience", index)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Remove Experience
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() =>
                  addArrayItem("experience", {
                    company: "",
                    position: "",
                    startDate: "",
                    endDate: "",
                    summary: "",
                    projects: [],
                  })
                }
              >
                <Plus className="h-4 w-4 mr-2" /> Add Experience
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="projects">
          <AccordionTrigger>Personal Projects</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              {data.projects?.map((project, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <Input
                    placeholder="Project Name"
                    value={project.name}
                    onChange={(e) => {
                      const newProjects = [...(data.projects || [])];
                      newProjects[index] = { ...project, name: e.target.value };
                      updateData({ projects: newProjects });
                    }}
                  />
                  <Textarea
                    placeholder="Project Description"
                    value={project.description}
                    onChange={(e) => {
                      const newProjects = [...(data.projects || [])];
                      newProjects[index] = {
                        ...project,
                        description: e.target.value,
                      };
                      updateData({ projects: newProjects });
                    }}
                  />
                  <Input
                    placeholder="Technologies (comma-separated)"
                    value={project.technologies.join(", ")}
                    onChange={(e) => {
                      const newProjects = [...(data.projects || [])];
                      newProjects[index] = {
                        ...project,
                        technologies: e.target.value
                          .split(",")
                          .map((t) => t.trim()),
                      };
                      updateData({ projects: newProjects });
                    }}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="GitHub URL"
                      value={project.github || ""}
                      onChange={(e) => {
                        const newProjects = [...(data.projects || [])];
                        newProjects[index] = {
                          ...project,
                          github: e.target.value,
                        };
                        updateData({ projects: newProjects });
                      }}
                    />
                    <Input
                      placeholder="Project URL"
                      value={project.url || ""}
                      onChange={(e) => {
                        const newProjects = [...(data.projects || [])];
                        newProjects[index] = {
                          ...project,
                          url: e.target.value,
                        };
                        updateData({ projects: newProjects });
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => removeArrayItem("projects", index)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Remove Project
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() =>
                  addArrayItem("projects", {
                    name: "",
                    description: "",
                    technologies: [],
                    github: "",
                    url: "",
                  })
                }
              >
                <Plus className="h-4 w-4 mr-2" /> Add Project
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
