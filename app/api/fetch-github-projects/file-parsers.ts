// Parse Python requirements.txt to extract dependencies
export function parseRequirements(content: string): string[] {
  if (!content) return [];

  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("-"))
    .map((line) => {
      // Extract package name from lines like "package==1.0.0" or "package>=1.0.0"
      const match = line.match(/^([a-zA-Z0-9_.-]+)(?:[=<>~!]+.*)?$/);
      return match ? match[1] : null;
    })
    .filter(Boolean) as string[];
}

// Parse Python pyproject.toml to extract dependencies (simplified)
export function parsePyprojectToml(content: string): string[] {
  if (!content) return [];

  const dependencies: string[] = [];

  // Look for [tool.poetry.dependencies] or [project.dependencies] sections
  const depsMatch = content.match(
    /\[(tool\.poetry\.dependencies|project\.dependencies)\]([\s\S]*?)(\[|$)/
  );
  if (depsMatch && depsMatch[2]) {
    const depsSection = depsMatch[2];
    // Simple regex to match dependency names
    const depMatches = depsSection.matchAll(/([a-zA-Z0-9_-]+)\s*=/g);
    for (const match of depMatches) {
      if (match[1] && match[1] !== "python") {
        dependencies.push(match[1]);
      }
    }
  }

  return dependencies;
}
