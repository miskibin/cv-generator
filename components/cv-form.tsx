"use client";

import { CVData } from "@/types/cv";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { UserProfileForm } from "./user-profile-form";

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

          {/* Tab 1: Persistent User Information - Now uses UserProfileForm component */}
          <TabsContent value="persistent" className="flex-1 overflow-hidden">
            <UserProfileForm />
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
                    The AI will tailor your CV by selecting the most relevant
                    skills and only up to 4 most relevant GitHub projects
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

        <div className="flex justify-between pt-2 border-t"></div>
      </div>
    </div>
  );
}
