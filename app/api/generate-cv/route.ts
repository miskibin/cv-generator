import { NextResponse } from "next/server";
import { CVData } from "@/types/cv";
import { getTypeDefinitions } from "@/utils/typeToString";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Invalid input: text field is required" },
        { status: 400 }
      );
    }

    // Create prompt with type definitions
    const prompt = `
You are a CV assistant that helps create professional CV data in JSON format.
Based on the following information from the user, create a complete CV data structure.

USER INPUT:
${text}

Please generate a JSON object that follows this TypeScript interface:

${getTypeDefinitions()}

Only respond with valid, well-structured JSON that matches this format.
Do not include any other text in your response.
For missing information, use reasonable defaults or leave those fields empty.
For dates, use formats like "June 2019" or "March 2022 - Present".
`;

    // Create streaming response
    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            // Simple status update
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({
                  status: "Working on your CV...",
                }) + "\n"
              )
            );

            // Send request to Ollama
            const ollamaResponse = await fetch(
              "http://localhost:11434/api/generate",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: "llama3.2",
                  prompt,
                  stream: true,
                  options: { temperature: 0.7, top_p: 0.9 },
                }),
              }
            );

            if (!ollamaResponse.ok) {
              throw new Error("Failed to communicate with Ollama API");
            }

            let currentJson = "";

            // Process response stream
            if (ollamaResponse.body) {
              const reader = ollamaResponse.body.getReader();

              // Read stream chunks
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = new TextDecoder().decode(value);

                try {
                  const jsonChunk = JSON.parse(chunk);
                  const responseText = jsonChunk.response || "";
                  currentJson += responseText;

                  // Try to extract valid JSON for streaming
                  try {
                    // Extract what looks like JSON (between curly braces)
                    if (
                      currentJson.includes("{") &&
                      currentJson.includes("}")
                    ) {
                      let jsonText = currentJson.substring(
                        currentJson.indexOf("{"),
                        currentJson.lastIndexOf("}") + 1
                      );

                      // Balance braces if needed
                      const openBraces = (jsonText.match(/{/g) || []).length;
                      const closeBraces = (jsonText.match(/}/g) || []).length;

                      if (openBraces > closeBraces) {
                        jsonText += "}".repeat(openBraces - closeBraces);
                      }

                      // Only send if we can parse it
                      JSON.parse(jsonText);

                      // Send partial result
                      controller.enqueue(
                        new TextEncoder().encode(
                          JSON.stringify({
                            partialResult: jsonText,
                          }) + "\n"
                        )
                      );
                    }
                  } catch (e) {
                    // Silently continue if we couldn't parse yet
                  }
                } catch (error) {
                  // Ignore parse errors for chunks
                }
              }

              try {
                // Extract final JSON (either from code block or directly)
                let finalJson = currentJson;

                // Try to find JSON in code block first
                const codeBlockMatch = finalJson.match(
                  /```(?:json)?\s*([\s\S]*?)\s*```/
                );
                if (codeBlockMatch) {
                  finalJson = codeBlockMatch[1].trim();
                } else if (finalJson.includes("{") && finalJson.includes("}")) {
                  // Otherwise extract what's between the outermost braces
                  finalJson = finalJson.substring(
                    finalJson.indexOf("{"),
                    finalJson.lastIndexOf("}") + 1
                  );
                }

                // Parse the extracted JSON
                const cvData: CVData = JSON.parse(finalJson);

                // Apply defaults and send final result
                const enhancedData: CVData = {
                  ...cvData,
                  firstName: cvData.firstName?.trim() || "Anonymous",
                  lastName: cvData.lastName?.trim() || "User",
                  email: cvData.email?.trim() || "no-email@example.com",
                  about: cvData.about?.trim() || "No information provided",
                  projects: cvData.projects?.map((p) => ({
                    ...p,
                    description: p.description || "No description provided",
                    technologies: p.technologies || [],
                  })),
                  experience: cvData.experience?.map((exp) => ({
                    ...exp,
                    projects: exp.projects?.map((p) => ({
                      ...p,
                      description: p.description || "No description provided",
                      technologies: p.technologies || [],
                    })),
                  })),
                };

                // Send the final result
                controller.enqueue(
                  new TextEncoder().encode(
                    JSON.stringify({
                      result: enhancedData,
                      status: "Complete",
                    }) + "\n"
                  )
                );
              } catch (error) {
                controller.enqueue(
                  new TextEncoder().encode(
                    JSON.stringify({
                      error: "Failed to parse CV data",
                      status: "Error",
                    }) + "\n"
                  )
                );
              }
            }
          } catch (error) {
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({
                  error:
                    error instanceof Error
                      ? error.message
                      : "Error during generation",
                  status: "Error",
                }) + "\n"
              )
            );
          } finally {
            controller.close();
          }
        },
      }),
      { headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Server error while generating CV data" },
      { status: 500 }
    );
  }
}
