import { create } from "zustand";
import en_us from "./en_us";
import ja_jp from "./ja_jp";
import dev_zz from "./dev_zz";

export type LanguageSet = "ja-jp" | "en-us" | "dev-zz";

export interface LanguageSetState {
  languageSetName: LanguageSet;
  setLanguageSet: (languageSet: LanguageSet) => void;
  getLanguageObject: () => typeof en_us | typeof ja_jp;
}

export const languageSetStore = create<LanguageSetState>((set, get) => ({
  languageSetName: "ja-jp",
  setLanguageSet: (lang: LanguageSet) => set({ languageSetName: lang }),
  getLanguageObject: () => {
    switch (get().languageSetName) {
      case "en-us":
        return en_us;
      case "ja-jp":
        return ja_jp;
      case "dev-zz":
        return dev_zz;
    }
  }
}))

export function getNowLanguageObject() {
  return getLanguageObject(languageSetStore.getState().languageSetName);
}

export function getLanguageObject(lang: LanguageSet) {
  switch (lang) {
    case "en-us":
      return en_us;
    case "ja-jp":
      return ja_jp;
    case "dev-zz":
      return dev_zz;
  }
}
