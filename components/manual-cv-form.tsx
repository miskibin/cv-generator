import React, { useState } from "react";
import { Education, Experience, Project } from "@/types/cv";
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
import { useCVStore } from "@/store/cv-store";

interface BadgeItemProps {
  text: string;
  onRemove: () => void;
  small?: boolean;
}

// Reusable badge component for technologies and skills
const BadgeItem = ({ text, onRemove, small = false }: BadgeItemProps) => (
  <Badge
    variant={small ? "outline" : "secondary"}
    className={`flex items-center gap-1 ${
      small ? "py-0 px-1 text-xs" : "py-0.5 pl-2 pr-1"
    }`}
  >
    {text}
    <button
      type="button"
      onClick={onRemove}
      className={
        small
          ? "ml-1 hover:text-red-500"
          : "rounded-full hover:bg-slate-200 p-0.5"
      }
    >
      <X className={small ? "h-2 w-2" : "h-3 w-3"} />
    </button>
  </Badge>
);

export function ManualCVForm() {
  const { cvData, updateCV } = useCVStore();
  const [newSkill, setNewSkill] = useState("");
  const [languageName, setLanguageName] = useState("");
  const [languageLevel, setLanguageLevel] = useState("");

  const addSkill = () => {
    if (!newSkill.trim()) return;
    updateCV({ skills: [...(cvData.skills || []), newSkill] });
    setNewSkill("");
  };

  const addTechnology = (
    projIndex: number,
    isExperienceProject: boolean = false,
    expIndex?: number
  ) => {
    const tech = prompt("Enter technology:");
    if (!tech?.trim()) return;

    if (isExperienceProject && expIndex !== undefined) {
      const updatedExperience = [...(cvData.experience || [])];
      updatedExperience[expIndex].projects![projIndex].technologies.push(tech);
      updateCV({ experience: updatedExperience });
    } else {
      const updatedProjects = [...(cvData.projects || [])];
      updatedProjects[projIndex].technologies.push(tech);
      updateCV({ projects: updatedProjects });
    }
  };

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {/* Personal Information */}
        <AccordionItem value="personal">
          <AccordionTrigger className="px-3 py-2 hover:bg-slate-50 group">
            <span className="flex items-center text-sm">
              <User className="h-4 w-4 mr-2 text-slate-500" />
              Personal Information
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3 py-2 border-t space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="First Name"
                value={cvData.firstName || ""}
                onChange={(e) => updateCV({ firstName: e.target.value })}
                className="h-9"
              />
              <Input
                placeholder="Last Name"
                value={cvData.lastName || ""}
                onChange={(e) => updateCV({ lastName: e.target.value })}
                className="h-9"
              />
            </div>
            <Input
              placeholder="Email"
              type="email"
              value={cvData.email || ""}
              onChange={(e) => updateCV({ email: e.target.value })}
            />
            <Input
              placeholder="Phone Number"
              value={cvData.phone || ""}
              onChange={(e) => updateCV({ phone: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="GitHub Username"
                value={cvData.github || ""}
                onChange={(e) => updateCV({ github: e.target.value })}
              />
              <Input
                placeholder="LinkedIn Username"
                value={cvData.linkedin || ""}
                onChange={(e) => updateCV({ linkedin: e.target.value })}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* About */}
        <AccordionItem value="about">
          <AccordionTrigger className="px-3 py-2 hover:bg-slate-50 group">
            <span className="flex items-center text-sm">
              <FileText className="h-4 w-4 mr-2 text-slate-500" />
              About Me
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3 py-2 border-t">
            <Textarea
              value={cvData.about || ""}
              onChange={(e) => updateCV({ about: e.target.value })}
              placeholder="Write about yourself..."
              rows={3}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Skills */}
        <AccordionItem value="skills">
          <AccordionTrigger className="px-3 py-2 hover:bg-slate-50 group">
            <span className="flex items-center text-sm">
              <Sparkles className="h-4 w-4 mr-2 text-slate-500" />
              Skills
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3 py-2 border-t space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill..."
                onKeyPress={(e) => e.key === "Enter" && addSkill()}
                className="flex-1"
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
              {cvData.skills?.map((skill, index) => (
                <BadgeItem
                  key={index}
                  text={skill}
                  onRemove={() => {
                    const skills = [...(cvData.skills || [])];
                    skills.splice(index, 1);
                    updateCV({ skills });
                  }}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Languages */}
        <AccordionItem value="languages">
          <AccordionTrigger className="px-3 py-2 hover:bg-slate-50 group">
            <span className="flex items-center text-sm">
              <Languages className="h-4 w-4 mr-2 text-slate-500" />
              Languages
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3 py-2 border-t space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={languageName}
                onChange={(e) => setLanguageName(e.target.value)}
                placeholder="Language name"
                className="flex-1"
              />
              <Input
                value={languageLevel}
                onChange={(e) => setLanguageLevel(e.target.value)}
                placeholder="Proficiency level"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() => {
                  if (!languageName.trim() || !languageLevel.trim()) return;
                  const updatedLanguages = { ...(cvData.languages || {}) };
                  updatedLanguages[languageName] = languageLevel;
                  updateCV({ languages: updatedLanguages });
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
              {cvData.languages &&
                Object.entries(cvData.languages).map(([lang, level], i) => (
                  <BadgeItem
                    key={i}
                    text={`${lang}: ${level}`}
                    onRemove={() => {
                      const updatedLanguages = { ...(cvData.languages || {}) };
                      delete updatedLanguages[lang];
                      updateCV({ languages: updatedLanguages });
                    }}
                  />
                ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Education */}
        <AccordionItem value="education">
          <AccordionTrigger className="px-3 py-2 hover:bg-slate-50 group">
            <span className="flex items-center text-sm">
              <GraduationCap className="h-4 w-4 mr-2 text-slate-500" />
              Education
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3 py-2 border-t space-y-3">
            <Button
              type="button"
              onClick={() => {
                updateCV({
                  education: [
                    ...(cvData.education || []),
                    { institution: "", degree: "", graduationDate: "" },
                  ],
                });
              }}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Education
            </Button>

            {cvData.education?.map((edu, index) => (
              <div key={index} className="pt-2 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">
                    {edu.institution || "New Institution"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const education = [...(cvData.education || [])];
                      education.splice(index, 1);
                      updateCV({ education });
                    }}
                    className="p-1 hover:bg-slate-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid gap-2">
                  <Input
                    value={edu.institution}
                    onChange={(e) => {
                      const education = [...(cvData.education || [])];
                      education[index].institution = e.target.value;
                      updateCV({ education });
                    }}
                    placeholder="Institution"
                  />
                  <Input
                    value={edu.degree}
                    onChange={(e) => {
                      const education = [...(cvData.education || [])];
                      education[index].degree = e.target.value;
                      updateCV({ education });
                    }}
                    placeholder="Degree"
                  />
                  <Input
                    value={edu.graduationDate}
                    onChange={(e) => {
                      const education = [...(cvData.education || [])];
                      education[index].graduationDate = e.target.value;
                      updateCV({ education });
                    }}
                    placeholder="Graduation Date"
                  />
                </div>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* Experience */}
        <AccordionItem value="experience">
          <AccordionTrigger className="px-3 py-2 hover:bg-slate-50 group">
            <span className="flex items-center text-sm">
              <Briefcase className="h-4 w-4 mr-2 text-slate-500" />
              Experience
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3 py-2 border-t space-y-3">
            <Button
              type="button"
              onClick={() => {
                updateCV({
                  experience: [
                    ...(cvData.experience || []),
                    {
                      company: "",
                      position: "",
                      startDate: "",
                      endDate: "",
                      summary: "",
                    },
                  ],
                });
              }}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Experience
            </Button>

            {cvData.experience?.map((exp, expIndex) => (
              <div key={expIndex} className="pt-2 border-t">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm">
                    {exp.position ? exp.position : "New Position"}
                    {exp.company ? ` at ${exp.company}` : ""}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const experience = [...(cvData.experience || [])];
                      experience.splice(expIndex, 1);
                      updateCV({ experience });
                    }}
                    className="p-1 hover:bg-slate-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid gap-2">
                  <Input
                    value={exp.company}
                    onChange={(e) => {
                      const experience = [...(cvData.experience || [])];
                      experience[expIndex].company = e.target.value;
                      updateCV({ experience });
                    }}
                    placeholder="Company"
                  />
                  <Input
                    value={exp.position}
                    onChange={(e) => {
                      const experience = [...(cvData.experience || [])];
                      experience[expIndex].position = e.target.value;
                      updateCV({ experience });
                    }}
                    placeholder="Position"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={exp.startDate}
                      onChange={(e) => {
                        const experience = [...(cvData.experience || [])];
                        experience[expIndex].startDate = e.target.value;
                        updateCV({ experience });
                      }}
                      placeholder="Start Date"
                    />
                    <Input
                      value={exp.endDate}
                      onChange={(e) => {
                        const experience = [...(cvData.experience || [])];
                        experience[expIndex].endDate = e.target.value;
                        updateCV({ experience });
                      }}
                      placeholder="End Date"
                    />
                  </div>
                  <Textarea
                    value={exp.summary || ""}
                    onChange={(e) => {
                      const experience = [...(cvData.experience || [])];
                      experience[expIndex].summary = e.target.value;
                      updateCV({ experience });
                    }}
                    placeholder="Summary"
                    rows={2}
                  />
                </div>

                {/* Projects */}
                <div className="pt-2 mt-2 border-t border-dashed">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs">Projects</span>
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        const experience = [...(cvData.experience || [])];
                        experience[expIndex].projects = [
                          ...(experience[expIndex].projects || []),
                          { name: "", description: "", technologies: [] },
                        ];
                        updateCV({ experience });
                      }}
                      className="h-6 text-xs px-2"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>

                  {exp.projects?.map((project, projIndex) => (
                    <div
                      key={projIndex}
                      className="mb-3 pl-2 border-l-2 border-slate-100"
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs">
                          {project.name || "New Project"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const experience = [...(cvData.experience || [])];
                            experience[expIndex].projects!.splice(projIndex, 1);
                            updateCV({ experience });
                          }}
                          className="p-0.5 hover:bg-slate-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <Input
                        value={project.name}
                        onChange={(e) => {
                          const experience = [...(cvData.experience || [])];
                          experience[expIndex].projects![projIndex].name =
                            e.target.value;
                          updateCV({ experience });
                        }}
                        placeholder="Project Name"
                        className="h-7 text-xs mb-1"
                      />
                      <Textarea
                        value={project.description}
                        onChange={(e) => {
                          const experience = [...(cvData.experience || [])];
                          experience[expIndex].projects![
                            projIndex
                          ].description = e.target.value;
                          updateCV({ experience });
                        }}
                        placeholder="Description"
                        className="text-xs mb-1 h-12"
                        rows={1}
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Technologies</span>
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
                          <BadgeItem
                            key={techIndex}
                            text={tech}
                            small={true}
                            onRemove={() => {
                              const experience = [...(cvData.experience || [])];
                              experience[expIndex].projects![
                                projIndex
                              ].technologies.splice(techIndex, 1);
                              updateCV({ experience });
                            }}
                          />
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
            <span className="flex items-center text-sm">
              <FolderGit2 className="h-4 w-4 mr-2 text-slate-500" />
              Projects
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-3 py-2 border-t space-y-3">
            <Button
              type="button"
              onClick={() => {
                updateCV({
                  projects: [
                    ...(cvData.projects || []),
                    { name: "", description: "", technologies: [] },
                  ],
                });
              }}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Project
            </Button>

            {cvData.projects?.map((project, index) => (
              <div key={index} className="pt-2 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">
                    {project.name || "New Project"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const projects = [...(cvData.projects || [])];
                      projects.splice(index, 1);
                      updateCV({ projects });
                    }}
                    className="p-1 hover:bg-slate-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid gap-2">
                  <Input
                    value={project.name}
                    onChange={(e) => {
                      const projects = [...(cvData.projects || [])];
                      projects[index].name = e.target.value;
                      updateCV({ projects });
                    }}
                    placeholder="Project Name"
                  />
                  <Textarea
                    value={project.description}
                    onChange={(e) => {
                      const projects = [...(cvData.projects || [])];
                      projects[index].description = e.target.value;
                      updateCV({ projects });
                    }}
                    placeholder="Description"
                    rows={2}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Input
                        value={project.github || ""}
                        onChange={(e) => {
                          const projects = [...(cvData.projects || [])];
                          projects[index].github = e.target.value;
                          updateCV({ projects });
                        }}
                        placeholder="GitHub URL"
                        className="pl-7"
                      />
                      <Github className="absolute left-2 top-2 h-4 w-4 text-slate-400" />
                    </div>
                    <div className="relative">
                      <Input
                        value={project.url || ""}
                        onChange={(e) => {
                          const projects = [...(cvData.projects || [])];
                          projects[index].url = e.target.value;
                          updateCV({ projects });
                        }}
                        placeholder="Live URL"
                        className="pl-7"
                      />
                      <ExternalLink className="absolute left-2 top-2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs">Technologies</span>
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
                        <BadgeItem
                          key={techIndex}
                          text={tech}
                          small={true}
                          onRemove={() => {
                            const projects = [...(cvData.projects || [])];
                            projects[index].technologies.splice(techIndex, 1);
                            updateCV({ projects });
                          }}
                        />
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
