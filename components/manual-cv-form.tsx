import React, { useState } from "react";
import { Education, Experience, Project } from "@/types/cv";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  FileText,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Languages,
  Sparkles,
  ExternalLink,
  Github,
  X,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCVStore } from "@/store/cv-store";
import {
  AddButton,
  BadgeItem,
  BadgeList,
  FieldGroup,
  ItemCard,
  LabeledField,
  SkillsInput,
  Technologies,
} from "./form/cv-form-components";

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

  const removeSkill = (index: number) => {
    const skills = [...(cvData.skills || [])];
    skills.splice(index, 1);
    updateCV({ skills });
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
            <SkillsInput
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onAdd={addSkill}
              placeholder="Add a skill..."
            />
            <BadgeList items={cvData.skills || []} onRemove={removeSkill} />
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
              <AddButton
                onClick={() => {
                  if (!languageName.trim() || !languageLevel.trim()) return;
                  const updatedLanguages = { ...(cvData.languages || {}) };
                  updatedLanguages[languageName] = languageLevel;
                  updateCV({ languages: updatedLanguages });
                  setLanguageName("");
                  setLanguageLevel("");
                }}
                text="Add"
              />
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
            <AddButton
              onClick={() => {
                updateCV({
                  education: [
                    ...(cvData.education || []),
                    { institution: "", degree: "", graduationDate: "" },
                  ],
                });
              }}
              text="Add Education"
              fullWidth
            />

            {cvData.education?.map((edu, index) => (
              <ItemCard
                key={index}
                title={edu.institution || "New Institution"}
                onRemove={() => {
                  const education = [...(cvData.education || [])];
                  education.splice(index, 1);
                  updateCV({ education });
                }}
              >
                <FieldGroup>
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
                </FieldGroup>
              </ItemCard>
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
            <AddButton
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
                      projects: [],
                    },
                  ],
                });
              }}
              text="Add Experience"
              fullWidth
            />

            {cvData.experience?.map((exp, expIndex) => (
              <ItemCard
                key={expIndex}
                title={`${exp.position || "New Position"}${
                  exp.company ? ` at ${exp.company}` : ""
                }`}
                onRemove={() => {
                  const experience = [...(cvData.experience || [])];
                  experience.splice(expIndex, 1);
                  updateCV({ experience });
                }}
              >
                <FieldGroup>
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
                </FieldGroup>

                {/* Projects */}
                <FieldGroup className="pt-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs">Projects</span>
                    <AddButton
                      onClick={() => {
                        const experience = [...(cvData.experience || [])];
                        experience[expIndex].projects = [
                          ...(experience[expIndex].projects || []),
                          { name: "", description: "", technologies: [] },
                        ];
                        updateCV({ experience });
                      }}
                      text="Add"
                    />
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
                          className="p-0.5 hover:bg-slate-100 rounded"
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

                      <Technologies
                        technologies={project.technologies || []}
                        onChange={(technologies) => {
                          const experience = [...(cvData.experience || [])];
                          experience[expIndex].projects![
                            projIndex
                          ].technologies = technologies;
                          updateCV({ experience });
                        }}
                      />
                    </div>
                  ))}
                </FieldGroup>
              </ItemCard>
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
            <AddButton
              onClick={() => {
                updateCV({
                  projects: [
                    ...(cvData.projects || []),
                    { name: "", description: "", technologies: [] },
                  ],
                });
              }}
              text="Add Project"
              fullWidth
            />

            {cvData.projects?.map((project, index) => (
              <ItemCard
                key={index}
                title={project.name || "New Project"}
                onRemove={() => {
                  const projects = [...(cvData.projects || [])];
                  projects.splice(index, 1);
                  updateCV({ projects });
                }}
              >
                <FieldGroup>
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

                  <Technologies
                    technologies={project.technologies || []}
                    onChange={(technologies) => {
                      const projects = [...(cvData.projects || [])];
                      projects[index].technologies = technologies;
                      updateCV({ projects });
                    }}
                  />
                </FieldGroup>
              </ItemCard>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
