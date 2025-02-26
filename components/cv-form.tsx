"use client";

import { CVData } from "@/types/cv";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Wand2,
  LoaderCircle,
  ClipboardCopy,
  CheckCircle,
  XCircle,
  BookOpen,
} from "lucide-react";
import { useState, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { exampleText } from "./examples";

interface CVFormProps {
  onDataChange: (data: CVData) => void;
}

// Sarah's CV example text - detailed professional version

export function CVForm({ onDataChange }: CVFormProps) {
  const [userText, setUserText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const [jsonOutput, setJsonOutput] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [exampleCopied, setExampleCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"input" | "output">("input");

  const abortController = useRef<AbortController | null>(null);
  const outputAreaRef = useRef<HTMLDivElement>(null);

  const useExample = () => {
    setUserText(exampleText);
  };

  const clearForm = () => {
    setUserText("");
    setError(null);
    setProgressMessages([]);
    setJsonOutput("");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(userText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyExample = () => {
    navigator.clipboard.writeText(exampleText);
    setExampleCopied(true);
    setTimeout(() => setExampleCopied(false), 2000);
  };

  const cancelGeneration = () => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
      setGenerating(false);
      setProgressMessages((prev) => [...prev, "Generation canceled"]);
    }
  };

  const generateCV = async () => {
    if (!userText.trim()) {
      setError("Please provide some information about yourself first");
      return;
    }

    setGenerating(true);
    setError(null);
    setProgressMessages([]);
    setJsonOutput("");
    setActiveTab("output");

    try {
      // Cancel any existing request
      if (abortController.current) {
        abortController.current.abort();
      }

      // Create a new AbortController
      abortController.current = new AbortController();

      const response = await fetch("/api/generate-cv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: userText }),
        signal: abortController.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to start generation");
      }

      // Set up streaming reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Process the chunks
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            // Handle progress updates
            if (data.progress) {
              setProgressMessages((prev) => [...prev, data.progress]);

              // Auto scroll to bottom of output area
              if (outputAreaRef.current) {
                outputAreaRef.current.scrollTop =
                  outputAreaRef.current.scrollHeight;
              }
            }

            // Handle errors
            if (data.error) {
              throw new Error(data.error);
            }

            // Handle data
            if (data.data) {
              // Format JSON with indentation for display
              const formattedJson = JSON.stringify(data.data, null, 2);
              setJsonOutput(formattedJson);

              // Pass the data to the parent component
              onDataChange(data.data);

              // Add success message
              setProgressMessages((prev) => [
                ...prev,
                "✅ CV generated successfully!",
              ]);

              // Auto scroll to bottom of output area
              if (outputAreaRef.current) {
                setTimeout(() => {
                  if (outputAreaRef.current) {
                    outputAreaRef.current.scrollTop =
                      outputAreaRef.current.scrollHeight;
                  }
                }, 100);
              }
            }
          } catch (e) {
            // Ignore JSON parse errors for incomplete chunks
            console.log("Parse error or incomplete chunk:", e);
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Error generating CV:", error);
        setError((error as Error).message || "Failed to generate CV data");
        setProgressMessages((prev) => [
          ...prev,
          `❌ Error: ${(error as Error).message}`,
        ]);
      }
    } finally {
      setGenerating(false);
      abortController.current = null;
    }
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
          {!generating && (
            <Button
              onClick={generateCV}
              disabled={!userText.trim()}
              className="flex items-center gap-2"
            >
              <Wand2 className="h-4 w-4" />
              Generate CV
            </Button>
          )}
          {generating && (
            <Button
              variant="destructive"
              onClick={cancelGeneration}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "input" | "output")}
        className="flex-1 flex flex-col"
      >
        <div className="px-4 pt-2 border-b">
          <TabsList className="grid grid-cols-2 w-64">
            <TabsTrigger value="input">User Input</TabsTrigger>
            <TabsTrigger value="output">Generation Output</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="input" className="flex-1 flex flex-col p-4 pt-2">
          {/* Example accordion */}
          <Accordion type="single" collapsible className="w-full mb-4">
            <AccordionItem value="example" className="border rounded-md">
              <AccordionTrigger className="px-4 py-2 hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span>View example input</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-slate-50 rounded-b-md border-t">
                <div className="relative p-4">
                  <ScrollArea className="h-60">
                    <pre className="whitespace-pre-wrap text-sm font-sans">
                      {exampleText}
                    </pre>
                  </ScrollArea>
                  <div className="sticky bottom-0 flex justify-end gap-2 pt-2 bg-slate-50">
                    <Button size="sm" variant="outline" onClick={copyExample}>
                      <ClipboardCopy className="h-3.5 w-3.5 mr-1" />
                      {exampleCopied ? "Copied!" : "Copy Example"}
                    </Button>
                    <Button size="sm" onClick={useExample}>
                      Use This Example
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Form controls */}
          <div className="flex justify-end space-x-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearForm}
              disabled={generating || !userText}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              disabled={!userText}
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" /> Copied
                </>
              ) : (
                <>
                  <ClipboardCopy className="h-4 w-4 mr-1" /> Copy
                </>
              )}
            </Button>
          </div>

          {/* Main textarea */}
          <Textarea
            placeholder="Tell me about your professional experience, education, skills, and contact information..."
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            className="flex-1 min-h-0 resize-none"
            disabled={generating}
          />

          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-muted-foreground mt-2">
            <p>
              Describe your experience, skills, education, and contact
              information. The AI will generate your CV structure.
            </p>
          </div>
        </TabsContent>

        <TabsContent
          value="output"
          className="flex-1 flex flex-col overflow-hidden p-4 pt-2"
        >
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 flex flex-col overflow-hidden border rounded-md">
              <div className="bg-slate-100 border-b p-2 flex justify-between">
                <span className="font-mono text-sm">CV Data Generation</span>
                {jsonOutput && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(jsonOutput);
                      setProgressMessages((prev) => [
                        ...prev,
                        "JSON copied to clipboard",
                      ]);
                    }}
                  >
                    <ClipboardCopy className="h-3.5 w-3.5 mr-1" /> Copy JSON
                  </Button>
                )}
              </div>

              <ScrollArea className="flex-1" ref={outputAreaRef}>
                <div className="p-3 space-y-2">
                  {progressMessages.length > 0 && (
                    <div className="space-y-1.5">
                      {progressMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`text-sm px-2 py-1 rounded ${
                            msg.includes("Error")
                              ? "bg-red-50 text-red-700"
                              : msg.includes("success")
                              ? "bg-green-50 text-green-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {msg}
                        </div>
                      ))}
                    </div>
                  )}

                  {jsonOutput && (
                    <>
                      <Separator />
                      <div className="font-mono text-sm whitespace-pre-wrap p-2 bg-slate-50 rounded border">
                        {jsonOutput}
                      </div>
                    </>
                  )}

                  {!generating && !progressMessages.length && !jsonOutput && (
                    <div className="flex items-center justify-center h-full py-12 text-muted-foreground">
                      Click "Generate CV" to start the generation process
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
