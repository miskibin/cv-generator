import { Project } from "@/types/cv";
import { fetchFile } from "./github-api";
import { parseRequirements, parsePyprojectToml } from "./file-parsers";
import { generateWithTogether } from "@/utils/together-api";
import { projectAnalysisPrompt } from "./prompts";

// Determine which config files to check based on repository languages
export function getRelevantConfigFiles(languages: string[]): string[] {
  const configFiles: string[] = [];

  // Check for JS/TS config files
  if (languages.some((lang) => ["JavaScript", "TypeScript"].includes(lang))) {
    configFiles.push("package.json");
  }

  // Check for Python config files
  if (languages.includes("Python")) {
    configFiles.push("requirements.txt", "pyproject.toml");
  }

  return configFiles;
}

// Process a single repo to extract project details
export async function processRepository(
  repo: any,
  username: string
): Promise<Project> {
  // Extract data from GraphQL response
  const languages = repo.languages.nodes.map((lang: any) => lang.name);

  // Get README content
  let readmeContent = "";
  if (repo.object?.text) {
    readmeContent = repo.object.text;
  } else if (repo.readmeLower?.text) {
    readmeContent = repo.readmeLower.text;
  }

  // Process additional files
  const projectData = await fetchAdditionalFiles(repo, username, languages);

  // Create base project object
  let processedProject: Project = {
    name: repo.name,
    description: repo.description || "A GitHub repository",
    technologies: languages,
    github: repo.url,
    url: repo.homepageUrl || repo.url,
    stars: repo.stargazerCount,
    forks: repo.forkCount,
  };

  // Enhance with LLM if we have enough data
  if (readmeContent) {
    const enhancedProject = await enhanceProjectWithLLM(
      processedProject,
      readmeContent,
      projectData
    );

    if (enhancedProject) {
      processedProject = enhancedProject;
    }
  }

  return processedProject;
}

// Fetch additional repo files
async function fetchAdditionalFiles(
  repo: any,
  username: string,
  languages: string[]
) {
  const githubToken = process.env.GITHUB_TOKEN;
  let packageJson = null;
  let pythonDependencies: string[] = [];
  let configFiles: string[] = [];

  if (!githubToken) {
    return { packageJson, pythonDependencies, configFiles };
  }

  // Get only the most important config files
  const filesToCheck = getRelevantConfigFiles(languages);

  // Check for package.json
  if (filesToCheck.includes("package.json")) {
    try {
      const packageJsonContent = await fetchFile(
        repo,
        username,
        "package.json"
      );
      if (packageJsonContent) {
        packageJson = JSON.parse(packageJsonContent);
        configFiles.push("package.json");
      }
    } catch (error) {
      // Silently fail
    }
  }

  // Check for Python files
  if (filesToCheck.includes("requirements.txt")) {
    const requirementsContent = await fetchFile(
      repo,
      username,
      "requirements.txt"
    );
    if (requirementsContent) {
      pythonDependencies = parseRequirements(requirementsContent);
      configFiles.push("requirements.txt");
    }
  }

  if (filesToCheck.includes("pyproject.toml")) {
    const pyprojectContent = await fetchFile(repo, username, "pyproject.toml");
    if (pyprojectContent) {
      pythonDependencies = [
        ...pythonDependencies,
        ...parsePyprojectToml(pyprojectContent),
      ];
      configFiles.push("pyproject.toml");
    }
  }

  return { packageJson, pythonDependencies, configFiles };
}

// Enhance project with LLM analysis
async function enhanceProjectWithLLM(
  project: Project,
  readmeContent: string,
  projectData: {
    packageJson: any;
    configFiles: string[];
    pythonDependencies: string[];
  }
): Promise<Project | null> {
  try {
    // Generate prompt
    const prompt = projectAnalysisPrompt(
      project.name,
      project.description,
      project.technologies,
      readmeContent || "No README found",
      projectData.packageJson,
      projectData.configFiles,
      projectData.pythonDependencies
    );

    // Use Together API to analyze the project
    const llmResult = await generateWithTogether(prompt, {
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
      temperature: 0.1,
      max_tokens: 1024,
    });

    // Extract JSON from response if llmResult is not null
    if (!llmResult) return project;

    const jsonMatch = llmResult.match(/({[\s\S]*})/);
    if (jsonMatch) {
      const parsedResult = JSON.parse(jsonMatch[0]);

      // Update project with LLM data
      if (parsedResult.description) {
        project.description = parsedResult.description;
      }

      if (
        parsedResult.technologies &&
        Array.isArray(parsedResult.technologies)
      ) {
        project.technologies = parsedResult.technologies;
      }

      return project;
    }
  } catch (error) {
    // Silently fail and return original project
  }

  return project;
}
