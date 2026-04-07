import type { Variable } from "../models/variables";
import type { Action, ActionBlock } from "../models/action";
import { useNetState } from "./net";
import { useTriggerStore } from "./trigger";
import { getLanguageObject, languageSetStore } from "../misc/langSet";

export function getVariablesForFollowing(action: Action): [Variable, string][] {
  const lang = languageSetStore.getState().getLanguageObject();

  switch (action.type) {
    case "get-schedule": {
      return [
        [{source: "action", from: action, index: 0, type: "array<schedule>"}, lang.getSchedulesAction.scheduleArgumentName(action.calendar_name)],
        [{source: "action", from: action, index: 1, type: `arraylength<schedule>`}, lang.getSchedulesAction.scheduleLengthArgumentName(action.calendar_name)],
      ]
    }
    default:
      return [];
  }
}

export function getVariablesForChildren(action: Action): [Variable, string][] {
  switch (action.type) {
    case "foreach":
      if (action.target.variable === null) return [];
      return [...getForEachVariables(action.target, action.target.variable)];
    default:
      return [];
  }
}

export function getForEachVariables(ab: ActionBlock, arg: Variable): [Variable, string][] {
  if (!(arg.source === "action")) throw new Error("Invalid source");
  const lang = languageSetStore.getState().getLanguageObject();

  switch (arg.type) {
    case "array<schedule>": case "arraylength<schedule>": {
      const calendarName = (arg.from as Action & {type: "get-schedule"}).calendar_name;

      return [
        [{source: "action", from: ab, index: 0, type: "string"}, lang.variableSelector.each.scheduleName(calendarName)],
        [{source: "action", from: ab, index: 1, type: "string"}, lang.variableSelector.each.scheduleTime(calendarName)], // e.g. "07:23-23:44"
        [{source: "action", from: ab, index: 2, type: "boolean"}, lang.variableSelector.each.isAllDay(calendarName)],
        [{source: "action", from: ab, index: 3, type: "color"}, lang.variableSelector.each.color(calendarName)]
      ];
    }
  }

  return [];
}

export const defaultVariables: [Variable, string][] = [
  [{type: "date", source: "default", index: 0}, languageSetStore.getState().getLanguageObject().defaultVariable.nowTime],
];

export function useTriggerArgs(): [Variable, string][] {
  const formContents = useNetState((state) => state.formContents);
  const trigger = useTriggerStore((state) => state.trigger);
  const languageSetName = languageSetStore((state) => state.languageSetName);
  const langObject = getLanguageObject(languageSetName);

  const formArgs = formContents.map((name, idx) => [
    { source: "trigger", index: idx, type: "string" },
    langObject.formAnswer(name),
  ] as [Variable, string]);

  switch (trigger?.type) {
    case "form-submit":
      return formArgs;
    default:
      return [];
  }
}
