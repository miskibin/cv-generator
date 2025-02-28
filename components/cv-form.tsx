"use client";

import { CVData } from "@/types/cv";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Wand2,
  LoaderCircle,
  ClipboardCopy,
  XCircle,
  FileEdit,
  MessageSquare,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ManualCVForm } from "./manual-cv-form";

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
  const [jsonOutput, setJsonOutput] = useState<string>("");
  const [lastGeneratedData, setLastGeneratedData] = useState<CVData | null>(
    null
  );

  const abortController = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Effect to update manual data when AI generates something
  useEffect(() => {
    if (lastGeneratedData) {
      setManualData(lastGeneratedData);
    }
  }, [lastGeneratedData]);

  // Effect to initialize from initialData if provided
  useEffect(() => {
    if (initialData) {
      setManualData(initialData);
      if (Object.keys(initialData).length > 0) {
        setInputMode("manual");
      }
    }
  }, [initialData]);

  const clearForm = () => {
    setUserText("");
    setJobRequirements("");
    setManualData({});
    setError(null);
    setStatus(null);
    setJsonOutput("");
    setLastGeneratedData(null);
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
    if (Object.keys(manualData).length > 2) {
      const data = manualData;
      let text = "";

      if (data.firstName || data.lastName) {
        text += `My name is ${data.firstName || ""} ${data.lastName || ""}.`;
      }

      if (data.email) text += ` Email: ${data.email}.`;
      if (data.phone) text += ` Phone: ${data.phone}.`;
      if (data.github) text += ` GitHub: ${data.github}.`;
      if (data.linkedin) text += ` LinkedIn: ${data.linkedin}.`;
      if (data.about) text += `\n\nAbout me: ${data.about}`;
      if (data.skills?.length)
        text += `\n\nMy skills include: ${data.skills.join(", ")}`;

      // And so on for other fields...
      setUserText(text);
    }
    setInputMode("ai");
  };

  // Generate CV using either AI input or manual data
  const generateCV = async () => {
    // Validate inputs
    if (inputMode === "ai" && !userText.trim()) {
      setError("Please provide some information about yourself first");
      return;
    }

    if (inputMode === "manual") {
      const requiredFields = ["firstName", "lastName", "email"];
      const missingFields = requiredFields.filter(
        (field) => !manualData[field as keyof CVData]
      );
      if (missingFields.length > 0) {
        setError(`Please fill in required fields: ${missingFields.join(", ")}`);
        return;
      }
    }

    setGenerating(true);
    setError(null);
    setStatus(null);
    setJsonOutput("");

    try {
      if (abortController.current) abortController.current.abort();
      abortController.current = new AbortController();

      const requestBody =
        inputMode === "ai"
          ? { text: userText, jobRequirements }
          : { text: "", manualData, jobRequirements };

      const response = await fetch("/api/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: abortController.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to start generation");
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

            // Always display status updates to fix the visibility issue
            if (data.status) {
              setStatus(data.status);
            }

            // Show partial results as they come in
            if (data.partialResult) {
              try {
                setJsonOutput(
                  JSON.stringify(JSON.parse(data.partialResult), null, 2)
                );

                // Auto scroll output area
                if (outputRef.current) {
                  outputRef.current.scrollTop = outputRef.current.scrollHeight;
                }
              } catch (e) {
                // If we can't parse it, show as is
                setJsonOutput(data.partialResult);
              }
            }

            // Handle final result
            if (data.result) {
              setStatus("✅ CV generated successfully!");
              setJsonOutput(JSON.stringify(data.result, null, 2));
              // Save generated data for both output and manual form
              setLastGeneratedData(data.result);
              onDataChange(data.result);
            }

            // Handle errors - ensure they're displayed
            if (data.error) {
              setError(data.error);
              setStatus("❌ Error: " + data.error);
            }
          } catch (e) {
            // Ignore parsing errors for chunks
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setError((error as Error).message || "Failed to generate CV data");
        setStatus(`❌ Error: ${(error as Error).message}`);
      }
    } finally {
      setGenerating(false);
      abortController.current = null;
    }
  };

  const copyJson = () => {
    navigator.clipboard.writeText(jsonOutput);
    setStatus("JSON copied to clipboard");
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-between items-center p-4 border-b bg-slate-50">
        <h2 className="text-xl font-semibold">CV Generator</h2>
        <div className="flex items-center space-x-2">
          <Badge
            variant={generating ? "secondary" : "outline"}
            className={generating ? "animate-pulse" : ""}
          >
            {generating ? "Generating..." : "Ready"}
          </Badge>
          {!generating ? (
            <Button onClick={generateCV} className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" /> Generate CV
            </Button>
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
              <Textarea
                placeholder="Tell me about your experience, education, skills, and contact information..."
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                className="h-64 resize-none"
                disabled={generating}
              />

              <Textarea
                placeholder="Paste the job description or key requirements here to tailor your CV..."
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

        {/* Always show status to fix visibility issue */}
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
        {error && !status?.includes("❌") && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Result display */}
        {jsonOutput && (
          <div className="flex-1 min-h-0 flex flex-col border rounded-md overflow-hidden">
            <div className="bg-slate-100 border-b p-2 flex justify-between items-center">
              <span className="text-sm font-medium">Generated CV Data</span>
              <Button variant="ghost" size="sm" onClick={copyJson}>
                <ClipboardCopy className="h-3.5 w-3.5 mr-1" /> Copy JSON
              </Button>
            </div>

            <ScrollArea className="flex-1" ref={outputRef}>
              <pre className="p-3 text-sm font-mono whitespace-pre-wrap">
                {jsonOutput}
              </pre>
            </ScrollArea>
          </div>
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

          {!generating && (
            <Button onClick={generateCV} className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" /> Generate CV
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
