import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { useTriggerStore } from "./trigger";
import { getCalendars, getFormItems, type Calendar } from "../api/gas";

export interface NetState {
  formContents: string[];
  calendars: Calendar[];
}

export const useNetState = create<NetState>()(subscribeWithSelector(devtools(() => ({
  formContents: [],
  calendars: [],
}))));

export function init() {
  useTriggerStore.subscribe(async (state) => {
    const trigger = state.trigger;

    if (trigger?.type === "form-submit") {
      const mt = trigger.form_id.match(/^https:\/\/docs\.google\.com\/forms\/d\/([^/]+)\/.*/);
      if (mt) {
        const items = await getFormItems(mt[1]);
        useNetState.setState(() => ({ formContents: items }));
        return;
      }
    };
    useNetState.setState(() => ({ formContents: [] }));
  });

  getCalendars().then(calendars => {console.log(`fetched calendars: ${calendars.map(v => v.name).join(",")}`); return calendars;}).then(calendars => useNetState.setState(() => ({ calendars })));
}