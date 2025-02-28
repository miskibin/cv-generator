import { NextResponse } from "next/server";
import { CVData } from "@/types/cv";
import { getTypeDefinitions } from "@/utils/typeToString";

export async function POST(request: Request) {
  try {
    const { text, manualData, jobRequirements } = await request.json();

    // If we have manual data, use that directly with AI filling only the blanks
    const hasManualData = manualData && Object.keys(manualData).length > 0;

    // If neither text nor manualData is provided
    if ((!text || typeof text !== "string") && !hasManualData) {
      return NextResponse.json(
        { error: "Invalid input: text or manualData is required" },
        { status: 400 }
      );
    }

    // Create prompt with type definitions - adjusted for manual data and job requirements
    const jobRequirementsSection = jobRequirements
      ? `
JOB REQUIREMENTS:
${jobRequirements}

Your task is to tailor the CV to highlight experiences, skills and qualifications that best match these job requirements.
Make the CV more relevant by:
1. Emphasizing skills mentioned in the job requirements
2. Prioritizing relevant experience
3. Using appropriate keywords from the job description
4. Adjusting the summary/about section to position the candidate for this specific role
`
      : `
No specific job requirements provided. Create a general-purpose professional CV.
`;

    const prompt = hasManualData
      ? `
You are a CV assistant that helps complete professional CV data in JSON format.
I have already filled in some data, but need you to enhance and complete the missing parts.

ALREADY FILLED DATA:
${JSON.stringify(manualData, null, 2)}

USER ADDITIONAL INFO:
${text || "No additional info provided."}

${jobRequirementsSection}

Please generate a complete JSON object that follows this TypeScript interface:

${getTypeDefinitions()}

Do NOT change or remove any data I've already provided!
Only add missing information or enhance existing data to better match the job requirements.
Only respond with valid, well-structured JSON that matches this format.
Do not include any other text in your response.
For dates, use formats like "June 2019" or "March 2022 - Present".
`
      : `
You are a CV assistant that helps create professional CV data in JSON format.
Based on the following information from the user, create a complete CV data structure.

USER INPUT:
${text}

${jobRequirementsSection}

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
            const initialStatus = jobRequirements
              ? "Tailoring your CV to match job requirements..."
              : hasManualData
              ? "Enhancing your CV data..."
              : "Working on your CV...";

            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({
                  status: initialStatus,
                }) + "\n"
              )
            );

            // If we only have manual data with required fields and no AI is needed,
            // just return the manual data directly
            if (
              hasManualData &&
              manualData.firstName &&
              manualData.lastName &&
              manualData.email &&
              !text &&
              !jobRequirements
            ) {
              // Small delay to show processing
              await new Promise((resolve) => setTimeout(resolve, 500));

              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    result: manualData,
                    status: "Complete",
                  }) + "\n"
                )
              );

              controller.close();
              return;
            }

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

                // Apply defaults only for missing fields
                const enhancedData: CVData = {
                  firstName: cvData.firstName?.trim() || "Anonymous",
                  lastName: cvData.lastName?.trim() || "User",
                  email: cvData.email?.trim() || "no-email@example.com",
                  // Only include other fields if they exist
                  ...(cvData.github ? { github: cvData.github } : {}),
                  ...(cvData.phone ? { phone: cvData.phone } : {}),
                  ...(cvData.linkedin ? { linkedin: cvData.linkedin } : {}),
                  ...(cvData.about ? { about: cvData.about?.trim() } : {}),
                  ...(cvData.skills ? { skills: cvData.skills } : {}),
                  ...(cvData.languages ? { languages: cvData.languages } : {}),

                  // Process projects if they exist
                  ...(cvData.projects
                    ? {
                        projects: cvData.projects.map((p) => ({
                          ...p,
                          description:
                            p.description || "No description provided",
                          technologies: p.technologies || [],
                        })),
                      }
                    : {}),

                  // Process experience if it exists
                  ...(cvData.experience
                    ? {
                        experience: cvData.experience.map((exp) => ({
                          ...exp,
                          projects: exp.projects?.map((p) => ({
                            ...p,
                            description:
                              p.description || "No description provided",
                            technologies: p.technologies || [],
                          })),
                        })),
                      }
                    : {}),

                  // Process education if it exists
                  ...(cvData.education ? { education: cvData.education } : {}),
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
