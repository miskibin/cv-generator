"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCVStore } from "@/store/cv-store";
import { Github, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { ScrollArea } from "./ui/scroll-area";

export function GitHubProjectsFetcher() {
  const {
    githubUsername,
    githubProjects,
    isLoadingProjects,
    projectLoadError,
    setGithubUsername,
    setGithubProjects,
    setIsLoadingProjects,
    setProjectLoadError,
    updateCV,
  } = useCVStore();

  const [tempUsername, setTempUsername] = useState(githubUsername);
  const [status, setStatus] = useState<string | null>(null);

  const fetchGithubProjects = async () => {
    if (!tempUsername.trim()) {
      setProjectLoadError("Please enter a GitHub username");
      return;
    }

    setIsLoadingProjects(true);
    setProjectLoadError(null);
    setStatus("Fetching repositories...");

    try {
      const response = await fetch(
        `/api/fetch-github-projects?username=${tempUsername}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch GitHub projects");
      }

      setStatus("Analyzing repositories and READMEs...");
      const data = await response.json();
      setGithubProjects(data.projects);
      setGithubUsername(tempUsername);

      // Update the CV with project data
      if (data.projects.length > 0) {
        const cvProjects = data.projects.map((project: any) => ({
          name: project.name,
          description: project.description || `A repository on GitHub`,
          github: project.url,
          url: project.url,
          technologies: project.technologies || [],
        }));

        updateCV({ projects: cvProjects });
        setStatus("Projects imported successfully!");
        setTimeout(() => setStatus(null), 3000);
      }
    } catch (error) {
      setProjectLoadError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const clearProjects = () => {
    setGithubProjects([]);
    setGithubUsername("");
    setTempUsername("");
    setProjectLoadError(null);
    updateCV({ projects: [] });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Enter GitHub username"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              disabled={isLoadingProjects}
            />
            <Button
              onClick={fetchGithubProjects}
              disabled={isLoadingProjects || !tempUsername.trim()}
            >
              {isLoadingProjects ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Github className="h-4 w-4 mr-2" />
              )}
              {isLoadingProjects ? "Loading..." : "Fetch"}
            </Button>
            {githubProjects.length > 0 && (
              <Button variant="outline" size="icon" onClick={clearProjects}>
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {projectLoadError && (
        <Alert variant="destructive">
          <AlertDescription>{projectLoadError}</AlertDescription>
        </Alert>
      )}

      {status && !isLoadingProjects && (
        <div className="text-sm text-green-700 py-1">{status}</div>
      )}

      {isLoadingProjects && (
        <div className="text-sm flex items-center py-1 text-amber-700">
          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
          {status || "Loading projects..."}
        </div>
      )}

      {githubProjects.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">
            Found {githubProjects.length} projects for {githubUsername}
          </h3>

          <ScrollArea className="h-60">
            <div className="space-y-2">
              {githubProjects.map((project, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {project.name}
                          </a>
                        </h3>
                        <p className="text-sm text-gray-600">
                          {project.description || "No description"}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant="outline">⭐ {project.stars}</Badge>
                        <Badge variant="outline">🍴 {project.forks}</Badge>
                      </div>
                    </div>
                    {project.languages && project.languages.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {project.languages.map((lang: string, i: number) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs"
                          >
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {githubUsername &&
        !isLoadingProjects &&
        githubProjects.length === 0 &&
        !projectLoadError && (
          <div className="text-center py-4 text-gray-500 text-sm">
            No projects found for {githubUsername}
          </div>
        )}
    </div>
  );
}
