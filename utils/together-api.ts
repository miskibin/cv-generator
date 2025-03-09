import Together from "together-ai";

// Initialize the Together client
const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});

/**
 * Generate a completion using the Together API
 * @param prompt The prompt to send to the Together API
 * @param options Optional parameters for the API call
 * @returns The generated text
 */
export async function generateWithTogether(
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }
) {
  if (!process.env.TOGETHER_API_KEY) {
    throw new Error("TOGETHER_API_KEY is not defined in environment variables");
  }

  const model =
    options?.model || "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free";
  const temperature = options?.temperature || 0.7;
  const max_tokens = options?.max_tokens || 1024;

  try {
    // Use the chat completions API which is more versatile
    const response = await together.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that provides accurate and concise information.",
        },
        { role: "user", content: prompt },
      ],
      temperature,
      max_tokens,
    });

    // Return the generated text from the response
    return response.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("Error calling Together API:", error);
    throw error;
  }
}
