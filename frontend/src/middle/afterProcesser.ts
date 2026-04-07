import { assert_nonnull, assert_nonnullish, unreachable } from "../misc/assert";
import type { Action, ActionBlock } from "../models/action";
import type { Condition } from "../models/condition";
import type { StringBuilder, StringPart } from "../models/stringBuilder";
import type { Trigger } from "../models/trigger";
import type { Variable, VariableSelector } from "../models/variables";
import { getForEachVariables, getVariablesForChildren, getVariablesForFollowing } from "../states/variables";
import type { ActionStructure, ConditionStructure, StringBuilderStructure, StringPartStructure, VariableId, VariableSelectorStructure } from "./structure";

/// 引数を変更する。
export async function afterProcess(trigger: Trigger | null, actionsBinary: [number,ActionStructure][], actionsDraft: Action[], flow: number[], stringParts: [number, StringPart][], variableSelectors: VariableSelector[]) {
  for (const i of flow) {
    processAction([], trigger, assert_nonnullish(actionsBinary.find(v=>v[0]===i))[1], actionsBinary, actionsDraft, assert_nonnullish(actionsDraft.find(v=>v.id===i)), stringParts, variableSelectors);
  }
}

function processActionCallHelperForActionIdArray(callstack: ActionBlock[], trigger: Trigger | null, actionsBinary: [number,ActionStructure][], actionsDraft: Action[], actionIds: number[], stringParts: [number, StringPart][], variableSelectors: VariableSelector[]) {
  for (const n of actionIds) {
    processAction(
      callstack,
      trigger,
      actionsBinary.find(a => a[0]===n)![1],
      actionsBinary,
      actionsDraft,
      assert_nonnullish(actionsDraft.find(a => a.id === n)),
      stringParts,
      variableSelectors,
    );
  }
}

function processAction(callStack: ActionBlock[], trigger: Trigger | null, actionBinary: ActionStructure, actionsBinary: [number,ActionStructure][], actionsDraft: Action[], actionDraft: Action, stringParts: [number, StringPart][], variableSelectors: VariableSelector[]) {
  callStack.push(actionDraft);
  switch (actionDraft.type) {
    case "if": {
      if (typeof actionBinary !== "number" && actionBinary[0] == "i") {
        processCondition(callStack, actionDraft.condition, assert_nonnullish(actionBinary[1]), actionsDraft, stringParts, variableSelectors);
        actionDraft.then = (actionBinary[2]).map(v => assert_nonnullish(actionsDraft.find(a => a.id === v)));
        processActionCallHelperForActionIdArray(callStack, trigger, actionsBinary, actionsDraft, actionBinary[2], stringParts, variableSelectors);
        actionDraft.else = (actionBinary[3]).map(v => assert_nonnullish(actionsDraft.find(a => a.id === v)));
        processActionCallHelperForActionIdArray(callStack, trigger, actionsBinary, actionsDraft, actionBinary[3], stringParts, variableSelectors);
      } else unreachable();
      break;
    }
    case "foreach": {
      if (typeof actionBinary !== "number" && actionBinary[0] == "e") {
        processVariableSelector(callStack, actionDraft.target, assert_nonnullish(actionBinary[1]), actionsDraft, stringParts, variableSelectors);
        processActionCallHelperForActionIdArray(callStack, trigger, actionsBinary, actionsDraft, actionBinary[2], stringParts, variableSelectors);
        actionDraft.template = (actionBinary[2]).map(v => assert_nonnullish(actionsDraft.find(a => a.id === v)));
      } else unreachable();
      break;
    }
    case "get-schedule": break;
    case "send-webhook": {
      if (typeof actionBinary !== "number" && actionBinary[0] == "s") {
        processStringBuilder(callStack, actionDraft.value, assert_nonnullish(actionBinary[2]), actionsDraft, stringParts, variableSelectors);
      }
      break;
    }
    case "null": break;
  }
  callStack.pop();
}

function processCondition(callStack: ActionBlock[], condition: Condition, conditionBinary: ConditionStructure, actionsDraft: Action[], stringParts: [number, StringPart][], variableSelectors: VariableSelector[]) {
  switch (condition.type) {
    case "value": break;
    case "and":
    case "or":
      if (typeof conditionBinary === "boolean" || conditionBinary[0] !== (condition.type === "and" ? "a" : "o")) unreachable();
      condition.conditions.forEach((v, idx) => processCondition(callStack, v, (conditionBinary[1] as ConditionStructure[])[idx], actionsDraft, stringParts, variableSelectors));
      break;
    case "not":
      if (typeof conditionBinary === "boolean" || conditionBinary[0] !== "n") unreachable();
      processCondition(callStack, condition.condition, conditionBinary[1], actionsDraft, stringParts, variableSelectors);
      break;
    case "compare":
      if (typeof conditionBinary === "boolean" || conditionBinary[0] !== "c") unreachable();
      processVariableSelector(callStack, condition.left, assert_nonnullish(conditionBinary[2]), actionsDraft, stringParts, variableSelectors);
      if (condition.right.type === "variable" && typeof conditionBinary[3] === "object") {
        processVariableSelector(callStack, condition.right.variable, conditionBinary[3], actionsDraft, stringParts, variableSelectors);
      }
      break;
  }
}

