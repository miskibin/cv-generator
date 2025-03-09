"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCVStore } from "@/store/cv-store";
import { GitHubProjectsFetcher } from "./github-projects-fetcher";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label";
import {
  FormSection,
  AddButton,
  ItemCard,
  SkillsInput,
  BadgeList,
  LabeledField,
  FieldGroup,
  Technologies,
} from "./form/cv-form-components";
import { Trash2, Github, ExternalLink } from "lucide-react";

export function UserProfileForm() {
  const { cvData, updateCV } = useCVStore();
  const [newLanguageName, setNewLanguageName] = useState("");
  const [newLanguageLevel, setNewLanguageLevel] = useState("");
  const [newSkill, setNewSkill] = useState("");

  const addLanguage = () => {
    if (!newLanguageName.trim() || !newLanguageLevel.trim()) return;

    const updatedLanguages = { ...(cvData.languages || {}) };
    updatedLanguages[newLanguageName] = newLanguageLevel;
    updateCV({ languages: updatedLanguages });
    setNewLanguageName("");
    setNewLanguageLevel("");
  };

  const removeLanguage = (languageName: string) => {
    const updatedLanguages = { ...(cvData.languages || {}) };
    delete updatedLanguages[languageName];
    updateCV({ languages: updatedLanguages });
  };

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

  const addEducation = () => {
    updateCV({
      education: [
        ...(cvData.education || []),
        { institution: "", degree: "", startDate: "", graduationDate: "" },
      ],
    });
  };

  const removeEducation = (index: number) => {
    const education = [...(cvData.education || [])];
    education.splice(index, 1);
    updateCV({ education });
  };

  const addExperience = () => {
    updateCV({
      experience: [
        ...(cvData.experience || []),
        {
          company: "",
          position: "",
          startDate: "",
          endDate: "",
          summary: "",
          projects: [], // Ensure projects array is always initialized
        },
      ],
    });
  };

  const removeExperience = (index: number) => {
    const experience = [...(cvData.experience || [])];
    experience.splice(index, 1);
    updateCV({ experience });
  };

  const addProjectToExperience = (experienceIndex: number) => {
    const experience = JSON.parse(JSON.stringify(cvData.experience || []));
    if (!experience[experienceIndex].projects) {
      experience[experienceIndex].projects = [];
    }
    experience[experienceIndex].projects.push({
      name: "",
      description: "",
      technologies: [],
    });
    // Use the modified updateCV function to ensure deep persistence
    updateCV({ experience });
  };

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="pr-4 pb-2 space-y-6">
        {/* Contact Information */}
        <FormSection title="Contact Information">
          <div className="grid grid-cols-2 gap-4">
            <LabeledField label="First Name*">
              <Input
                value={cvData.firstName || ""}
                onChange={(e) => updateCV({ firstName: e.target.value })}
                placeholder="John"
              />
            </LabeledField>
            <LabeledField label="Last Name*">
              <Input
                value={cvData.lastName || ""}
                onChange={(e) => updateCV({ lastName: e.target.value })}
                placeholder="Doe"
              />
            </LabeledField>
          </div>

          <LabeledField label="Email Address*">
            <Input
              type="email"
              value={cvData.email || ""}
              onChange={(e) => updateCV({ email: e.target.value })}
              placeholder="john.doe@example.com"
            />
          </LabeledField>

          <div className="grid grid-cols-2 gap-4">
            <LabeledField label="Phone Number">
              <Input
                value={cvData.phone || ""}
                onChange={(e) => updateCV({ phone: e.target.value })}
                placeholder="+1 (123) 456-7890"
              />
            </LabeledField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <LabeledField label="LinkedIn">
              <Input
                value={cvData.linkedin || ""}
                onChange={(e) => updateCV({ linkedin: e.target.value })}
                placeholder="linkedin.com/in/johndoe"
              />
            </LabeledField>
            <LabeledField label="GitHub">
              <Input
                value={cvData.github || ""}
                onChange={(e) => updateCV({ github: e.target.value })}
                placeholder="github.com/johndoe"
              />
            </LabeledField>
          </div>
        </FormSection>

        {/* Professional Summary */}
        <FormSection title="Professional Summary">
          <Textarea
            placeholder="Describe your professional background, key skills, major achievements, and career objectives..."
            value={cvData.about || ""}
            onChange={(e) => updateCV({ about: e.target.value })}
            className="min-h-40"
          />
        </FormSection>

        {/* Skills */}
        <FormSection title="Skills">
          <SkillsInput
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onAdd={addSkill}
          />

          <BadgeList items={cvData.skills || []} onRemove={removeSkill} />
        </FormSection>

        {/* Languages */}
        <FormSection
          title="Languages"
          action={<AddButton onClick={addLanguage} text="Add" />}
        >
          <div className="flex items-center gap-2">
            <Input
              placeholder="Language name"
              value={newLanguageName}
              onChange={(e) => setNewLanguageName(e.target.value)}
              className="flex-1"
            />
            <Select
              value={newLanguageLevel}
              onValueChange={setNewLanguageLevel}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Native">Native</SelectItem>
                <SelectItem value="Fluent">Fluent</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Basic">Basic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {cvData.languages && Object.keys(cvData.languages).length > 0 && (
            <div className="space-y-2">
              {Object.entries(cvData.languages).map(([lang, level]) => (
                <div
                  key={lang}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded"
                >
                  <div>
                    <span className="font-medium">{lang}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({level})
                    </span>
                  </div>
                  <button
                    className="p-1 hover:bg-slate-100 rounded"
                    onClick={() => removeLanguage(lang)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </FormSection>

        {/* Education */}
        <FormSection
          title="Education"
          action={<AddButton onClick={addEducation} text="Add" />}
        >
          {(!cvData.education || cvData.education.length === 0) && (
            <div className="text-center py-4 text-gray-500">
              No education entries added yet
            </div>
          )}

          {cvData.education?.map((edu, index) => (
            <ItemCard
              key={index}
              title={edu.institution || "New Institution"}
              onRemove={() => removeEducation(index)}
            >
              <LabeledField label="Institution">
                <Input
                  value={edu.institution || ""}
                  onChange={(e) => {
                    const education = [...(cvData.education || [])];
                    education[index].institution = e.target.value;
                    updateCV({ education });
                  }}
                  placeholder="University name"
                />
              </LabeledField>

              <LabeledField label="Degree">
                <Input
                  value={edu.degree || ""}
                  onChange={(e) => {
                    const education = [...(cvData.education || [])];
                    education[index].degree = e.target.value;
                    updateCV({ education });
                  }}
                  placeholder="Degree name"
                />
              </LabeledField>

              <div className="grid grid-cols-2 gap-2">
                <LabeledField label="Start Date">
                  <Input
                    value={edu.startDate || ""}
                    onChange={(e) => {
                      const education = [...(cvData.education || [])];
                      education[index].startDate = e.target.value;
                      updateCV({ education });
                    }}
                    placeholder="e.g. September 2018"
                  />
                </LabeledField>
                <LabeledField label="End Date">
                  <Input
                    value={edu.graduationDate || ""}
                    onChange={(e) => {
                      const education = [...(cvData.education || [])];
                      education[index].graduationDate = e.target.value;
                      updateCV({ education });
                    }}
                    placeholder="e.g. June 2022 or Present"
                  />
                </LabeledField>
              </div>
            </ItemCard>
          ))}
        </FormSection>

        {/* Experience */}
        <FormSection
          title="Work Experience"
          action={<AddButton onClick={addExperience} text="Add" />}
        >
          {(!cvData.experience || cvData.experience.length === 0) && (
            <div className="text-center py-4 text-gray-500">
              No experience entries added yet
            </div>
          )}

          {cvData.experience?.map((exp, index) => (
            <ItemCard
              key={index}
              title={`${exp.position || "New Position"}${
                exp.company ? ` at ${exp.company}` : ""
              }`}
              onRemove={() => removeExperience(index)}
            >
              <LabeledField label="Company">
                <Input
                  value={exp.company || ""}
                  onChange={(e) => {
                    const experience = [...(cvData.experience || [])];
                    experience[index].company = e.target.value;
                    updateCV({ experience });
                  }}
                  placeholder="Company name"
                />
              </LabeledField>

              <LabeledField label="Position">
                <Input
                  value={exp.position || ""}
                  onChange={(e) => {
                    const experience = [...(cvData.experience || [])];
                    experience[index].position = e.target.value;
                    updateCV({ experience });
                  }}
                  placeholder="Job title"
                />
              </LabeledField>

              <div className="grid grid-cols-2 gap-2">
                <LabeledField label="Start Date">
                  <Input
                    value={exp.startDate || ""}
                    onChange={(e) => {
                      const experience = [...(cvData.experience || [])];
                      experience[index].startDate = e.target.value;
                      updateCV({ experience });
                    }}
                    placeholder="e.g. January 2020"
                  />
                </LabeledField>
                <LabeledField label="End Date">
                  <Input
                    value={exp.endDate || ""}
                    onChange={(e) => {
                      const experience = [...(cvData.experience || [])];
                      experience[index].endDate = e.target.value;
                      updateCV({ experience });
                    }}
                    placeholder="e.g. Present"
                  />
                </LabeledField>
              </div>

              <LabeledField label="Summary">
                <Textarea
                  value={exp.summary || ""}
                  onChange={(e) => {
                    const experience = [...(cvData.experience || [])];
                    experience[index].summary = e.target.value;
                    updateCV({ experience });
                  }}
                  placeholder="Describe your role and achievements..."
                  className="min-h-20"
                />
              </LabeledField>

              {/* Projects */}
              <FieldGroup className="pt-2">
                <div className="flex items-center justify-between">
                  <Label>Projects</Label>
                  <AddButton
                    onClick={() => addProjectToExperience(index)}
                    text="Add Project"
                  />
                </div>

                {/* List of projects */}
                {exp.projects && exp.projects.length > 0 ? (
                  <div className="space-y-3 pl-4 border-l-2 border-slate-200">
                    {exp.projects.map((project, projIndex) => (
                      <div
                        key={projIndex}
                        className="p-2 bg-slate-50 rounded space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <div className="font-medium">
                            {project.name || "New Project"}
                          </div>
                          <button
                            className="p-1 hover:bg-slate-100 rounded"
                            onClick={() => {
                              const experience = [...(cvData.experience || [])];
                              experience[index].projects?.splice(projIndex, 1);
                              updateCV({ experience });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <Input
                          value={project.name || ""}
                          onChange={(e) => {
                            const experience = [...(cvData.experience || [])];
                            if (experience[index].projects) {
                              experience[index].projects[projIndex].name =
                                e.target.value;
                            }
                            updateCV({ experience });
                          }}
                          placeholder="Project name"
                        />

                        <Textarea
                          value={project.description || ""}
                          onChange={(e) => {
                            const experience = [...(cvData.experience || [])];
                            if (experience[index].projects) {
                              experience[index].projects[
                                projIndex
                              ].description = e.target.value;
                            }
                            updateCV({ experience });
                          }}
                          placeholder="Project description"
                          className="min-h-12"
                        />

                        <Technologies
                          technologies={project.technologies || []}
                          onChange={(technologies) => {
                            const experience = [...(cvData.experience || [])];
                            if (experience[index].projects) {
                              experience[index].projects[
                                projIndex
                              ].technologies = technologies;
                            }
                            updateCV({ experience });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-sm text-gray-500 border border-dashed p-2 rounded">
                    No projects added yet
                  </div>
                )}
              </FieldGroup>
            </ItemCard>
          ))}
        </FormSection>

        {/* GitHub Projects */}
        <FormSection
          title="GitHub Projects"
          action={
            <AddButton
              onClick={() => {
                updateCV({
                  projects: [
                    ...(cvData.projects || []),
                    {
                      name: "",
                      description: "",
                      technologies: [],
                      url: "",
                      github: "",
                    },
                  ],
                });
              }}
              text="Add Project"
            />
          }
        >
          <GitHubProjectsFetcher />

          {/* Display and edit projects */}
          {cvData.projects && cvData.projects.length > 0 && (
            <div className="mt-4 space-y-3">
              {cvData.projects.map((project, index) => (
                <ItemCard
                  key={index}
                  title={project.name || "New Project"}
                  onRemove={() => {
                    const projects = [...(cvData.projects || [])];
                    projects.splice(index, 1);
                    updateCV({ projects });
                  }}
                >
                  <LabeledField label="Project Name">
                    <Input
                      value={project.name || ""}
                      onChange={(e) => {
                        const projects = JSON.parse(
                          JSON.stringify(cvData.projects || [])
                        );
                        projects[index].name = e.target.value;
                        updateCV({ projects });
                      }}
                      placeholder="Project name"
                    />
                  </LabeledField>

                  <LabeledField label="Description">
                    <Textarea
                      value={project.description || ""}
                      onChange={(e) => {
                        const projects = JSON.parse(
                          JSON.stringify(cvData.projects || [])
                        );
                        projects[index].description = e.target.value;
                        updateCV({ projects });
                      }}
                      placeholder="Project description"
                      className="min-h-20"
                    />
                  </LabeledField>

                  <div className="grid grid-cols-2 gap-2">
                    <LabeledField label="GitHub URL">
                      <div className="relative">
                        <Input
                          value={project.github || ""}
                          onChange={(e) => {
                            const projects = JSON.parse(
                              JSON.stringify(cvData.projects || [])
                            );
                            projects[index].github = e.target.value;
                            updateCV({ projects });
                          }}
                          placeholder="GitHub repository URL"
                          className="pl-8"
                        />
                        <Github className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                      </div>
                    </LabeledField>
                    <LabeledField label="Live URL">
                      <div className="relative">
                        <Input
                          value={project.url || ""}
                          onChange={(e) => {
                            const projects = JSON.parse(
                              JSON.stringify(cvData.projects || [])
                            );
                            projects[index].url = e.target.value;
                            updateCV({ projects });
                          }}
                          placeholder="Live demo URL"
                          className="pl-8"
                        />
                        <ExternalLink className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                      </div>
                    </LabeledField>
                  </div>

                  <LabeledField label="Technologies">
                    <Technologies
                      technologies={project.technologies || []}
                      onChange={(technologies) => {
                        const projects = JSON.parse(
                          JSON.stringify(cvData.projects || [])
                        );
                        projects[index].technologies = technologies;
                        updateCV({ projects });
                      }}
                    />
                  </LabeledField>
                </ItemCard>
              ))}
            </div>
          )}
        </FormSection>
      </div>
    </ScrollArea>
  );
}
