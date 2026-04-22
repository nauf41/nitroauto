import { create } from "zustand";

export interface NetworkLoadingState {
  loadingRequests: number;
  isLoading: boolean;
  startRequest: () => void;
  finishRequest: () => void;
}

export const useNetworkLoadingState = create<NetworkLoadingState>()((set) => ({
  loadingRequests: 0,
  isLoading: false,
  startRequest: () => set((state) => {
    const loadingRequests = state.loadingRequests + 1;
    return { loadingRequests, isLoading: true };
  }),
  finishRequest: () => set((state) => {
    const loadingRequests = Math.max(0, state.loadingRequests - 1);
    return { loadingRequests, isLoading: loadingRequests > 0 };
  }),
}));