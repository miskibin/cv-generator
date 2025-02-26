"use client";

import { CVData } from "@/types/cv";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, LoaderCircle, ClipboardCopy, XCircle } from "lucide-react";
import { useState, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CVFormProps {
  onDataChange: (data: CVData) => void;
}

export function CVForm({ onDataChange }: CVFormProps) {
  const [userText, setUserText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [jsonOutput, setJsonOutput] = useState<string>("");

  const abortController = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const clearForm = () => {
    setUserText("");
    setError(null);
    setStatus(null);
    setJsonOutput("");
  };

  const cancelGeneration = () => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
      setGenerating(false);
      setStatus("Generation canceled");
    }
  };

  const generateCV = async () => {
    if (!userText.trim()) {
      setError("Please provide some information about yourself first");
      return;
    }

    setGenerating(true);
    setError(null);
    setStatus(null);
    setJsonOutput("");

    try {
      if (abortController.current) abortController.current.abort();
      abortController.current = new AbortController();

      const response = await fetch("/api/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userText }),
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

            // Handle status updates
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
              onDataChange(data.result);
            }

            // Handle errors
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
        <h2 className="text-xl font-semibold">AI CV Generator</h2>
        <div className="flex items-center space-x-2">
          <Badge
            variant={generating ? "secondary" : "outline"}
            className={generating ? "animate-pulse" : ""}
          >
            {generating ? "Generating..." : "Ready"}
          </Badge>
          {!generating ? (
            <Button
              onClick={generateCV}
              disabled={!userText.trim()}
              className="flex items-center gap-2"
            >
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
        {/* User input section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">Enter your CV information</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearForm}
              disabled={generating || !userText}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          </div>

          <Textarea
            placeholder="Tell me about your experience, education, skills, and contact information..."
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            className="h-48 resize-none"
            disabled={generating}
          />
        </div>

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
      </div>
    </div>
  );
}
