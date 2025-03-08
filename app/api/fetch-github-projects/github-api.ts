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

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return response.json();
}

// Fetch file content from GitHub API
export async function fetchFile(
  repo: any,
  username: string,
  filePath: string
): Promise<string | null> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) return null;

  try {
    const fileResponse = await fetch(
      `https://api.github.com/repos/${username}/${repo.name}/contents/${filePath}`,
      {
        headers: {
          Authorization: `token ${githubToken}`,
        },
      }
    );

    if (fileResponse.ok) {
      const fileData = await fileResponse.json();
      if (fileData.content) {
        return decodeBase64(fileData.content);
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}
