import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface IdStore {
  next_id: number; // must not be referred directly, use get()
  getNew: () => number;
}

export const useIdStore = create<IdStore>()(devtools((set) => ({
  next_id: 0,
  getNew: () => {
    let res: number;
    set(state => {
      res = state.next_id;
      return { next_id: state.next_id + 1 };
    })
    return res!;
  }
})));