import { produce } from "immer";
import type { Action } from "../models/action";
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { useProjectsStore } from "./projects";

export interface ActionStore {
  actions: Action[];
  insertAction: (index: number, action: Action) => void;
  editAction: (index: number, action: Action) => void;
  deleteAction: (index: number) => void;
}

/// IMPORTANT: IDは非順序
export const useActionStore = create<ActionStore>()(subscribeWithSelector(devtools((set: (arg1: (arg1: ActionStore) => void) => void) => ({
  actions: [],
  insertAction: (index: number, action: Action) => set(produce((state: ActionStore) => {
    useProjectsStore.getState().setIsSynced(false);
    state.actions.splice(index, 0, action);
  })),
  editAction: (index: number, action: Action) => set(produce((state: ActionStore) => {
    useProjectsStore.getState().setIsSynced(false);
    state.actions[index] = action;
  })),
  deleteAction: (index: number) => set(produce((state: ActionStore) => {
    useProjectsStore.getState().setIsSynced(false);
    state.actions.splice(index, 1);
  }))
}))));
