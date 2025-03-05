import { NextResponse } from "next/server";
import { CVData } from "@/types/cv";
import { getTypeDefinitions } from "@/utils/typeToString";
import { generateWithTogether } from "@/utils/together-api";

export async function POST(request: Request) {
  try {
    const {
      text,
      manualData,
      jobRequirements,
      model = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free", // Default to Llama 3
    } = await request.json();

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

    // Enhanced prompt for manual data - explicitly instructing to preserve structure and values
    const prompt = hasManualData
      ? `
You are a CV assistant that helps complete professional CV data in JSON format.
I have already filled in some data manually, and I need you to PRESERVE ALL MY EXISTING DATA while enhancing only what's missing.

IMPORTANT: NEVER modify or remove any data I've already provided. Your job is only to:
1. Fill in completely empty fields
2. Enhance fields that need more detail WHILE keeping my original content
3. If job requirements are provided, tailor additions to match those requirements

MY MANUALLY ENTERED DATA (DO NOT CHANGE THIS):
${JSON.stringify(manualData, null, 2)}

USER ADDITIONAL INFO:
${text || "No additional info provided."}

${jobRequirementsSection}

Please generate a complete JSON object that follows this TypeScript interface:

${getTypeDefinitions()}

INSTRUCTIONS:
- Return ONLY valid, well-structured JSON that matches the TypeScript interface
- For user-provided fields (education, experience, projects), maintain their exact structure and values
- Only add new entries to arrays (like skills, education, etc.) if needed, don't modify existing ones
- For dates, use formats like "June 2019" or "March 2022 - Present"
- If I provided a field, even partially, preserve it exactly as is
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
            // More detailed status updates based on input mode
            const initialStatus = hasManualData
              ? jobRequirements
                ? "Tailoring your manually entered CV to match job requirements..."
                : "Enhancing your manually entered CV data..."
              : jobRequirements
              ? "Creating a tailored CV from your description..."
              : "Creating your CV from description...";

            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({
                  status: initialStatus,
                }) + "\n"
              )
            );

            // Check if manual data is complete enough to skip AI processing
            // This is a bit more sophisticated than before - checking for meaningful content
            const isManualDataComplete =
              hasManualData &&
              manualData.firstName?.trim() &&
              manualData.lastName?.trim() &&
              manualData.email?.trim() &&
              manualData.about?.trim() &&
              (!jobRequirements || jobRequirements.trim() === "") &&
              (manualData.skills?.length > 0 ||
                manualData.experience?.length > 0 ||
                manualData.projects?.length > 0);

            if (isManualDataComplete && !text) {
              // Show processing feedback
              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    status: "Manual data is complete. Finalizing your CV...",
                  }) + "\n"
                )
              );

              // Small delay to show processing
              await new Promise((resolve) => setTimeout(resolve, 700));

              // Make a shallow copy to avoid reference issues
              const processedData = JSON.parse(JSON.stringify(manualData));

              // Apply minimal processing to ensure valid data structure
              if (!processedData.skills) processedData.skills = [];
              if (!processedData.languages) processedData.languages = {};

              // Ensure projects have technologies array
              if (processedData.projects) {
                processedData.projects = processedData.projects.map(
                  (project: any) => ({
                    ...project,
                    technologies: project.technologies || [],
                  })
                );
              }

              // Ensure experiences have consistent structure
              if (processedData.experience) {
                processedData.experience = processedData.experience.map(
                  (exp: any) => ({
                    ...exp,
                    projects: exp.projects
                      ? exp.projects.map((p: any) => ({
                          ...p,
                          technologies: p.technologies || [],
                        }))
                      : undefined,
                  })
                );
              }

              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    result: processedData,
                    status: "Complete",
                  }) + "\n"
                )
              );

              controller.close();
              return;
            }

            // Update status for AI processing
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({
                  status: hasManualData
                    ? "Analyzing your data and enhancing your CV..."
                    : "Creating your CV from scratch...",
                }) + "\n"
              )
            );

            // Send request to Together API with the selected model
            console.log("Sending request to Together API with model:", model);

            try {
              // Use our Together API utility
              const llmResponse = await generateWithTogether(prompt, {
                // model: model,
                temperature: hasManualData ? 0.4 : 0.7, // Lower temperature for manual data
                max_tokens: 4096, // Allow longer responses for complete CV
              });

              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    status: "Processing AI response...",
                  }) + "\n"
                )
              );

              try {
                // Extract final JSON (either from code block or directly)
                let finalJson = llmResponse;

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

                // Create the final result - prioritizing manual data fields over AI-generated ones
                let enhancedData: CVData;

                if (hasManualData) {
                  // When we have manual data, use it as the base and carefully merge AI additions
                  enhancedData = {
                    // Start with manual data as the base
                    ...manualData,

                    // Always ensure these fields exist
                    firstName:
                      manualData.firstName || cvData.firstName || "Anonymous",
                    lastName: manualData.lastName || cvData.lastName || "User",
                    email:
                      manualData.email ||
                      cvData.email ||
                      "no-email@example.com",

                    // Carefully merge AI-generated content for these fields
                    about: manualData.about || cvData.about,

                    // For skills, combine both but avoid duplicates
                    skills: [
                      ...(manualData.skills || []),
                      ...(cvData.skills || []).filter(
                        (skill) => !manualData.skills?.includes(skill)
                      ),
                    ],

                    // For languages, prioritize manual values
                    languages: {
                      ...(cvData.languages || {}),
                      ...(manualData.languages || {}),
                    },

                    // For arrays of objects like projects, education, and experience:
                    // - Keep all manual entries
                    // - Add AI entries only if they seem unique

                    // Handle projects
                    projects: manualData.projects?.length
                      ? manualData.projects
                      : cvData.projects,

                    // Handle experience
                    experience: manualData.experience?.length
                      ? manualData.experience
                      : cvData.experience,

                    // Handle education
                    education: manualData.education?.length
                      ? manualData.education
                      : cvData.education,
                  };
                } else {
                  // For pure AI generation, use the AI result with minimal defaults
                  enhancedData = {
                    firstName: cvData.firstName?.trim() || "Anonymous",
                    lastName: cvData.lastName?.trim() || "User",
                    email: cvData.email?.trim() || "no-email@example.com",
                    // Only include other fields if they exist
                    ...(cvData.github ? { github: cvData.github } : {}),
                    ...(cvData.phone ? { phone: cvData.phone } : {}),
                    ...(cvData.linkedin ? { linkedin: cvData.linkedin } : {}),
                    ...(cvData.about ? { about: cvData.about?.trim() } : {}),
                    ...(cvData.skills ? { skills: cvData.skills } : {}),
                    ...(cvData.languages
                      ? { languages: cvData.languages }
                      : {}),

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
                    ...(cvData.education
                      ? { education: cvData.education }
                      : {}),
                  };
                }

                // Final status update before sending result
                controller.enqueue(
                  new TextEncoder().encode(
                    JSON.stringify({
                      status: "Finalizing your CV...",
                    }) + "\n"
                  )
                );

                // Send the final result
                controller.enqueue(
                  new TextEncoder().encode(
                    JSON.stringify({
                      result: enhancedData,
                      status: "Complete",
                    }) + "\n"
                  )
                );
              } catch (parseError) {
                console.error("Error parsing CV JSON:", parseError);
                controller.enqueue(
                  new TextEncoder().encode(
                    JSON.stringify({
                      error: "Failed to parse CV data",
                      status: "Error",
                      details:
                        parseError instanceof Error
                          ? parseError.message
                          : "Unknown parsing error",
                    }) + "\n"
                  )
                );
              }
            } catch (apiError) {
              console.error("Together API error:", apiError);
              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    error: "Failed to generate CV with Together API",
                    status: "Error",
                    details:
                      apiError instanceof Error
                        ? apiError.message
                        : "Unknown API error",
                  }) + "\n"
                )
              );
            }
          } catch (error) {
            console.error("General error in CV generation:", error);
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
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Server error while generating CV data" },
      { status: 500 }
    );
  }
}
