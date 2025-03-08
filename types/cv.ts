export interface Project {
  name: string;
  description: string;
  technologies: string[];
  github?: string;
  url?: string;
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  summary?: string;
  projects?: Project[];
}

export interface Education {
  institution: string;
  degree: string;
  startDate?: string; // Add this property
  graduationDate: string;
}

export interface CVData {
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
}
