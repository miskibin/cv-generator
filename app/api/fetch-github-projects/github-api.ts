// GitHub GraphQL API query
export const GITHUB_GRAPHQL_QUERY = `
  query ($username: String!, $count: Int!) {
    user(login: $username) {
      repositories(first: $count, orderBy: {field: STARGAZERS, direction: DESC}) {
        nodes {
          name
          description
          url
          homepageUrl
          stargazerCount
          forkCount
          languages(first: 10) {
            nodes {
              name
            }
          }
          object(expression: "HEAD:README.md") {
            ... on Blob {
              text
            }
          }
          readmeLower: object(expression: "HEAD:readme.md") {
            ... on Blob {
              text
            }
          }
        }
      }
    }
  }
`;

// Decode base64 content from GitHub API
export function decodeBase64(str: string): string {
  return Buffer.from(str, "base64").toString("utf-8");
}

// Fetch repositories using GraphQL API
export async function fetchUserRepositories(
  username: string,
  count: number = 8
) {
  const githubToken = process.env.GITHUB_TOKEN;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: githubToken ? `Bearer ${githubToken}` : "",
    },
    body: JSON.stringify({
      query: GITHUB_GRAPHQL_QUERY,
      variables: { username, count },
    }),
  });

  if (response.status === 401) {
    console.warn(
      "GitHub API authentication failed. Consider adding a GITHUB_TOKEN environment variable."
    );
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("GitHub user not found");
    }
    if (response.status === 403) {
      throw new Error(
        "GitHub API rate limit exceeded. Please try again later."
      );
    }
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return response.json();
}

// Fetch file content from GitHub API with retry logic
export async function fetchFile(
  repo: any,
  username: string,
  filePath: string,
  retryCount = 0
): Promise<string | null> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.warn(
      "No GITHUB_TOKEN provided, skipping file fetch to avoid rate limits"
    );
    return null;
  }

  try {
    const fileResponse = await fetch(
      `https://api.github.com/repos/${username}/${repo.name}/contents/${filePath}`,
      {
        headers: {
          Authorization: `token ${githubToken}`,
        },
      }
    );

    if (
      fileResponse.status === 403 &&
      fileResponse.headers.get("x-ratelimit-remaining") === "0"
    ) {
      if (retryCount < 3) {
        console.warn(
          `Rate limit hit, retrying after delay (attempt ${retryCount + 1})`
        );
        return fetchFile(repo, username, filePath, retryCount + 1);
      } else {
        throw new Error(
          "GitHub API rate limit exceeded. Please try again later."
        );
      }
    }

    if (fileResponse.ok) {
      const fileData = await fileResponse.json();
      if (fileData.content) {
        return decodeBase64(fileData.content);
      }
    }
    return null;
  } catch (error) {
    if (retryCount < 3 && (error as Error).message.includes("rate limit")) {
      console.warn(
        `Error due to rate limit, retrying after delay (attempt ${
          retryCount + 1
        })`
      );
      return fetchFile(repo, username, filePath, retryCount + 1);
    }
    return null;
  }
}
