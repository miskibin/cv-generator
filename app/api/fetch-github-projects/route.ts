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

    // Process repositories
    const projects = [];
    for (const repo of repos) {
      try {
        const project = await processRepository(repo, username);
        if (project) projects.push(project);
      } catch (error) {
        console.error(`Error processing repo ${repo.name}`);
      }
    }

    return NextResponse.json({ projects });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
