import { create } from "zustand";
import type { Trigger } from "../models/trigger";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { useProjectsStore } from "./projects";

export interface TriggerStore {
  trigger: Trigger | null;
  setTrigger: (trigger: Trigger | null) => void;
}

export const useTriggerStore = create<TriggerStore>()(subscribeWithSelector(devtools((set) => ({
  trigger: null,
  setTrigger: (trigger: Trigger | null) => {useProjectsStore.getState().setIsSynced(false);set(() => ({ trigger }))},
}))));
