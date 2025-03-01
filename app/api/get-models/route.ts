import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("http://localhost:11434/api/tags", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch models from Ollama");
    }

    const data = await response.json();

    // Extract just the model names from the response
    const modelNames = data.models?.map((model: any) => model.name) || [];

    return NextResponse.json({ models: modelNames });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch models",
      },
      { status: 500 }
    );
  }
}
