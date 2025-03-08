import { Project } from "@/types/cv";
import { fetchFile } from "./github-api";
import { parseRequirements, parsePyprojectToml } from "./file-parsers";
import { generateWithTogether } from "@/utils/together-api";
import { projectAnalysisPrompt } from "./prompts";

// Determine which config files to check based on repository languages
export function getRelevantConfigFiles(languages: string[]): string[] {
  const configFiles: string[] = [];

  const jsRelated = languages.some((lang) =>
    ["JavaScript", "TypeScript", "JSX", "TSX"].includes(lang)
  );

  const pythonRelated = languages.some((lang) => ["Python"].includes(lang));

  const rubyRelated = languages.some((lang) => ["Ruby"].includes(lang));

  const goRelated = languages.some((lang) => ["Go"].includes(lang));

  // Only check for JS/TS config files if the repo has JS/TS
  if (jsRelated) {
    configFiles.push(
      "package.json",
      "tsconfig.json",
      ".eslintrc",
      ".eslintrc.js",
      ".eslintrc.json",
      "webpack.config.js",
      "vite.config.js",
      "next.config.js"
    );
  }

  // Only check for Python config files if the repo has Python
  if (pythonRelated) {
    configFiles.push("requirements.txt", "pyproject.toml", "setup.py");
  }

  if (rubyRelated) {
    configFiles.push("Gemfile");
  }

  if (goRelated) {
    configFiles.push("go.mod");
  }

  // Always check for these common files
  configFiles.push(
    "Dockerfile",
    "docker-compose.yml",
    ".github/workflows/main.yml",
    "Jenkinsfile"
  );

  return configFiles;
}

// Process a single repo to extract project details
export async function processRepository(
  repo: any,
  username: string
): Promise<Project> {
  // Extract data from GraphQL response
  const languages = repo.languages.nodes.map((lang: any) => lang.name);

  // Get README content from GraphQL response
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
  if (
    readmeContent ||
    projectData.packageJson ||
    projectData.pythonDependencies.length > 0
  ) {
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

  // Only check relevant config files based on languages
  const filesToCheck = getRelevantConfigFiles(languages);

  // Check for package.json if it's a JS/TS project
  if (languages.some((lang) => ["JavaScript", "TypeScript"].includes(lang))) {
    try {
      const packageJsonContent = await fetchFile(
        repo,
        username,
        "package.json"
      );
      if (packageJsonContent) {
        packageJson = JSON.parse(packageJsonContent);
      }
    } catch (error) {
      console.error(`Error parsing package.json for ${repo.name}:`, error);
    }
  }

  // Check for Python files if it's a Python project
  if (languages.includes("Python")) {
    try {
      // Check for requirements.txt
      const requirementsContent = await fetchFile(
        repo,
        username,
        "requirements.txt"
      );
      if (requirementsContent) {
        pythonDependencies = [
          ...pythonDependencies,
          ...parseRequirements(requirementsContent),
        ];
      }

      // Check for pyproject.toml
      const pyprojectContent = await fetchFile(
        repo,
        username,
        "pyproject.toml"
      );
      if (pyprojectContent) {
        pythonDependencies = [
          ...pythonDependencies,
          ...parsePyprojectToml(pyprojectContent),
        ];
      }
    } catch (error) {
      console.error(
        `Error parsing Python project files for ${repo.name}:`,
        error
      );
    }
  }

  // Check for other config files but limit to relevant ones
  const configFilePromises = filesToCheck
    .slice(0, 5)
    .map((file) =>
      fetchFile(repo, username, file).then((content) => (content ? file : null))
    );

  const configFilesResults = await Promise.all(configFilePromises);
  configFiles = configFilesResults.filter(Boolean) as string[];

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
    // Generate prompt with all available information
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

    // Extract JSON from response
    const jsonMatch = llmResult.match(/({[\s\S]*})/);
    if (jsonMatch) {
      try {
        const parsedResult = JSON.parse(jsonMatch[0]);

        // Update the project with Together API-provided data
        if (parsedResult.description) {
          project.description = parsedResult.description;
        }

        if (
          parsedResult.technologies &&
          Array.isArray(parsedResult.technologies) &&
          parsedResult.technologies.length > 0
        ) {
          // Merge technologies from API and Together API without duplicates
          const allTechnologies = new Set([
            ...project.technologies,
            ...parsedResult.technologies,
          ]);
          project.technologies = Array.from(allTechnologies);
        }

        return project;
      } catch (parseError) {
        console.error(
          `Error parsing Together API response for ${project.name}:`,
          parseError
        );
      }
    }
  } catch (llmError) {
    console.error(`Error using Together API for ${project.name}:`, llmError);
  }

  return null;
}
