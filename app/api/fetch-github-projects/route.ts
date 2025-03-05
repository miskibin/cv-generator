import { NextResponse } from "next/server";
import { Project } from "@/types/cv";
import { generateWithTogether } from "@/utils/together-api";

// Decode base64 content from GitHub API
function decodeBase64(str: string): string {
  return Buffer.from(str, "base64").toString("utf-8");
}

export async function GET(request: Request) {
  console.log("📝 GitHub Projects API called with:", request.url);
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    console.log("❌ Error: Username is required");
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  try {
    console.log(`🔍 Fetching repositories for user: ${username}`);
    // Fetch user's repositories - get more than we need to ensure we find enough with stars
    const repoResponse = await fetch(
      `https://api.github.com/users/${username}/repos?sort=stars&per_page=20`
    );

    if (!repoResponse.ok) {
      if (repoResponse.status === 404) {
        console.log(`❌ GitHub user not found: ${username}`);
        return NextResponse.json(
          { error: "GitHub user not found" },
          { status: 404 }
        );
      }
      throw new Error(`GitHub API error: ${repoResponse.statusText}`);
    }

    const repos = await repoResponse.json();
    console.log(`✅ Found ${repos.length} repositories for ${username}`);

    // Sort by stars and take top 6
    const topRepos = repos
      .sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)
      .slice(0, 6);
    console.log(`📊 Selected top ${topRepos.length} repositories by stars`);

    // Process and extract relevant information for each top repository
    console.log(`🔄 Processing repositories and fetching READMEs...`);
    const projects = await Promise.all(
      topRepos.map(async (repo: any) => {
        console.log(
          `\n📁 Processing repo: ${repo.name} (${repo.stargazers_count} stars)`
        );

        // Get languages
        const languagesResponse = await fetch(repo.languages_url);
        const languagesData = languagesResponse.ok
          ? await languagesResponse.json()
          : {};
        const languages = Object.keys(languagesData);
        console.log(`🌐 Languages detected: ${languages.join(", ")}`);

        // Fetch README content
        let readmeContent = "";
        try {
          console.log(`📄 Attempting to fetch README.md for ${repo.name}...`);
          // Try to fetch the README (could be named different ways)
          const readmeResponse = await fetch(
            `https://api.github.com/repos/${username}/${repo.name}/contents/README.md`
          );

          if (readmeResponse.ok) {
            const readmeData = await readmeResponse.json();
            if (readmeData.content) {
              readmeContent = decodeBase64(readmeData.content);
              console.log(
                `✅ README.md found (${readmeContent.length} characters)`
              );
            }
          } else {
            console.log(
              `⚠️ README.md not found, trying lowercase readme.md...`
            );
            // Try alternative filenames if README.md doesn't exist
            const readmeLowerResponse = await fetch(
              `https://api.github.com/repos/${username}/${repo.name}/contents/readme.md`
            );
            if (readmeLowerResponse.ok) {
              const readmeData = await readmeLowerResponse.json();
              if (readmeData.content) {
                readmeContent = decodeBase64(readmeData.content);
                console.log(
                  `✅ readme.md found (${readmeContent.length} characters)`
                );
              }
            } else {
              console.log(`❌ No README found for ${repo.name}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error fetching README for ${repo.name}:`, error);
        }

        // Process with LLM if we have README content
        let processedProject: Project = {
          name: repo.name,
          description: repo.description || "A GitHub repository",
          technologies: languages,
          github: repo.html_url,
          url: repo.homepage || repo.html_url,
        };

        if (readmeContent) {
          try {
            console.log(
              `🧠 Sending README for ${repo.name} to Together API for analysis...`
            );

            const prompt = `
            I have a GitHub project with the following details:
            - Name: ${repo.name}
            - Description: ${repo.description || "No description provided"}
            - Languages detected: ${languages.join(", ")}
            
            Here's the README content:
            ${readmeContent.substring(
              0,
              4000
            )}  # Limit length to prevent token issues
            
            Based on this information, please:
            1. Write a concise but informative description of this project (2-3 sentences maximum)
            2. Extract a comprehensive list of technologies, frameworks, and tools used in this project
            
            Return your response in this exact JSON format:
            {
              "description": "Your concise description here",
              "technologies": ["Tech1", "Tech2", "Tech3", ...]
            }
            
            Provide only the JSON without any additional text.
            `;

            console.log("📤 Together API request:", {
              model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
              promptLength: prompt.length,
              temperature: 0.1,
            });

            // Use Together API to analyze the README
            const llmResult = await generateWithTogether(prompt, {
              model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
              temperature: 0.1,
              max_tokens: 1024,
            });

            console.log(
              `📝 Raw Together API result (first 100 chars): ${llmResult.substring(
                0,
                100
              )}...`
            );

            // Extract JSON from response
            const jsonMatch = llmResult.match(/({[\s\S]*})/);
            if (jsonMatch) {
              try {
                const parsedResult = JSON.parse(jsonMatch[0]);
                console.log(
                  `✅ Successfully parsed JSON from Together API response:`,
                  parsedResult
                );

                // Update the project with Together API-provided data
                if (parsedResult.description) {
                  processedProject.description = parsedResult.description;
                  console.log(
                    `📝 Updated description: ${parsedResult.description.substring(
                      0,
                      50
                    )}...`
                  );
                }

                if (
                  parsedResult.technologies &&
                  Array.isArray(parsedResult.technologies) &&
                  parsedResult.technologies.length > 0
                ) {
                  // Merge technologies from API and Together API without duplicates
                  const allTechnologies = new Set([
                    ...languages,
                    ...parsedResult.technologies,
                  ]);
                  processedProject.technologies = Array.from(allTechnologies);
                  console.log(
                    `🔧 Updated technologies: ${processedProject.technologies.join(
                      ", "
                    )}`
                  );
                }
              } catch (parseError) {
                console.error(
                  `❌ Error parsing Together API response for ${repo.name}:`,
                  parseError,
                  "\nResponse was:",
                  llmResult
                );
              }
            } else {
              console.error(
                `❌ Could not find JSON in Together API response for ${repo.name}. Raw response:`,
                llmResult
              );
            }
          } catch (llmError) {
            console.error(
              `❌ Error using Together API for ${repo.name}:`,
              llmError
            );
          }
        } else {
          console.log(
            `⚠️ No README content for ${repo.name}, skipping Together API analysis`
          );
        }

        console.log(`✅ Completed processing for ${repo.name}\n`);

        // Return the processed project
        return {
          ...processedProject,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
        };
      })
    );

    console.log(
      `🎉 Successfully processed ${projects.length} projects for ${username}`
    );
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("❌ Error fetching GitHub projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch GitHub projects" },
      { status: 500 }
    );
  }
}
