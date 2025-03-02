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

interface CVFormProps {
  onDataChange: (data: CVData) => void;
  initialData?: CVData;
}

export function CVForm({ onDataChange, initialData }: CVFormProps) {
  const [inputMode, setInputMode] = useState<"ai" | "manual">("ai");
  const [userText, setUserText] = useState("");
  const [jobRequirements, setJobRequirements] = useState("");
  const [manualData, setManualData] = useState<Partial<CVData>>(
    initialData || {}
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("phi4");
  const [models, setModels] = useState<string[]>([]);
  const [modelLoading, setModelLoading] = useState(false);

  const abortController = useRef<AbortController | null>(null);

  // Effect to initialize from initialData if provided
  useEffect(() => {
    if (initialData) {
      setManualData(initialData);
      if (Object.keys(initialData).length > 0) {
        setInputMode("manual");
      }
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
    setUserText("");
    setJobRequirements("");
    setManualData({});
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

  // Handle switching between AI and manual modes
  const handleSwitchToAI = () => {
    setInputMode("ai");
  };

  // Handle direct CV update from manual data
  const updateCVFromManual = () => {
    // Validate required fields
    const requiredFields = ["firstName", "lastName", "email"];
    const missingFields = requiredFields.filter(
      (field) => !manualData[field as keyof CVData]
    );

    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    setStatus("✅ CV updated successfully!");
    onDataChange(manualData as CVData);
  };

  // Generate CV using AI
  const generateCV = async () => {
    // Validate inputs
    if (!userText.trim()) {
      setError("Please provide some information about yourself");
      return;
    }

    setGenerating(true);
    setError(null);
    setStatus("Processing your information...");

    try {
      if (abortController.current) abortController.current.abort();
      abortController.current = new AbortController();

      const response = await fetch("/api/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: userText,
          jobRequirements,
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
              setStatus("✅ CV generated successfully!");
              // Update app state with the new CV data
              setManualData(data.result);
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
            inputMode === "ai" ? (
              <Button onClick={generateCV} className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" /> Generate CV
              </Button>
            ) : (
              <Button
                onClick={updateCVFromManual}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" /> Update CV
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
          value={inputMode}
          onValueChange={(value) => setInputMode(value as "ai" | "manual")}
          className="flex-1 flex flex-col"
        >
          <TabsList>
            <TabsTrigger value="ai" onClick={handleSwitchToAI}>
              <MessageSquare className="h-4 w-4 mr-1" /> AI Generation
            </TabsTrigger>
            <TabsTrigger value="manual">
              <FileEdit className="h-4 w-4 mr-1" /> Manual Input
            </TabsTrigger>
          </TabsList>

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

              <Textarea
                placeholder="Tell me about your experience, education, skills, and contact information..."
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                className="h-64 resize-none"
                disabled={generating}
              />

              <Textarea
                placeholder="Paste job requirements here to tailor your CV..."
                value={jobRequirements}
                onChange={(e) => setJobRequirements(e.target.value)}
                className="resize-none"
                rows={3}
                disabled={generating}
              />
            </div>
          </TabsContent>

          <TabsContent value="manual" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="pr-4 pb-2">
                <ManualCVForm
                  initialData={manualData as CVData}
                  onChange={setManualData}
                />
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
