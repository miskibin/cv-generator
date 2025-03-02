import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CVData } from "@/types/cv";

interface CVStore {
  cvData: Partial<CVData>;
  updateCV: (data: Partial<CVData>) => void;
  resetCV: () => void;
}

export const useCVStore = create<CVStore>()(
  persist(
    (set) => ({
      cvData: {},
      updateCV: (data) =>
        set((state) => ({
          cvData: { ...state.cvData, ...data },
        })),
      resetCV: () => set({ cvData: {} }),
    }),
    {
      name: "cv-storage",
    }
  )
);
