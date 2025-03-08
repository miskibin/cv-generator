export const projectAnalysisPrompt = (
  repoName: string,
  description: string | null,
  languages: string[],
  readmeContent: string,
  packageJson?: any,
  configFiles?: string[],
  pythonDependencies?: string[]
) => `
I have a GitHub project with the following details:
- Name: ${repoName}
- Description: ${description || "No description provided"}
- Languages detected: ${languages.join(", ")}
${
  packageJson
    ? `- Dependencies: ${Object.keys(packageJson.dependencies || {}).join(", ")}
- DevDependencies: ${Object.keys(packageJson.devDependencies || {}).join(", ")}`
    : ""
}
${
  configFiles && configFiles.length > 0
    ? `- Config files: ${configFiles.join(", ")}`
    : ""
}
${
  pythonDependencies && pythonDependencies.length > 0
    ? `- Python dependencies: ${pythonDependencies.join(", ")}`
    : ""
}

Here's the README content:
${readmeContent.substring(0, 4000)}

Based on this information, please:
1. Write a concise but informative description of this project (2-3 sentences maximum)
2. Extract ONLY the most crucial technologies, frameworks, and tools used in this project

IMPORTANT GUIDELINES FOR TECHNOLOGIES:
- Focus ONLY on the main, core technologies that define the project's stack
- Include only major frameworks, languages, and platforms (e.g., React, Node.js, Django, TensorFlow)
- Limit the list to 3-8 most important technologies
- EXCLUDE minor packages and libraries like react-markdown, axios, lodash, etc.
- Exclude build tools and non-essential dev dependencies
- Normalize technology names using these conventions:
  * JavaScript (not "JS", "javascript", "js")
  * TypeScript (not "TS", "typescript", "ts")
  * React (not "ReactJS", "React.js")
  * Node.js (not "Node", "NodeJS", "nodejs")
  * Next.js (not "NextJS", "nextjs")
  * Express (not "ExpressJS", "Express.js")
  * PostgreSQL (not "Postgres")
  * MongoDB (not "Mongo")
  * HTML (not "HTML5")
  * CSS (not "CSS3")
  * Vue (not "Vue.js", "VueJS")
- First letter should be capitalized for all technologies

Return your response in this exact JSON format:
{
  "description": "Your concise description here",
  "technologies": ["Tech1", "Tech2", "Tech3", ...]
}

Provide only the JSON without any additional text. Make sure the technologies list is sorted alphabetically.
`;
