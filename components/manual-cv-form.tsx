import React, { useState } from "react";
import { CVData, Education, Experience, Project } from "@/types/cv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, X } from "lucide-react";
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

  // Handle skill deletion
  const removeSkill = (index: number) => {
    const updatedSkills = [...(formData.skills || [])];
    updatedSkills.splice(index, 1);
    handleChange("skills", updatedSkills);
  };

  // Handle language addition
  const addLanguage = () => {
    if (!languageName.trim() || !languageLevel.trim()) return;
    const updatedLanguages = { ...(formData.languages || {}) };
    updatedLanguages[languageName] = languageLevel;
    handleChange("languages", updatedLanguages);
    setLanguageName("");
    setLanguageLevel("");
  };

  // Handle language deletion
  const removeLanguage = (lang: string) => {
    const updatedLanguages = { ...(formData.languages || {}) };
    delete updatedLanguages[lang];
    handleChange("languages", updatedLanguages);
  };

  // Handle education items
  const addEducation = () => {
    const newEducation: Education = {
      institution: "",
      degree: "",
      graduationDate: "",
    };
    handleChange("education", [...(formData.education || []), newEducation]);
  };

  const updateEducation = (
    index: number,
    field: keyof Education,
    value: string
  ) => {
    const updatedEducation = [...(formData.education || [])];
    updatedEducation[index] = { ...updatedEducation[index], [field]: value };
    handleChange("education", updatedEducation);
  };

  const removeEducation = (index: number) => {
    const updatedEducation = [...(formData.education || [])];
    updatedEducation.splice(index, 1);
    handleChange("education", updatedEducation);
  };

  // Handle experience items
  const addExperience = () => {
    const newExperience: Experience = {
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      summary: "",
    };
    handleChange("experience", [...(formData.experience || []), newExperience]);
  };

  const updateExperience = (
    index: number,
    field: keyof Experience,
    value: any
  ) => {
    const updatedExperience = [...(formData.experience || [])];
    updatedExperience[index] = { ...updatedExperience[index], [field]: value };
    handleChange("experience", updatedExperience);
  };

  const removeExperience = (index: number) => {
    const updatedExperience = [...(formData.experience || [])];
    updatedExperience.splice(index, 1);
    handleChange("experience", updatedExperience);
  };

  // Handle projects within experience
  const addProjectToExperience = (expIndex: number) => {
    const updatedExperience = [...(formData.experience || [])];
    const newProject: Project = {
      name: "",
      description: "",
      technologies: [],
    };
    updatedExperience[expIndex].projects = [
      ...(updatedExperience[expIndex].projects || []),
      newProject,
    ];
    handleChange("experience", updatedExperience);
  };

  const updateExperienceProject = (
    expIndex: number,
    projIndex: number,
    field: keyof Project,
    value: any
  ) => {
    const updatedExperience = [...(formData.experience || [])];
    if (!updatedExperience[expIndex].projects) {
      updatedExperience[expIndex].projects = [];
    }
    updatedExperience[expIndex].projects![projIndex] = {
      ...updatedExperience[expIndex].projects![projIndex],
      [field]: value,
    };
    handleChange("experience", updatedExperience);
  };

  const removeExperienceProject = (expIndex: number, projIndex: number) => {
    const updatedExperience = [...(formData.experience || [])];
    updatedExperience[expIndex].projects!.splice(projIndex, 1);
    handleChange("experience", updatedExperience);
  };

  // Handle standalone projects
  const addProject = () => {
    const newProject: Project = {
      name: "",
      description: "",
      technologies: [],
    };
    handleChange("projects", [...(formData.projects || []), newProject]);
  };

  const updateProject = (index: number, field: keyof Project, value: any) => {
    const updatedProjects = [...(formData.projects || [])];
    updatedProjects[index] = { ...updatedProjects[index], [field]: value };
    handleChange("projects", updatedProjects);
  };

  const removeProject = (index: number) => {
    const updatedProjects = [...(formData.projects || [])];
    updatedProjects.splice(index, 1);
    handleChange("projects", updatedProjects);
  };

  // Handle project technologies
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

  const removeTechnology = (
    projIndex: number,
    techIndex: number,
    isExperienceProject: boolean = false,
    expIndex?: number
  ) => {
    if (isExperienceProject && expIndex !== undefined) {
      const updatedExperience = [...(formData.experience || [])];
      updatedExperience[expIndex].projects![projIndex].technologies.splice(
        techIndex,
        1
      );
      handleChange("experience", updatedExperience);
    } else {
      const updatedProjects = [...(formData.projects || [])];
      updatedProjects[projIndex].technologies.splice(techIndex, 1);
      handleChange("projects", updatedProjects);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName || ""}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="John"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName || ""}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="john.doe@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+1 (123) 456-7890"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="github">GitHub</Label>
            <Input
              id="github"
              value={formData.github || ""}
              onChange={(e) => handleChange("github", e.target.value)}
              placeholder="username or https://github.com/username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              value={formData.linkedin || ""}
              onChange={(e) => handleChange("linkedin", e.target.value)}
              placeholder="username or https://linkedin.com/in/username"
            />
          </div>
        </CardContent>
      </Card>

      {/* About Me */}
      <Card>
        <CardHeader>
          <CardTitle>About Me</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.about || ""}
            onChange={(e) => handleChange("about", e.target.value)}
            placeholder="Write a brief summary about yourself..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill (e.g., JavaScript, React)"
              onKeyPress={(e) => e.key === "Enter" && addSkill()}
            />
            <Button type="button" onClick={addSkill}>
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.skills?.map((skill, index) => (
              <Badge key={index} className="px-2 py-1">
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="ml-2 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader>
          <CardTitle>Languages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={languageName}
              onChange={(e) => setLanguageName(e.target.value)}
              placeholder="Language (e.g., English)"
              className="flex-1"
            />
            <Input
              value={languageLevel}
              onChange={(e) => setLanguageLevel(e.target.value)}
              placeholder="Level (e.g., Fluent)"
              className="flex-1"
            />
            <Button type="button" onClick={addLanguage}>
              Add
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {formData.languages &&
              Object.entries(formData.languages).map(([lang, level], index) => (
                <Badge
                  key={index}
                  className="px-2 py-1 flex justify-between items-center"
                >
                  <span>
                    {lang}: {level}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLanguage(lang)}
                    className="ml-2 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Education */}
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="education" className="border rounded-md">
          <AccordionTrigger className="px-4 py-2 font-semibold">
            Education
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-0 border-t space-y-3">
            <Button
              type="button"
              onClick={addEducation}
              className="w-full mt-3"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Education
            </Button>

            {formData.education?.map((edu, index) => (
              <Card key={index} className="relative">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeEducation(index)}
                  className="absolute right-2 top-2 h-6 w-6 text-gray-500 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2">
                    <Label>Institution</Label>
                    <Input
                      value={edu.institution}
                      onChange={(e) =>
                        updateEducation(index, "institution", e.target.value)
                      }
                      placeholder="University or School Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Degree</Label>
                    <Input
                      value={edu.degree}
                      onChange={(e) =>
                        updateEducation(index, "degree", e.target.value)
                      }
                      placeholder="e.g., Bachelor of Science in Computer Science"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Graduation Date</Label>
                    <Input
                      value={edu.graduationDate}
                      onChange={(e) =>
                        updateEducation(index, "graduationDate", e.target.value)
                      }
                      placeholder="e.g., June 2020"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Experience */}
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="experience" className="border rounded-md">
          <AccordionTrigger className="px-4 py-2 font-semibold">
            Professional Experience
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-0 border-t space-y-3">
            <Button
              type="button"
              onClick={addExperience}
              className="w-full mt-3"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Experience
            </Button>

            {formData.experience?.map((exp, expIndex) => (
              <Card key={expIndex} className="relative">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeExperience(expIndex)}
                  className="absolute right-2 top-2 h-6 w-6 text-gray-500 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input
                      value={exp.company}
                      onChange={(e) =>
                        updateExperience(expIndex, "company", e.target.value)
                      }
                      placeholder="Company Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Input
                      value={exp.position}
                      onChange={(e) =>
                        updateExperience(expIndex, "position", e.target.value)
                      }
                      placeholder="Your Job Title"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        value={exp.startDate}
                        onChange={(e) =>
                          updateExperience(
                            expIndex,
                            "startDate",
                            e.target.value
                          )
                        }
                        placeholder="e.g., March 2018"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        value={exp.endDate}
                        onChange={(e) =>
                          updateExperience(expIndex, "endDate", e.target.value)
                        }
                        placeholder="e.g., Present"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Summary</Label>
                    <Textarea
                      value={exp.summary || ""}
                      onChange={(e) =>
                        updateExperience(expIndex, "summary", e.target.value)
                      }
                      placeholder="Describe your responsibilities and achievements"
                      rows={3}
                    />
                  </div>

                  {/* Projects within experience */}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Projects at this company</h4>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addProjectToExperience(expIndex)}
                      >
                        <Plus className="mr-1 h-3 w-3" /> Add Project
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {exp.projects?.map((project, projIndex) => (
                        <Card key={projIndex} className="relative">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              removeExperienceProject(expIndex, projIndex)
                            }
                            className="absolute right-1 top-1 h-5 w-5 text-gray-500 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </Button>

                          <CardContent className="p-3 space-y-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Project Name</Label>
                              <Input
                                value={project.name}
                                onChange={(e) =>
                                  updateExperienceProject(
                                    expIndex,
                                    projIndex,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="Project Name"
                                className="h-8 text-sm"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Description</Label>
                              <Textarea
                                value={project.description}
                                onChange={(e) =>
                                  updateExperienceProject(
                                    expIndex,
                                    projIndex,
                                    "description",
                                    e.target.value
                                  )
                                }
                                placeholder="Brief description"
                                className="text-sm"
                                rows={2}
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <Label className="text-xs">Technologies</Label>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    addTechnology(projIndex, true, expIndex)
                                  }
                                  className="h-6 text-xs"
                                >
                                  Add Tech
                                </Button>
                              </div>

                              <div className="flex flex-wrap gap-1 mt-1">
                                {project.technologies?.map(
                                  (tech, techIndex) => (
                                    <Badge
                                      key={techIndex}
                                      variant="secondary"
                                      className="text-xs px-1"
                                    >
                                      {tech}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeTechnology(
                                            projIndex,
                                            techIndex,
                                            true,
                                            expIndex
                                          )
                                        }
                                        className="ml-1 hover:text-red-500"
                                      >
                                        <X className="h-2 w-2" />
                                      </button>
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">GitHub URL</Label>
                                <Input
                                  value={project.github || ""}
                                  onChange={(e) =>
                                    updateExperienceProject(
                                      expIndex,
                                      projIndex,
                                      "github",
                                      e.target.value
                                    )
                                  }
                                  placeholder="GitHub URL"
                                  className="h-8 text-sm"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Project URL</Label>
                                <Input
                                  value={project.url || ""}
                                  onChange={(e) =>
                                    updateExperienceProject(
                                      expIndex,
                                      projIndex,
                                      "url",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Live URL"
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Standalone Projects */}
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="projects" className="border rounded-md">
          <AccordionTrigger className="px-4 py-2 font-semibold">
            Projects
          </AccordionTrigger>
          <AccordionContent className="p-4 pt-0 border-t space-y-3">
            <Button type="button" onClick={addProject} className="w-full mt-3">
              <Plus className="mr-2 h-4 w-4" /> Add Project
            </Button>

            {formData.projects?.map((project, projIndex) => (
              <Card key={projIndex} className="relative">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeProject(projIndex)}
                  className="absolute right-2 top-2 h-6 w-6 text-gray-500 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2">
                    <Label>Project Name</Label>
                    <Input
                      value={project.name}
                      onChange={(e) =>
                        updateProject(projIndex, "name", e.target.value)
                      }
                      placeholder="Project Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={project.description}
                      onChange={(e) =>
                        updateProject(projIndex, "description", e.target.value)
                      }
                      placeholder="Describe your project"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Technologies</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addTechnology(projIndex)}
                      >
                        Add Tech
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.technologies?.map((tech, techIndex) => (
                        <Badge
                          key={techIndex}
                          variant="secondary"
                          className="px-2 py-1"
                        >
                          {tech}
                          <button
                            type="button"
                            onClick={() =>
                              removeTechnology(projIndex, techIndex)
                            }
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>GitHub URL</Label>
                      <Input
                        value={project.github || ""}
                        onChange={(e) =>
                          updateProject(projIndex, "github", e.target.value)
                        }
                        placeholder="GitHub URL"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Project URL</Label>
                      <Input
                        value={project.url || ""}
                        onChange={(e) =>
                          updateProject(projIndex, "url", e.target.value)
                        }
                        placeholder="Live URL"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
