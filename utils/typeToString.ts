import { CVData, Education, Experience, Project } from "@/types/cv";

/**
 * Generates string representations of TypeScript interfaces
 * for use in prompts to AI models
 */
export function getTypeDefinitions(): string {
  return `
interface Project {
  name: string;
  description: string;
  technologies: string[];
  github?: string;
  url?: string;
}

interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  summary?: string;
  projects?: Project[];
}

interface Education {
  institution: string;
  degree: string;
  graduationDate: string;
}

interface CVData {
  firstName: string;
  lastName: string;
  github?: string;
  email: string;
  phone?: string;
  linkedin?: string;
  about?: string;
  skills?: string[];
  languages?: Record<string, string>;
  education?: Education[];
  experience?: Experience[];
  projects?: Project[];
}`;
}
