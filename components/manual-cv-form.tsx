import React, { useState } from "react";
import { CVData, Education, Experience, Project } from "@/types/cv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  X,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Languages,
  Sparkles,
  ExternalLink,
  Github,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ManualCVFormProps {
  initialData?: CVData;
  onChange: (data: Partial<CVData>) => void;
}

export function ManualCVForm({ initialData, onChange }: ManualCVFormProps) {
  const [formData, setFormData] = useState<Partial<CVData>>(initialData || {});
  const [newSkill, setNewSkill] = useState("");
  const [languageName, setLanguageName] = useState("");
  const [languageLevel, setLanguageLevel] = useState("");

  const handleChange = (field: keyof CVData, value: any) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    onChange(updatedData);
  };

  // Handle skill addition
  const addSkill = () => {
    if (!newSkill.trim()) return;
    const updatedSkills = [...(formData.skills || []), newSkill];
    handleChange("skills", updatedSkills);
    setNewSkill("");
  };

  // Handle technology inputs (using prompt)
  const addTechnology = (
    projIndex: number,
    isExperienceProject: boolean = false,
    expIndex?: number
  ) => {
    if (isExperienceProject && expIndex !== undefined) {
      const updatedExperience = [...(formData.experience || [])];
      const tech = prompt("Enter technology:");
      if (tech && tech.trim()) {
        updatedExperience[expIndex].projects![projIndex].technologies.push(
          tech
        );
        handleChange("experience", updatedExperience);
      }
    } else {
      const updatedProjects = [...(formData.projects || [])];
      const tech = prompt("Enter technology:");
      if (tech && tech.trim()) {
        updatedProjects[projIndex].technologies.push(tech);
        handleChange("projects", updatedProjects);
      }
    }
  };

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {/* Personal Information */}
        <AccordionItem value="personal">
          <AccordionTrigger className="px-3 py-2 hover:bg-slate-50 group">
            <span className="flex items-center text-sm font-medium">
              <User className="h-4 w-4 mr-2 text-slate-500 group-hover:text-slate-700" />
              Personal Information
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3 pt-2 pb-4 border-t space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="First Name"
                value={formData.firstName || ""}
                onChange={(e) => handleChange("firstName", e.target.value)}
                className="h-9"
              />
              <Input
                placeholder="Last Name"
                value={formData.lastName || ""}
                onChange={(e) => handleChange("lastName", e.target.value)}
                className="h-9"
              />
            </div>
            <Input
              placeholder="Email"
              type="email"
              value={formData.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              className="h-9"
            />
            <Input
              placeholder="Phone Number"
              value={formData.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="h-9"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="GitHub Username"
                value={formData.github || ""}
                onChange={(e) => handleChange("github", e.target.value)}
                className="h-9"
              />
              <Input
                placeholder="LinkedIn Username"
                value={formData.linkedin || ""}
                onChange={(e) => handleChange("linkedin", e.target.value)}
                className="h-9"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* About */}
        <AccordionItem value="about">
          <AccordionTrigger className="px-3 py-2 hover:bg-slate-50 group">
            <span className="flex items-center text-sm font-medium">
              <FileText className="h-4 w-4 mr-2 text-slate-500 group-hover:text-slate-700" />
              About Me
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3 pt-2 pb-4 border-t">
            <Textarea
              value={formData.about || ""}
              onChange={(e) => handleChange("about", e.target.value)}
              placeholder="Write a brief summary about yourself..."
              rows={3}
              className="resize-none"
            />
          </AccordionContent>
        </AccordionItem>

        {/* Skills */}
        <AccordionItem value="skills">
          <AccordionTrigger className="px-3 py-2 hover:bg-slate-50 group">
            <span className="flex items-center text-sm font-medium">
              <Sparkles className="h-4 w-4 mr-2 text-slate-500 group-hover:text-slate-700" />
              Skills
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3 pt-2 pb-4 border-t space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill..."
                className="flex-1 h-9"
                onKeyPress={(e) => e.key === "Enter" && addSkill()}
              />
              <Button
                type="button"
                onClick={addSkill}
                size="sm"
                variant="outline"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {formData.skills?.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="py-0.5 pl-2 pr-1 flex items-center gap-1"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => {
                      const updatedSkills = [...(formData.skills || [])];
                      updatedSkills.splice(index, 1);
                      handleChange("skills", updatedSkills);
                    }}
                    className="rounded-full hover:bg-slate-200 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Languages */}
        <AccordionItem value="languages">
          <AccordionTrigger className="px-3 py-2 hover:bg-slate-50 group">
            <span className="flex items-center text-sm font-medium">
              <Languages className="h-4 w-4 mr-2 text-slate-500 group-hover:text-slate-700" />
              Languages
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3 pt-2 pb-4 border-t space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={languageName}
                onChange={(e) => setLanguageName(e.target.value)}
                placeholder="Language name"
                className="flex-1 h-9"
              />
              <Input
                value={languageLevel}
                onChange={(e) => setLanguageLevel(e.target.value)}
                placeholder="Proficiency level"
                className="flex-1 h-9"
              />
              <Button
                type="button"
                onClick={() => {
                  if (!languageName.trim() || !languageLevel.trim()) return;
                  const updatedLanguages = { ...(formData.languages || {}) };
                  updatedLanguages[languageName] = languageLevel;
                  handleChange("languages", updatedLanguages);
                  setLanguageName("");
                  setLanguageLevel("");
                }}
                size="sm"
                variant="outline"
              >
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {formData.languages &&
                Object.entries(formData.languages).map(([lang, level], i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="py-0.5 pl-2 pr-1 flex items-center gap-1"
                  >
                    {lang}: {level}
                    <button
                      type="button"
                      onClick={() => {
                        const updatedLanguages = {
                          ...(formData.languages || {}),
                        };
                        delete updatedLanguages[lang];
                        handleChange("languages", updatedLanguages);
                      }}
                      className="rounded-full hover:bg-slate-200 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Education */}
        <AccordionItem value="education">
          <AccordionTrigger className="px-3 py-2 hover:bg-slate-50 group">
            <span className="flex items-center text-sm font-medium">
              <GraduationCap className="h-4 w-4 mr-2 text-slate-500 group-hover:text-slate-700" />
              Education
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3 pt-2 pb-4 border-t space-y-3">
            <Button
              type="button"
              onClick={() => {
                const newEducation = {
                  institution: "",
                  degree: "",
                  graduationDate: "",
                };
                handleChange("education", [
                  ...(formData.education || []),
                  newEducation,
                ]);
              }}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Education
            </Button>

            {formData.education?.map((edu, index) => (
              <div key={index} className="pt-2 mt-2 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    {edu.institution ? edu.institution : "New Institution"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedEducation = [...(formData.education || [])];
                      updatedEducation.splice(index, 1);
                      handleChange("education", updatedEducation);
                    }}
                    className="rounded-full p-1 hover:bg-slate-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid gap-2">
                  <Input
                    value={edu.institution}
                    onChange={(e) => {
                      const updatedEducation = [...(formData.education || [])];
                      updatedEducation[index].institution = e.target.value;
                      handleChange("education", updatedEducation);
                    }}
                    placeholder="Institution"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={edu.degree}
                    onChange={(e) => {
                      const updatedEducation = [...(formData.education || [])];
                      updatedEducation[index].degree = e.target.value;
                      handleChange("education", updatedEducation);
                    }}
                    placeholder="Degree"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={edu.graduationDate}
                    onChange={(e) => {
                      const updatedEducation = [...(formData.education || [])];
                      updatedEducation[index].graduationDate = e.target.value;
                      handleChange("education", updatedEducation);
                    }}
                    placeholder="Graduation Date"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Experience */}
        <AccordionItem value="experience">
          <AccordionTrigger className="px-3 py-2 hover:bg-slate-50 group">
            <span className="flex items-center text-sm font-medium">
              <Briefcase className="h-4 w-4 mr-2 text-slate-500 group-hover:text-slate-700" />
              Professional Experience
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3 pt-2 pb-4 border-t space-y-3">
            <Button
              type="button"
              onClick={() => {
                const newExperience = {
                  company: "",
                  position: "",
                  startDate: "",
                  endDate: "",
                  summary: "",
                };
                handleChange("experience", [
                  ...(formData.experience || []),
                  newExperience,
                ]);
              }}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Experience
            </Button>

            {formData.experience?.map((exp, expIndex) => (
              <div key={expIndex} className="pt-3 mt-2 border-t">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">
                    {exp.position ? exp.position : "New Position"}
                    {exp.company ? ` at ${exp.company}` : ""}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedExperience = [
                        ...(formData.experience || []),
                      ];
                      updatedExperience.splice(expIndex, 1);
                      handleChange("experience", updatedExperience);
                    }}
                    className="rounded-full p-1 hover:bg-slate-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid gap-2">
                  <Input
                    value={exp.company}
                    onChange={(e) => {
                      const updatedExperience = [
                        ...(formData.experience || []),
                      ];
                      updatedExperience[expIndex].company = e.target.value;
                      handleChange("experience", updatedExperience);
                    }}
                    placeholder="Company"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={exp.position}
                    onChange={(e) => {
                      const updatedExperience = [
                        ...(formData.experience || []),
                      ];
                      updatedExperience[expIndex].position = e.target.value;
                      handleChange("experience", updatedExperience);
                    }}
                    placeholder="Position"
                    className="h-8 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={exp.startDate}
                      onChange={(e) => {
                        const updatedExperience = [
                          ...(formData.experience || []),
                        ];
                        updatedExperience[expIndex].startDate = e.target.value;
                        handleChange("experience", updatedExperience);
                      }}
                      placeholder="Start Date"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={exp.endDate}
                      onChange={(e) => {
                        const updatedExperience = [
                          ...(formData.experience || []),
                        ];
                        updatedExperience[expIndex].endDate = e.target.value;
                        handleChange("experience", updatedExperience);
                      }}
                      placeholder="End Date"
                      className="h-8 text-sm"
                    />
                  </div>
                  <Textarea
                    value={exp.summary || ""}
                    onChange={(e) => {
                      const updatedExperience = [
                        ...(formData.experience || []),
                      ];
                      updatedExperience[expIndex].summary = e.target.value;
                      handleChange("experience", updatedExperience);
                    }}
                    placeholder="Summary of your role"
                    className="text-sm resize-none"
                    rows={2}
                  />
                </div>

                {/* Project section */}
                <div className="pt-2 mt-2 border-t border-dashed">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-600">Projects</span>
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        const updatedExperience = [
                          ...(formData.experience || []),
                        ];
                        const newProject = {
                          name: "",
                          description: "",
                          technologies: [],
                        };
                        updatedExperience[expIndex].projects = [
                          ...(updatedExperience[expIndex].projects || []),
                          newProject,
                        ];
                        handleChange("experience", updatedExperience);
                      }}
                      className="h-6 text-xs px-2"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>

                  {exp.projects?.map((project, projIndex) => (
                    <div
                      key={projIndex}
                      className="mb-3 pl-2 pb-2 border-l-2 border-slate-100"
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-medium">
                          {project.name || "New Project"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedExperience = [
                              ...(formData.experience || []),
                            ];
                            updatedExperience[expIndex].projects!.splice(
                              projIndex,
                              1
                            );
                            handleChange("experience", updatedExperience);
                          }}
                          className="rounded-full hover:bg-slate-100 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <Input
                        value={project.name}
                        onChange={(e) => {
                          const updatedExperience = [
                            ...(formData.experience || []),
                          ];
                          updatedExperience[expIndex].projects![
                            projIndex
                          ].name = e.target.value;
                          handleChange("experience", updatedExperience);
                        }}
                        placeholder="Project Name"
                        className="h-7 text-xs mb-1"
                      />
                      <Textarea
                        value={project.description}
                        onChange={(e) => {
                          const updatedExperience = [
                            ...(formData.experience || []),
                          ];
                          updatedExperience[expIndex].projects![
                            projIndex
                          ].description = e.target.value;
                          handleChange("experience", updatedExperience);
                        }}
                        placeholder="Description"
                        className="text-xs mb-1 resize-none h-12"
                        rows={1}
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-600">
                          Technologies
                        </span>
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          onClick={() =>
                            addTechnology(projIndex, true, expIndex)
                          }
                          className="h-5 text-xs px-2"
                        >
                          <Plus className="h-2.5 w-2.5 mr-1" /> Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {project.technologies?.map((tech, techIndex) => (
                          <Badge
                            key={techIndex}
                            variant="outline"
                            className="py-0 px-1 text-xs"
                          >
                            {tech}
                            <button
                              type="button"
                              onClick={() => {
                                const updatedExperience = [
                                  ...(formData.experience || []),
                                ];
                                updatedExperience[expIndex].projects![
                                  projIndex
                                ].technologies.splice(techIndex, 1);
                                handleChange("experience", updatedExperience);
                              }}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="h-2 w-2" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Projects */}
        <AccordionItem value="projects">
          <AccordionTrigger className="px-3 py-2 hover:bg-slate-50 group">
            <span className="flex items-center text-sm font-medium">
              <FolderGit2 className="h-4 w-4 mr-2 text-slate-500 group-hover:text-slate-700" />
              Projects
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3 pt-2 pb-4 border-t space-y-3">
            <Button
              type="button"
              onClick={() => {
                const newProject = {
                  name: "",
                  description: "",
                  technologies: [],
                };
                handleChange("projects", [
                  ...(formData.projects || []),
                  newProject,
                ]);
              }}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Project
            </Button>

            {formData.projects?.map((project, index) => (
              <div key={index} className="pt-3 mt-2 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    {project.name || "New Project"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedProjects = [...(formData.projects || [])];
                      updatedProjects.splice(index, 1);
                      handleChange("projects", updatedProjects);
                    }}
                    className="rounded-full p-1 hover:bg-slate-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid gap-2">
                  <Input
                    value={project.name}
                    onChange={(e) => {
                      const updatedProjects = [...(formData.projects || [])];
                      updatedProjects[index].name = e.target.value;
                      handleChange("projects", updatedProjects);
                    }}
                    placeholder="Project Name"
                    className="h-8 text-sm"
                  />
                  <Textarea
                    value={project.description}
                    onChange={(e) => {
                      const updatedProjects = [...(formData.projects || [])];
                      updatedProjects[index].description = e.target.value;
                      handleChange("projects", updatedProjects);
                    }}
                    placeholder="Description"
                    className="text-sm resize-none"
                    rows={2}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Input
                        value={project.github || ""}
                        onChange={(e) => {
                          const updatedProjects = [
                            ...(formData.projects || []),
                          ];
                          updatedProjects[index].github = e.target.value;
                          handleChange("projects", updatedProjects);
                        }}
                        placeholder="GitHub URL"
                        className="h-8 text-sm pl-7"
                      />
                      <Github className="absolute left-2 top-2 h-4 w-4 text-slate-400" />
                    </div>
                    <div className="relative">
                      <Input
                        value={project.url || ""}
                        onChange={(e) => {
                          const updatedProjects = [
                            ...(formData.projects || []),
                          ];
                          updatedProjects[index].url = e.target.value;
                          handleChange("projects", updatedProjects);
                        }}
                        placeholder="Live URL"
                        className="h-8 text-sm pl-7"
                      />
                      <ExternalLink className="absolute left-2 top-2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-600">
                        Technologies
                      </span>
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => addTechnology(index)}
                        className="h-6 text-xs px-2"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {project.technologies?.map((tech, techIndex) => (
                        <Badge
                          key={techIndex}
                          variant="outline"
                          className="py-0 px-1 text-xs"
                        >
                          {tech}
                          <button
                            type="button"
                            onClick={() => {
                              const updatedProjects = [
                                ...(formData.projects || []),
                              ];
                              updatedProjects[index].technologies.splice(
                                techIndex,
                                1
                              );
                              handleChange("projects", updatedProjects);
                            }}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-2 w-2" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
