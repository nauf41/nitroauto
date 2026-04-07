import { type Result } from "ts-results";
import { useActionStore } from "../states/actions";
import { useTriggerStore } from "../states/trigger";
import type { Variable, VariableSelector } from "../models/variables";
import type { Action } from "../models/action";
import type { Condition } from "../models/condition";
import type { ActionId, ActionStructure, ConditionStructure, StringBuilderStructure, StringPartStructure, TriggerStructure, ValueStructure, VariableId, VariableSelectorStructure } from "./structure";
import { type Trigger } from "../models/trigger";
import type { StringBuilder, StringPart } from "../models/stringBuilder";
import type { Value } from "../models/value";

export type CompilerResult<T> = Result<T, CompileError[]>;
export type CompileError =
| {type: "RequiredEmptyError", field: string}
| {type: "WrongTypeError", field: string, expected: string, actual: string}
| {type: "UnexpectedError", message: string}

// コンパイルだけ。純粋関数。
export async function compile(): Promise<string> {
  const triggerState = useTriggerStore.getState().trigger;
  const actionState = useActionStore.getState().actions;

  const trigger: TriggerStructure | null = triggerState !== null ? await compileTrigger(triggerState) : null;

  const actions: [number, ActionStructure][] = [];
  const flow: ActionId[] = actionState.map(a => compileAction(a, actions));

  return JSON.stringify([trigger, flow, actions]);
}

// triggerReturnsは後から再現できるから登録しなくて良い
async function compileTrigger(trigger: Trigger): Promise<TriggerStructure> {
  switch (trigger.type) {
    case "timed":
      switch (trigger.time.type) {
        case "once":
          return ["to", trigger.time.time.getTime()];
        case "daily":
          return ["td", trigger.time.time.getTime()];
        case "weekly":
          return ["tw", trigger.time.time.getTime(), trigger.time.dayOfWeek];
      }
      break;
    case "form-submit": {
      const mt = trigger.form_id.match(/^https:\/\/docs\.google\.com\/forms\/d\/([^/]+)\/.*/);
      if (mt) {
        return ["f", mt[1]];
      } else {
        throw new Error("Invalid form URL");
      }
    }
  }
}

function compileAction(action: Action, actions: [number, ActionStructure | null][]): ActionId {
  if (actions.filter(v => v[0] === action.id).length > 0) return action.id; // use memo
  actions.push([
    action.id,
    ((): ActionStructure => {
      switch (action.type) {
        case "if": {
          return [
            "i",
            compileCondition(action.condition),
            action.then.map(a => compileAction(a, actions)),
            action.else.map(a => compileAction(a, actions)),
            action.id,
          ];
        }
        case "foreach": {
          return [
            "e",
            compileVariableSelector(action.target),
            action.template.map(a => compileAction(a, actions)),
            action.id,
          ]
        }
        case "send-webhook": {
          return [
            "s",
            action.target,
            compileStringBuilder(action.value),
            action.id,
          ]
        }
        case "get-schedule": {
          return [
            "g",
            action.calendar_id,
            action.calendar_name,
            action.fordayOffset,
            action.id,
          ]
        }
        case "null": return action.id;
      }
    })()
  ]);

  return action.id;
}

function compileVariable(variable: Variable): VariableId {
  switch (variable.source) {
    case "default": return [-2, variable.index];
    case "trigger": return [-1, variable.index];
    case "action": return [variable.from.id, variable.index];
  }
}

function compileStringBuilder(value: StringBuilder): StringBuilderStructure {
  return value.parts.map(part => compileStringPart(part));
}

function compileStringPart(part: StringPart): StringPartStructure {
  switch (part.type) {
    case "static": return [part.value, part.id];
    case "line-break": return ["\n", part.id];
    case "variable": return ["v", part.id, compileVariableSelector(part.value)];
    case "each": return ["e", part.id, compileVariableSelector(part.target), compileStringBuilder(part.template)];
    case "if": return ["i", part.id, compileCondition(part.condition), compileStringBuilder(part.then), compileStringBuilder(part.else)];
  }
}

function compileVariableSelector(arg: VariableSelector): VariableSelectorStructure {
  return [
    arg.id,
    arg.variable ? compileVariable(arg.variable) : null,
    arg.filter ? compileCondition(arg.filter) : null,
  ]
}

function compileCondition(condition: Condition): ConditionStructure {
  switch (condition.type) {
    case "value":
      return condition.value;
    case "and": case "or":
      return [condition.type === "and" ? "a" : "o", condition.conditions.map(compileCondition)]
    case "not":
      return ["n", compileCondition(condition.condition)]
    case "compare":
      return ["c", condition.operator, compileVariableSelector(condition.left), compileValue(condition.right)]
  }
}

function compileValue(value: Value): ValueStructure {
  switch (value.type) {
    case "constant":
      return value.value;
    case "variable":
      return [
        value.variable.id,
        value.variable.variable ? compileVariable(value.variable.variable) : null,
        value.variable.filter ? compileCondition(value.variable.filter) : null
      ];
  }
}