function processStringBuilder(callStack: ActionBlock[], stringBuilder: StringBuilder, stringBuilderBinary: StringBuilderStructure, actionsDraft: Action[], stringParts: [number, StringPart][], variableSelectors: VariableSelector[]) {
  stringBuilder.parts.forEach((v, idx) => processStringPart(callStack, v, stringBuilderBinary[idx], actionsDraft, stringParts, variableSelectors));
}

function processStringPart(callStack: ActionBlock[], part: StringPart, stringPartBinary: StringPartStructure, actionsDraft: Action[], stringParts: [number, StringPart][], variableSelectors: VariableSelector[]) {
  switch (part.type) {
    case "static":
    case "line-break":
      break;
    case "variable":
      if (stringPartBinary[0] !== "v") unreachable();
      processVariableSelector(callStack, part.value, assert_nonnullish(stringPartBinary[2]), actionsDraft, stringParts, variableSelectors);
      break;
    case "each":
      if (stringPartBinary[0] !== "e") unreachable();
      callStack.push(part);
      processVariableSelector(callStack, part.target, assert_nonnullish(stringPartBinary[2]), actionsDraft, stringParts, variableSelectors);
      processStringBuilder(callStack, part.template, stringPartBinary[3]!, actionsDraft, stringParts, variableSelectors);
      callStack.pop();
      break;
    case "if":
      if (stringPartBinary[0] !== "i") unreachable();
      processCondition(callStack, part.condition, assert_nonnullish(stringPartBinary[2]), actionsDraft, stringParts, variableSelectors);
      processStringBuilder(callStack, part.then, stringPartBinary[3]!, actionsDraft, stringParts, variableSelectors);
      processStringBuilder(callStack, part.else, stringPartBinary[4]!, actionsDraft, stringParts, variableSelectors);
      break;
  }
}

function processVariableSelector(callStack: ActionBlock[], variableSelector: VariableSelector, variableSelectorBinary: VariableSelectorStructure, actionsDraft: Action[], stringParts: [number, StringPart][], variableSelectors: VariableSelector[]) {
  if (variableSelector.variable !== null) {
    processVariable(callStack, variableSelector.variable, assert_nonnull(variableSelectorBinary[1]), actionsDraft, stringParts, variableSelectors);
  }
  if (variableSelector.filter !== null) {
    processCondition(callStack, variableSelector.filter, assert_nonnull(variableSelectorBinary[2]), actionsDraft, stringParts, variableSelectors);
  }
}

/// @param callStack: Action[] 呼び出しスタック。
function processVariable(callStack: ActionBlock[], variable: Variable, variableDraft: VariableId, actionsDraft: Action[], stringParts: [number, StringPart][], variableSelectors: VariableSelector[]) {
  switch (variable.source) {
    case "default": break;
    case "trigger": {
      variable.type = "string"; // TODO 地雷
      break;
    }
    case "action": {
      const from_act = actionsDraft.find(a => a.id === variableDraft[0]);
      const from_str = stringParts.find(s => s[0] === variableDraft[0]);
      const from_var = variableSelectors.find(vs => vs.id === variableDraft[0]);
      console.log(`processing: ${JSON.stringify(variableDraft)}, from_act: ${from_act?.type}, from_str: ${from_str?.[1].type}`);
      console.log(stringParts);
      if (from_act !== undefined) {
        variable.from = from_act;
        variable.type = callStack.includes(from_act) ? getVariablesForChildren(from_act)[variableDraft[1]][0].type : getVariablesForFollowing(from_act)[variableDraft[1]][0].type;
        break;
      } else if (from_str !== undefined && from_str[1].type === "each" && from_str[1].target.variable !== null) {
        variable.from = from_str[1];
        variable.type = getForEachVariables(from_str[1], from_str[1].target.variable)[variableDraft[1]][0].type;
      } else if (from_var !== undefined && from_var.variable !== null) {
        variable.from = from_var;
        variable.type = getForEachVariables(from_var, from_var.variable)[variableDraft[1]][0].type;
      } else {
        throw new Error("Invalid variable reference");
      }
    }
  }
}