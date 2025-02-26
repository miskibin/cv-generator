import { CVData } from "@/types/cv";

/**
 * Process a streaming response from Ollama
 */
export async function processOllamaStream(
  controller: ReadableStreamDefaultController,
  ollamaResponse: Response
): Promise<CVData | null> {
  if (!ollamaResponse.body) {
    throw new Error("Ollama response body is null");
  }

  controller.enqueue(
    new TextEncoder().encode(
      JSON.stringify({
        progress: "Connected to AI model, generating CV data...",
      }) + "\n"
    )
  );

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

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Convert the chunk to text
      const chunk = new TextDecoder().decode(value);
      responseChunks++;

      try {
        const jsonChunk = JSON.parse(chunk);
        if (jsonChunk.response) {
          accumulatedText += jsonChunk.response;
        }
      } catch (error) {
        console.error("Error parsing chunk:", error);
      }
    }

    // Extract and clean the JSON response
    return await extractAndValidateJSON(controller, accumulatedText);
  } finally {
    clearInterval(progressInterval);
  }
}

/**
 * Send a request to the Ollama API
 */
export async function callOllamaAPI(
  prompt: string,
  controller: ReadableStreamDefaultController
): Promise<CVData | null> {
  controller.enqueue(
    new TextEncoder().encode(
      JSON.stringify({
        progress: "Initializing CV generation...",
      }) + "\n"
    )
  );

  const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.2",
      prompt: prompt,
      stream: true,
      options: {
        temperature: 0.7,
        top_p: 0.9,
      },
    }),
  });

  if (!ollamaResponse.ok) {
    const errorText = await ollamaResponse.text();
    console.error("Ollama API error:", errorText);
    throw new Error("Failed to communicate with Ollama API");
  }

  return await processOllamaStream(controller, ollamaResponse);
}

/**
 * Extract and validate the JSON response
 */
async function extractAndValidateJSON(
  controller: ReadableStreamDefaultController,
  accumulatedText: string
): Promise<CVData | null> {
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
    return enhanceCVData(cvData);
  } catch (error) {
    console.error("Error parsing final JSON:", error);
    throw new Error("Failed to parse generated CV data");
  }
}

/**
 * Enhance CV data with defaults and validation
 */
function enhanceCVData(cvData: CVData): CVData {
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
          description: project.description || "No description provided",
          technologies: project.technologies || [],
        }));
      }
      return exp;
    });
  }

  return cvData;
}
