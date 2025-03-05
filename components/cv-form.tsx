"use client";

import { CVData } from "@/types/cv";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Wand2,
  LoaderCircle,
  XCircle,
  FileEdit,
  MessageSquare,
  Save,
  User,
  Github,
  Plus,
  Trash2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ManualCVForm } from "./manual-cv-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCVStore } from "@/store/cv-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GitHubProjectsFetcher } from "@/components/github-projects-fetcher";

interface CVFormProps {
  onDataChange: (data: CVData) => void;
  initialData?: CVData;
}

export function CVForm({ onDataChange, initialData }: CVFormProps) {
  const { cvData, updateCV, resetCV } = useCVStore();
  const [activeTab, setActiveTab] = useState<"persistent" | "ai" | "manual">(
    "persistent"
  );
  const [jobDescription, setJobDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("phi4");
  const [models, setModels] = useState<string[]>([]);
  const [modelLoading, setModelLoading] = useState(false);

  const [newLanguageName, setNewLanguageName] = useState("");
  const [newLanguageLevel, setNewLanguageLevel] = useState("");

  const abortController = useRef<AbortController | null>(null);

  // Initialize: Use data from initialData prop, then from store
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      updateCV(initialData);
    } else if (cvData && Object.keys(cvData).length > 0) {
      // Data from localStorage via Zustand
      onDataChange(cvData as CVData);
    }
  }, [initialData]);

  // Fetch available models from Ollama
  useEffect(() => {
    async function fetchModels() {
      setModelLoading(true);
      try {
        const response = await fetch("/api/get-models");
        if (response.ok) {
          const data = await response.json();
          if (data.models && Array.isArray(data.models)) {
            setModels(data.models);
            // Set default model if available
            if (data.models.length > 0 && data.models.includes("phi4")) {
              setSelectedModel("phi4");
            } else if (data.models.length > 0) {
              setSelectedModel(data.models[0]);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load models:", error);
      } finally {
        setModelLoading(false);
      }
    }

    fetchModels();
  }, []);

  const clearForm = () => {
    setJobDescription("");
    resetCV();
    onDataChange({} as CVData); // Clear parent component data
    setError(null);
    setStatus(null);
  };

  const cancelGeneration = () => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
      setGenerating(false);
      setStatus("Generation canceled");
    }
  };

  const updatePersistentData = () => {
    // Validate required fields
    const requiredFields = ["firstName", "lastName", "email"];
    const missingFields = requiredFields.filter(
      (field) => !cvData[field as keyof CVData]
    );

    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    setStatus("✅ Personal information updated successfully!");
    onDataChange(cvData as CVData);
  };

  // Handle direct CV update from manual data
  const updateCVFromManual = () => {
    // Validate required fields
    const requiredFields = ["firstName", "lastName", "email"];
    const missingFields = requiredFields.filter(
      (field) => !cvData[field as keyof CVData]
    );

    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    setStatus("✅ CV updated successfully!");
    onDataChange(cvData as CVData);
  };

  // Generate CV using AI based on job description
  const generateCV = async () => {
    // Validate inputs
    if (!jobDescription.trim()) {
      setError("Please provide a job description");
      return;
    }

    // Validate persistent data
    const requiredFields = ["firstName", "lastName", "email"];
    const missingFields = requiredFields.filter(
      (field) => !cvData[field as keyof CVData]
    );

    if (missingFields.length > 0) {
      setError(
        `Please fill in your personal information first: ${missingFields.join(
          ", "
        )}`
      );
      return;
    }

    setGenerating(true);
    setError(null);
    setStatus("Tailoring your CV to the job description...");

    try {
      if (abortController.current) abortController.current.abort();
      abortController.current = new AbortController();

      const response = await fetch("/api/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRequirements: jobDescription,
          manualData: cvData,
          model: selectedModel,
        }),
        signal: abortController.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to generate CV");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            // Update status messages as they come
            if (data.status) {
              setStatus(data.status);
            }

            // Handle final result
            if (data.result) {
              setStatus("✅ CV tailored successfully!");
              // Update store and app state with the new CV data
              updateCV(data.result);
              onDataChange(data.result);
            }

            // Handle errors
            if (data.error) {
              setError(data.error);
              setStatus(null);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setError((error as Error).message || "Failed to generate CV");
        setStatus(null);
      }
    } finally {
      setGenerating(false);
      abortController.current = null;
    }
  };

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

  const addEducation = () => {
    updateCV({
      education: [
        ...(cvData.education || []),
        { institution: "", degree: "", startDate: "", endDate: "" },
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
          description: "",
        },
      ],
    });
  };

  const removeExperience = (index: number) => {
    const experience = [...(cvData.experience || [])];
    experience.splice(index, 1);
    updateCV({ experience });
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-end items-center p-4 border-b bg-slate-50">
        <div className="flex items-center space-x-2">
          <Badge
            variant={generating ? "secondary" : "outline"}
            className={generating ? "animate-pulse" : ""}
          >
            {generating ? "Generating..." : "Ready"}
          </Badge>
          {!generating ? (
            activeTab === "ai" ? (
              <Button onClick={generateCV} className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" /> Tailor CV
              </Button>
            ) : activeTab === "manual" ? (
              <Button
                onClick={updateCVFromManual}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" /> Update CV
              </Button>
            ) : (
              <Button
                onClick={updatePersistentData}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" /> Save Profile
              </Button>
            )
          ) : (
            <Button
              variant="destructive"
              onClick={cancelGeneration}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" /> Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col p-4 space-y-4 flex-1 min-h-0 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "persistent" | "ai" | "manual")
          }
          className="flex-1 flex flex-col"
        >
          <TabsList>
            <TabsTrigger value="persistent">
              <User className="h-4 w-4 mr-1" /> Your Profile
            </TabsTrigger>
            <TabsTrigger value="ai">
              <MessageSquare className="h-4 w-4 mr-1" /> Tailoring
            </TabsTrigger>
            <TabsTrigger value="manual">
              <FileEdit className="h-4 w-4 mr-1" /> Manual Input
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Persistent User Information */}
          <TabsContent value="persistent" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="pr-4 pb-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>
                      Enter your basic contact details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name*</Label>
                        <Input
                          id="firstName"
                          value={cvData.firstName || ""}
                          onChange={(e) =>
                            updateCV({ firstName: e.target.value })
                          }
                          placeholder="John"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name*</Label>
                        <Input
                          id="lastName"
                          value={cvData.lastName || ""}
                          onChange={(e) =>
                            updateCV({ lastName: e.target.value })
                          }
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address*</Label>
                      <Input
                        id="email"
                        type="email"
                        value={cvData.email || ""}
                        onChange={(e) => updateCV({ email: e.target.value })}
                        placeholder="john.doe@example.com"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={cvData.phone || ""}
                          onChange={(e) => updateCV({ phone: e.target.value })}
                          placeholder="+1 (123) 456-7890"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={cvData.location || ""}
                          onChange={(e) =>
                            updateCV({ location: e.target.value })
                          }
                          placeholder="City, Country"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={cvData.linkedin || ""}
                          onChange={(e) =>
                            updateCV({ linkedin: e.target.value })
                          }
                          placeholder="linkedin.com/in/johndoe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Personal Website</Label>
                        <Input
                          id="website"
                          value={cvData.website || ""}
                          onChange={(e) =>
                            updateCV({ website: e.target.value })
                          }
                          placeholder="johndoe.com"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Professional Summary</CardTitle>
                    <CardDescription>
                      Tell us about yourself, your experience, and your career
                      goals. The AI will extract the most relevant parts for
                      your CV.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Describe your professional background, key skills, major achievements, and career objectives..."
                      value={cvData.about || ""}
                      onChange={(e) => updateCV({ about: e.target.value })}
                      className="min-h-40"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Languages</CardTitle>
                    <CardDescription>
                      Add languages you know and your proficiency level
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                          <SelectItem value="Intermediate">
                            Intermediate
                          </SelectItem>
                          <SelectItem value="Basic">Basic</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={addLanguage} size="sm">
                        Add
                      </Button>
                    </div>

                    {cvData.languages &&
                      Object.keys(cvData.languages).length > 0 && (
                        <div className="space-y-2">
                          {Object.entries(cvData.languages).map(
                            ([lang, level]) => (
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLanguage(lang)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )
                          )}
                        </div>
                      )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Education</CardTitle>
                        <CardDescription>
                          Add your educational background
                        </CardDescription>
                      </div>
                      <Button
                        onClick={addEducation}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cvData.education?.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        No education entries added yet
                      </div>
                    )}

                    {cvData.education?.map((edu, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-md space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">
                            {edu.institution || "New Institution"}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEducation(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <div className="space-y-1">
                            <Label>Institution</Label>
                            <Input
                              value={edu.institution || ""}
                              onChange={(e) => {
                                const education = [...(cvData.education || [])];
                                education[index].institution = e.target.value;
                                updateCV({ education });
                              }}
                              placeholder="University name"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Degree</Label>
                            <Input
                              value={edu.degree || ""}
                              onChange={(e) => {
                                const education = [...(cvData.education || [])];
                                education[index].degree = e.target.value;
                                updateCV({ education });
                              }}
                              placeholder="Degree name"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label>Start Date</Label>
                              <Input
                                value={edu.startDate || ""}
                                onChange={(e) => {
                                  const education = [
                                    ...(cvData.education || []),
                                  ];
                                  education[index].startDate = e.target.value;
                                  updateCV({ education });
                                }}
                                placeholder="e.g. September 2018"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>End Date</Label>
                              <Input
                                value={edu.endDate || ""}
                                onChange={(e) => {
                                  const education = [
                                    ...(cvData.education || []),
                                  ];
                                  education[index].endDate = e.target.value;
                                  updateCV({ education });
                                }}
                                placeholder="e.g. June 2022 or Present"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Work Experience</CardTitle>
                        <CardDescription>
                          Add your work experience
                        </CardDescription>
                      </div>
                      <Button
                        onClick={addExperience}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cvData.experience?.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        No experience entries added yet
                      </div>
                    )}

                    {cvData.experience?.map((exp, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-md space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">
                            {exp.position || "New Position"}
                            {exp.company && ` at ${exp.company}`}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExperience(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <div className="space-y-1">
                            <Label>Company</Label>
                            <Input
                              value={exp.company || ""}
                              onChange={(e) => {
                                const experience = [
                                  ...(cvData.experience || []),
                                ];
                                experience[index].company = e.target.value;
                                updateCV({ experience });
                              }}
                              placeholder="Company name"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Position</Label>
                            <Input
                              value={exp.position || ""}
                              onChange={(e) => {
                                const experience = [
                                  ...(cvData.experience || []),
                                ];
                                experience[index].position = e.target.value;
                                updateCV({ experience });
                              }}
                              placeholder="Job title"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label>Start Date</Label>
                              <Input
                                value={exp.startDate || ""}
                                onChange={(e) => {
                                  const experience = [
                                    ...(cvData.experience || []),
                                  ];
                                  experience[index].startDate = e.target.value;
                                  updateCV({ experience });
                                }}
                                placeholder="e.g. January 2020"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>End Date</Label>
                              <Input
                                value={exp.endDate || ""}
                                onChange={(e) => {
                                  const experience = [
                                    ...(cvData.experience || []),
                                  ];
                                  experience[index].endDate = e.target.value;
                                  updateCV({ experience });
                                }}
                                placeholder="e.g. Present"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label>Description</Label>
                            <Textarea
                              value={exp.description || ""}
                              onChange={(e) => {
                                const experience = [
                                  ...(cvData.experience || []),
                                ];
                                experience[index].description = e.target.value;
                                updateCV({ experience });
                              }}
                              placeholder="Describe your role, responsibilities and achievements..."
                              className="min-h-20"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>GitHub Projects</CardTitle>
                    <CardDescription>
                      Import your projects automatically from GitHub
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GitHubProjectsFetcher />
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab 2: AI Generation Tab */}
          <TabsContent value="ai" className="flex-1 overflow-auto">
            <div className="space-y-4">
              <div className="flex justify-end mb-2">
                <Select
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                  disabled={generating || modelLoading}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue
                      placeholder={
                        modelLoading ? "Loading models..." : "Select model"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {models.length > 0 ? (
                      models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="phi4" disabled>
                        {modelLoading ? "Loading..." : "No models found"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                  <CardDescription>
                    Paste the job description to tailor your CV for this
                    specific role
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Paste the job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-96 resize-none"
                    disabled={generating}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 3: Manual Input (Unchanged) */}
          <TabsContent value="manual" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="pr-4 pb-2">
                <ManualCVForm />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Status display */}
        {status && (
          <div
            className={`text-sm px-3 py-2 rounded flex items-center ${
              status.includes("❌")
                ? "bg-red-50 text-red-700"
                : status.includes("✅")
                ? "bg-green-50 text-green-700"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {generating && !status.includes("❌") && (
              <LoaderCircle className="h-3 w-3 mr-2 animate-spin" />
            )}
            {status}
          </div>
        )}

        {/* Error display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={clearForm}
            disabled={generating}
          >
            <XCircle className="h-3.5 w-3.5 mr-1" /> Clear All
          </Button>
        </div>
      </div>
    </div>
  );
}
