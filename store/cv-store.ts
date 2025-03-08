import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CVData } from "@/types/cv";

interface GitHubProject {
  name: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  readme?: string;
  languages?: string[];
}

interface CVStore {
  cvData: Partial<CVData>;
  githubUsername: string;
  githubProjects: GitHubProject[];
  isLoadingProjects: boolean;
  projectLoadError: string | null;
  fetchStatus: {
    message: string | null;
    step: string | null;
    progress: number;
    error: string | null;
  };

  updateCV: (data: Partial<CVData>) => void;
  resetCV: () => void;
  setGithubUsername: (username: string) => void;
  setGithubProjects: (projects: GitHubProject[]) => void;
  setIsLoadingProjects: (isLoading: boolean) => void;
  setProjectLoadError: (error: string | null) => void;
  setFetchStatus: (status: Partial<CVStore["fetchStatus"]>) => void;
  resetFetchStatus: () => void;
}

export const useCVStore = create<CVStore>()(
  persist(
    (set) => ({
      cvData: {},
      githubUsername: "",
      githubProjects: [],
      isLoadingProjects: false,
      projectLoadError: null,
      fetchStatus: {
        message: null,
        step: null,
        progress: 0,
        error: null,
      },

      updateCV: (data) =>
        set((state) => ({
          cvData: { ...state.cvData, ...data },
        })),
      resetCV: () =>
        set({
          cvData: {},
          githubUsername: "",
          githubProjects: [],
          projectLoadError: null,
        }),
      setGithubUsername: (username) => set({ githubUsername: username }),
      setGithubProjects: (projects) => set({ githubProjects: projects }),
      setIsLoadingProjects: (isLoading) =>
        set({ isLoadingProjects: isLoading }),
      setProjectLoadError: (error) => set({ projectLoadError: error }),
      setFetchStatus: (status) =>
        set((state) => ({
          fetchStatus: { ...state.fetchStatus, ...status },
        })),
      resetFetchStatus: () =>
        set({
          fetchStatus: {
            message: null,
            step: null,
            progress: 0,
            error: null,
          },
        }),
    }),
    {
      name: "cv-storage",
    }
  )
);
