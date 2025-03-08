import { NextResponse } from "next/server";
import { fetchUserRepositories } from "./github-api";
import { processRepository } from "./project-processor";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch repositories data
    const data = await fetchUserRepositories(username, 8);

    // Check for GraphQL errors
    if (data.errors) {
      const errorMessage = data.errors[0]?.message || "GraphQL query failed";
      console.error("GitHub GraphQL API error:", data.errors);

      if (errorMessage.toLowerCase().includes("rate limit")) {
        return NextResponse.json(
          { error: "GitHub API rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    // Check if the user exists and has repositories
    if (!data.data?.user?.repositories?.nodes) {
      return NextResponse.json(
        { error: "GitHub user not found or has no repositories" },
        { status: 404 }
      );
    }

    const repos = data.data.user.repositories.nodes;

    // Process all repositories concurrently
    const projectPromises = repos.map(async (repo: any) => {
      try {
        return await processRepository(repo, username);
      } catch (repoError) {
        console.error(`Error processing repo ${repo.name}:`, repoError);
        return null;
      }
    });

    // Wait for all repositories to be processed and filter out failures
    const projects = (await Promise.all(projectPromises)).filter(Boolean);

    return NextResponse.json({ projects });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching GitHub projects:", error);

    const status = errorMessage.includes("rate limit") ? 429 : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}
