import { create } from "zustand";
import { projectFromStringExpression, triggerToStringExpression, type Project, type ProjectStringExpression } from "../models/project";
import { devtools } from "zustand/middleware";
import { projects } from "../api/gas";
import type { Trigger } from "../models/trigger";

export interface Projects {
  projects: Project[];
  activeProject: Project | null;
  isSynced: boolean;
  setActiveProject: (project: Project | null) => void;
  refreshProjects: () => void;
  updateProject: (id: number, title: string, trigger: Trigger, isActive: boolean) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  setIsSynced: (synced: boolean) => void;
}

export const useProjectsStore = create<Projects>()(devtools((set) => ({
  projects: [],
  activeProject: null,
  isSynced: true,
  setActiveProject: (project: Project | null) => set(() => ({ activeProject: project })),
  refreshProjects: async () => {
    const projectList = await projects.getList();
    set(() => ({ projects: projectList.map((proj: ProjectStringExpression) => projectFromStringExpression(proj)) }));
  },
  updateProject: (id: number, title: string, trigger: Trigger, isActive: boolean) => {
    return projects.updateDescription(id, title, triggerToStringExpression(trigger), isActive).then(() => {
      set((state) => {
        const updatedProjects = state.projects.map((proj) => {
          if (proj.id === id) {
            return { ...proj, title, trigger, isActive };
          }
          return proj;
        });
        return { projects: updatedProjects };
      });
    });
  },
  deleteProject: (id: number) => {
    return projects.delete(id);
  },
  setIsSynced: (synced: boolean) => {console.log("setIsSynced to " + synced); set(() => ({ isSynced: synced }))},
})));