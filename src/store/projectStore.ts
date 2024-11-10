import { Project } from "../types/project";
import { createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";

export const useProjectStore = create(
  persist<{
    currentProject: Project | null;
    setCurrentProject: (project: Project) => void;
  }>(
    (set) => ({
      currentProject: null,
      setCurrentProject: (project) => set({ currentProject: project }),
    }),
    {
      name: "project-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
