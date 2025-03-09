import { NextResponse } from "next/server";
import { CVData } from "@/types/cv";
import { getTypeDefinitions } from "@/utils/typeToString";
import { generateWithTogether } from "@/utils/together-api";

// Utility function to score projects against job requirements
function scoreProjectRelevance(project: any, jobRequirements: string): number {
  if (!project || !jobRequirements) return 0;

  const jobText = jobRequirements.toLowerCase();
  let score = 0;

  // Project name relevance
  if (project.name && jobText.includes(project.name.toLowerCase())) {
    score += 10;
  }

  // Description relevance - check for keyword matches
  if (project.description) {
    const descriptionLower = project.description.toLowerCase();
    // Split job requirements into words and check for matches
    const jobKeywords = jobText.split(/\W+/).filter((word) => word.length > 3);

    for (const keyword of jobKeywords) {
      if (descriptionLower.includes(keyword.toLowerCase())) {
        score += 5;
      }
    }
  }

  // Technologies relevance - highest weight factor
  if (project.technologies && Array.isArray(project.technologies)) {
    for (const tech of project.technologies) {
      if (jobText.includes(tech.toLowerCase())) {
        score += 15; // Higher score for technology matches
      }
    }
  }

  return score;
}

/**
 * Generate a tailored About section based on user data and job requirements
 */
async function generateEnhancedAboutSection(
  userAbout: string | undefined,
  jobRequirements: string | undefined,
  model: string
): Promise<string> {
  // If no user data or job requirements, return original or empty
  if (!userAbout && !jobRequirements) return userAbout || "";
  if (!jobRequirements) return userAbout || "";

  // Create a specialized prompt for generating the About section
  const aboutPrompt = `
You are a professional CV writer specializing in creating personalized "About" sections.

${
  userAbout
    ? `USER PROVIDED ABOUT SECTION:
${userAbout}`
    : "The user hasn't provided an about section."
}

JOB REQUIREMENTS:
${jobRequirements}

TASK:
Create a concise, professional "About" section (3-5 sentences) that:
1. Maintains the user's original voice, tone, and key personal details
2. Subtly incorporates relevant skills/experience that match the job requirements
3. Positions the candidate as an ideal fit for the role without being too obvious
4. Sounds completely natural and human-written, not AI-generated
5. Uses first-person perspective
6. Avoids clichés and generic statements

IMPORTANT:
- If the user provided their own About section, use it as the foundation and enhance it
- If no user About section exists, create one that feels authentic based on the job requirements
- The final text should be 100-150 words and focus on relevant professional qualities
- DO NOT use phrases like "I am passionate about" or "I am a dedicated professional"
- Return ONLY the About section text with no additional formatting or explanation
`;

  try {
    // Generate enhanced About section
    const aboutResponse = await generateWithTogether(aboutPrompt, {
      temperature: 0.7,
      max_tokens: 300,
    });

    // Clean up the response
    let enhancedAbout = aboutResponse.trim();

    // Remove any markdown code blocks if present
    if (enhancedAbout.startsWith("```") && enhancedAbout.endsWith("```")) {
      enhancedAbout = enhancedAbout
        .replace(/```(?:markdown|text)?\s*/, "")
        .replace(/\s*```$/, "");
    }

    return enhancedAbout;
  } catch (error) {
    console.error("Error generating enhanced About section:", error);
    // Fall back to the original about section
    return userAbout || "";
  }
}

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
5. CRITICAL: For GitHub projects, carefully analyze the job requirements and SELECT ONLY THE 4 MOST RELEVANT PROJECTS that:
   - Use technologies mentioned in the job description
   - Demonstrate skills required by the job
   - Solve problems similar to what the job entails
   - Each project should directly relate to at least one key requirement in the job description
   - Do NOT rely on the order you receive projects - evaluate each one individually against the job requirements
`
      : `
No specific job requirements provided. Create a general-purpose professional CV with up to 4 of the most impressive projects.
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
4. CRITICAL INSTRUCTION FOR PROJECTS: When job requirements are provided, you must carefully analyze ALL available projects and include ONLY THE 4 PROJECTS THAT ARE MOST RELEVANT to the specific job requirements. Consider technologies used, problems solved, and skills demonstrated. DO NOT choose projects based on their order or presentation - evaluate each one on its match to the job requirements.

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
- For project selection, carefully match each project against job requirements and choose the 4 most relevant ones
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
CRITICAL: For project selection, I need you to carefully analyze the job requirements and include ONLY the 4 projects that most directly match the required skills, technologies, and responsibilities. Do not simply pick the first 4 projects - evaluate each project's relevance to the job.
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
                let finalJson: string = llmResponse || "{}";

                // Try to find JSON in code block first
                const codeBlockMatch = finalJson.match(
                  /```(?:json)?\s*([\s\S]*?)\s*```/
                );
                if (codeBlockMatch && codeBlockMatch[1]) {
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

                // Generate enhanced about section if job requirements exist
                let enhancedAbout: string | undefined;

                if (jobRequirements) {
                  controller.enqueue(
                    new TextEncoder().encode(
                      JSON.stringify({
                        status: "Tailoring your About section to the job...",
                      }) + "\n"
                    )
                  );

                  // Use either manual data's about section or the AI-generated one as the base
                  const baseAbout = manualData?.about || cvData.about;

                  enhancedAbout = await generateEnhancedAboutSection(
                    baseAbout,
                    jobRequirements,
                    model
                  );
                }

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

                    // Use the enhanced about section if available, otherwise fall back
                    about: enhancedAbout || manualData.about || cvData.about,

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

                    // Project selection logic - prioritize based on job requirements if provided
                    projects: jobRequirements
                      ? manualData.projects && manualData.projects.length > 0
                        ? // When we have both job requirements and manual projects,
                          // sort manual projects by relevance to job requirements
                          [...manualData.projects]
                            .sort((a, b) => {
                              const scoreA = scoreProjectRelevance(
                                a,
                                jobRequirements
                              );
                              const scoreB = scoreProjectRelevance(
                                b,
                                jobRequirements
                              );
                              return scoreB - scoreA; // Higher score first
                            })
                            .slice(0, 4)
                        : // When we have job requirements but no manual projects, use AI projects
                        cvData.projects?.length
                        ? cvData.projects.slice(0, 4)
                        : []
                      : // No job requirements - use manual projects first, fall back to AI projects
                      manualData.projects?.length
                      ? manualData.projects.slice(0, 4)
                      : cvData.projects?.slice(0, 4),

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

                    // Use enhanced about if available
                    about: enhancedAbout || cvData.about?.trim() || "",

                    // Only include other fields if they exist
                    ...(cvData.github ? { github: cvData.github } : {}),
                    ...(cvData.phone ? { phone: cvData.phone } : {}),
                    ...(cvData.linkedin ? { linkedin: cvData.linkedin } : {}),
                    ...(cvData.about ? { about: cvData.about?.trim() } : {}),
                    ...(cvData.skills ? { skills: cvData.skills } : {}),
                    ...(cvData.languages
                      ? { languages: cvData.languages }
                      : {}),

                    // Process projects if they exist - LIMITED TO 4 MOST RELEVANT ones
                    // We're relying on AI to rank projects by relevance already
                    ...(cvData.projects
                      ? {
                          projects: cvData.projects.slice(0, 4).map((p) => ({
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
