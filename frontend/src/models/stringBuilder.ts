import type { ActionBlock } from "./action";
import { newArrayVariableSelector, newVariableSelector, type ArrayVariableSelector, type VariableSelector } from "./variables";
import type { Condition } from "./condition";
import type { VariableType } from "./variables";
import { useIdStore } from "../states/id";

export type StringBuilder = {
  parts: StringPart[];
}

export type StringPart = ActionBlock & (
  | {type: "static", value: string}
  | {type: "variable", value: VariableSelector}
  | {type: "line-break"} // == static("\n")
  | {type: "each", target: ArrayVariableSelector, template: StringBuilder}
  | {type: "if", condition: Condition, then: StringBuilder, else: StringBuilder}
);

// type foreach = {type: "each"};

// export function getForEachVariables(part: foreach & StringPart): Variable[] {
//   if (part.target.variable === null) return [];
//   const lang = languageSetStore.getState().getLanguageObject();

//   if (part.target.variable?.source !== "action") throw new Error("Invalid source");
//   switch (part.target.variable?.type) {
//     case "array<schedule>": {
//       const calendarName: string = lang.getSchedulesAction.scheduleArgumentName_reverse(useVariableNames.getState().names.get(part.target.variable)!)!;
//       const scheduleName: Variable = {source: "action", from: part.target, index: 0, type: "string"};
//       const scheduleTime: Variable = {source: "action", from: part.target, index: 1, type: "date"};
//       const isAllDay: Variable = {source: "action", from: part.target, index: 2, type: "boolean"};
//       const color: Variable = {source: "action", from: part.target, index: 3, type: "color"};

//       useVariableNames.getState().add(scheduleName, lang.variableSelector.each.scheduleName(calendarName));
//       useVariableNames.getState().add(scheduleTime, lang.variableSelector.each.scheduleTime(calendarName));
//       useVariableNames.getState().add(isAllDay, lang.variableSelector.each.isAllDay(calendarName));
//       useVariableNames.getState().add(color, lang.variableSelector.each.color(calendarName));

//       return [scheduleName, scheduleTime, isAllDay, color];
//     }
//   }

//   return [];
// }

export const forEachSuitableTypes: VariableType[] = ["array<schedule>"];

export function newStringBuilder(): StringBuilder {
  return {
    parts: [],
  }
}

export function newStringPart(type?: StringPart["type"]): StringPart {
  const getId = useIdStore.getState().getNew;
  switch (type ?? "static") {
    case "line-break":
      return {type: "line-break", id: getId()};
    case "static":
      return {type: "static", value: "", id: getId()};
    case "variable":
      return {type: "variable", value: newVariableSelector(), id: getId()};
    case "each":
      return {type: "each", target: newArrayVariableSelector(), template: newStringBuilder(), id: getId()};
    case "if":
      return {type: "if", condition: {type: "value", value: true}, then: newStringBuilder(), else: newStringBuilder(), id: getId()};
  }
}