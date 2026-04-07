import { newArrayVariableSelector, type ArrayVariableSelector } from "./variables";
import type { Condition } from "./condition";
import { newStringBuilder, type StringBuilder } from "./stringBuilder";
import { useIdStore } from "../states/id";

export type ActionBlock = {
  id: number,
}

export type Action = ActionBlock & ActionDraft;

export type ActionDraft =
| {type: "if", condition: Condition, then: Action[], else: Action[]}
| {type: "foreach", target: ArrayVariableSelector, template: Action[]}
| {type: "send-webhook", target: string, value: StringBuilder}
| {type: "get-schedule", calendar_id: string, calendar_name: string, fordayOffset: number}
| {type: "null"}

export function newAction(type?: ActionDraft["type"]): Action {
  const getId = useIdStore.getState().getNew;

  switch (type ?? "null") {
    case "if":
      return {type: "if", condition: {type: "value", value: true}, then: [], else: [], id: getId()};
    case "foreach":
      return {type: "foreach", target: newArrayVariableSelector(), template: [], id: getId()};
    case "send-webhook":
      return {type: "send-webhook", target: "", value: newStringBuilder(), id: getId()};
    case "get-schedule":
      return {type: "get-schedule", calendar_id: "", calendar_name: "", fordayOffset: 0, id: getId()};
    case "null":
      return {type: "null", id: getId()};
  }
}
