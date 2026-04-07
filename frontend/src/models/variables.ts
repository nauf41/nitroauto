import { useIdStore } from "../states/id";
import type { ActionBlock } from "./action"
import type { Condition } from "./condition"

export type Variable =
| {source: "default", index: number, type: VariableType}
| {source: "trigger", index: number, type: VariableType}
| {source: "action", from: ActionBlock /* 参照 */, index: number, type: VariableType}

export type VariableType = "string" | "number" | "boolean" | "date" | "schedule" | "color" | "array<schedule>" | `arraylength<schedule>`;

export type VariableSelector = ActionBlock & {
  variable: Variable | null,
  filter: Condition | null, // foreachと同じ展開
}

export type ArrayVariableSelector = ActionBlock & {
  variable: (Variable & { type: `array<${string}>` | "arraylength<schedule>" }) | null,
  filter: Condition | null, // foreachと同じ展開
}

export function newVariableSelector(): VariableSelector {
  return {
    id: useIdStore.getState().getNew(),
    variable: null,
    filter: null,
  }
}

export function newArrayVariableSelector(): ArrayVariableSelector {
  return {
    id: useIdStore.getState().getNew(),
    variable: null,
    filter: null,
  }
}
