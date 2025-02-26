import { NextResponse } from "next/server";
import { CVData } from "@/types/cv";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Invalid input: text field is required" },
        { status: 400 }
      );
    }

    // Create a well-structured prompt for the model
    const prompt = `
You are a CV assistant that helps create professional CV data in JSON format.
Based on the following information from the user, create a complete CV data structure.

USER INPUT:
${text}

Please generate a JSON object that follows this TypeScript interface:

interface Project {
  name: string;
  description: string;
  technologies: string[];
  github?: string;
  url?: string;
}

interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  summary?: string;
  projects?: Project[];
}

interface Education {
  institution: string;
  degree: string;
  graduationDate: string;
}

interface CVData {
  firstName: string;
  lastName: string;
  github?: string;
  email: string;
  phone?: string;
  linkedin?: string;
  about?: string;
  skills?: string[];
  languages?: Record<string, string>;
  education?: Education[];
  experience?: Experience[];
  projects?: Project[];
}

Only respond with valid, well-structured JSON that matches this format.
Do not include any other text in your response.
For missing information, use reasonable defaults or leave those fields empty.
For dates, use formats like "June 2019" or "March 2022 - Present".
`;

    // Create a new ReadableStream for the streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial progress message
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({
                progress: "Initializing CV generation...",
              }) + "\n"
            )
          );

          // Send request to Ollama with streaming enabled
          const ollamaResponse = await fetch(
            "http://localhost:11434/api/generate",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "llama3.2",
                prompt: prompt,
                stream: true,
                options: {
                  temperature: 0.7,
                  top_p: 0.9,
                },
              }),
            }
          );

          if (!ollamaResponse.ok) {
            const errorText = await ollamaResponse.text();
            console.error("Ollama API error:", errorText);
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({
                  error: "Failed to communicate with Ollama API",
                }) + "\n"
              )
            );
            controller.close();
            return;
          }

          // Send connected message
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({
                progress: "Connected to AI model, generating CV data...",
              }) + "\n"
            )
          );

          // Set up response streaming
          if (ollamaResponse.body) {
            const reader = ollamaResponse.body.getReader();
            let accumulatedText = "";
            let responseChunks = 0;

            // Stream processing updates to client
            const progressInterval = setInterval(() => {
              if (responseChunks > 0) {
                controller.enqueue(
                  new TextEncoder().encode(
                    JSON.stringify({
                      progress: `Processing${".".repeat(responseChunks % 4)}`,
                    }) + "\n"
                  )
                );
              }
            }, 500);

            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                clearInterval(progressInterval);
                break;
              }

              // Convert the chunk to text
              const chunk = new TextDecoder().decode(value);
              responseChunks++;

              try {
                // Parse the chunk as a JSON object
                const jsonChunk = JSON.parse(chunk);

                if (jsonChunk.response) {
                  accumulatedText += jsonChunk.response;
                }
              } catch (error) {
                console.error("Error parsing chunk:", error);
              }
            }

            // Send processing message
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({
                  progress: "AI generation complete, processing result...",
                }) + "\n"
              )
            );

            let extractedJson = accumulatedText.trim();

            // Extract JSON if wrapped in code blocks
            const jsonMatch =
              extractedJson.match(/```json\s*([\s\S]*?)\s*```/) ||
              extractedJson.match(/```\s*([\s\S]*?)\s*```/);

            if (jsonMatch) {
              extractedJson = jsonMatch[1].trim();
            }

            // Clean up the JSON
            if (extractedJson.startsWith("{")) {
              extractedJson = extractedJson.substring(
                extractedJson.indexOf("{"),
                extractedJson.lastIndexOf("}") + 1
              );
            }

            try {
              // Parse the JSON to validate
              const cvData: CVData = JSON.parse(extractedJson);

              // Fill in default values for required fields
              if (!cvData.firstName || cvData.firstName.trim() === "") {
                cvData.firstName = "Anonymous";
              }

              if (!cvData.lastName || cvData.lastName.trim() === "") {
                cvData.lastName = "User";
              }

              if (!cvData.email || cvData.email.trim() === "") {
                cvData.email = "no-email@example.com";
              }

              // Process other fields
              if (!cvData.about || cvData.about.trim() === "") {
                cvData.about = "No information provided";
              }

              if (cvData.projects) {
                cvData.projects = cvData.projects.map((project) => ({
                  ...project,
                  description: project.description || "No description provided",
                  technologies: project.technologies || [],
                }));
              }

              if (cvData.experience) {
                cvData.experience = cvData.experience.map((exp) => {
                  if (exp.projects) {
                    exp.projects = exp.projects.map((project) => ({
                      ...project,
                      description:
                        project.description || "No description provided",
                      technologies: project.technologies || [],
                    }));
                  }
                  return exp;
                });
              }

              // Send the formatted message
              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    progress: "Formatting CV data...",
                  }) + "\n"
                )
              );

              // Send the actual data as a proper JSON object
              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    data: cvData,
                  }) + "\n"
                )
              );
            } catch (error) {
              console.error("Error parsing final JSON:", error);
              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    error: "Failed to parse generated CV data",
                    raw: extractedJson,
                  }) + "\n"
                )
              );
            }
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({
                error: "Error during streaming",
              }) + "\n"
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    // Return streaming response
    return new Response(stream, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Server error while generating CV data" },
      { status: 500 }
    );
  }
}
