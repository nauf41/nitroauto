import type { ActionId, ActionStructure, TriggerStringExpression, TriggerStructure } from "./structure";

export type ArrayLength<T> = T[];
export type JsonStringified<T> = string;

export type TypedValue =
| ["string", string]
| ["number", number]
| ["boolean", boolean]
| ["date", Date]
| ["schedule", GoogleAppsScript.Calendar.CalendarEvent]
| ["color", string]
| ["array<schedule>", GoogleAppsScript.Calendar.CalendarEvent[]]
| [`arraylength<schedule>`, ArrayLength<GoogleAppsScript.Calendar.CalendarEvent>]
export function stringFrom(value: TypedValue): string {
  switch (value[0]) {
    case "string": case "color": return value[1];
    case "number": case "boolean": return String(value[1]);
    case "date": return `${value[1].getFullYear()}/${value[1].getMonth()+1}/${value[1].getDate()} ${value[1].getHours()}:${value[1].getMinutes()}:${value[1].getSeconds()}`;
    case "schedule": return value[1].getTitle();
    case "array<schedule>": return JSON.stringify(value[1].map(event => event.getTitle()));
    case "arraylength<schedule>": return String(value[1].length);
  }
}

export type CodeStore = [
  TriggerStructure,
  number[],
  [number, ActionStructure][]
]

export type ProjectStore = {
  id: number,
  title: string,
  trigger: TriggerStringExpression | null,
  isActive: boolean,
}

export type TriggerStoreStructure = {
  triggerId: string,
  triggerObject: TriggerStringExpression,
  projectId: number,
}

export type RuntimeContext = {
  callStack: ActionId[],
  defaultVariables: TypedValue[],
  triggerVariables: TypedValue[],
  actionVariablesForFollowing: [number, TypedValue[]][], // [id: number, vars: any[]]
  actionVariablesForChildren: [number, TypedValue[]][], // [id: number, vars: any[]]
  actions: [number, ActionStructure][],
}