import { assert_nonnullish } from "../misc/assert";
import { newAction, type Action } from "../models/action";
import type { Condition } from "../models/condition";
import type { StringBuilder, StringPart } from "../models/stringBuilder";
import { type Trigger } from "../models/trigger";
import type { Value } from "../models/value";
import { type ArrayVariableSelector, type Variable, type VariableSelector } from "../models/variables";
import { useActionStore } from "../states/actions";
import { useIdStore } from "../states/id";
import { useTriggerStore } from "../states/trigger";
import { defaultVariables } from "../states/variables";
import { afterProcess } from "./afterProcesser";
import type { ActionStructure, ConditionStructure, StringBuilderStructure, StringPartStructure, TriggerStructure, ValueStructure, VariableId, VariableSelectorStructure } from "./structure";

// デコンパイルして展開まで行う。非純粋関数。
// @param code: string ./compiler.tsで正しくコンパイルされた文字列
export async function decompile(code: string) {
  if (code === "" || code === "{}" || code === "[]") {
    useTriggerStore.setState({trigger: null});
    useActionStore.setState({actions: []});
    return;
  };
  const [triggerBinary, flowBinary, actionsBinary] = JSON.parse(code);

  const trigger = await decompileTrigger(triggerBinary);

  const stringParts: [number, StringPart][] = [];
  const variableSelectors: VariableSelector[] = [];

  // 実装戦略: ダミーオブジェクトで置く→生成後に置く→最後にflowに展開
  const actions = (actionsBinary as [number, ActionStructure][]).map((([id, structure]) => decompileAction(structure, id, stringParts, variableSelectors)));
  await afterProcess(trigger, actionsBinary, actions, flowBinary, stringParts, variableSelectors);

  const flow: Action[] = (flowBinary as number[]).map(id => actions.find(a => a.id === id)!);

  useTriggerStore.setState({trigger: trigger});
  useActionStore.setState({actions: flow});
  useIdStore.setState({next_id: Math.max(...actions.map(a => a.id)) + 1});
}

const dummyAction: Action = newAction("null"); // オブジェクト同一性判定用

async function decompileTrigger(trigger: TriggerStructure): Promise<Trigger | null> {
  if (trigger === null) return null;
  const res: Trigger = (() => {switch (trigger[0]) {
    case "to":
      return {
        type: "timed",
        time: {
          type: "once",
          time: new Date(trigger[1]),
        }
      }
    case "td":
      return {
        type: "timed",
        time: {
          type: "daily",
          time: new Date(trigger[1]),
        }
      }
    case "tw":
      return {
        type: "timed",
        time: {
          type: "weekly",
          time: new Date(trigger[1]),
          dayOfWeek: trigger[2],
        }
      }
    case "f":
      return {
        type: "form-submit",
        form_id: trigger[1] !== "" ? `https://docs.google.com/forms/d/${trigger[1]}/edit` : "",
      }
  }})();

  return res;
}
function decompileAction(action: ActionStructure, id: number, stringParts: [number, StringPart][], variableSelectors: VariableSelector[]): Action {
  if (typeof action === "number") {
    return {type: "null", id};
  } else {
    switch (action[0]) {
      case "i": {
        return {
          "type": "if",
          "condition": decompileCondition(action[1], variableSelectors),
          "then": [], // 後で割り当て
          "else": [], // 後で割り当て
          id,
        }
      }
      case "e": {
        return {
          "type": "foreach",
          "target": decompileVariableSelector(action[1], variableSelectors) as ArrayVariableSelector,
          "template": [], // 後で割り当て
          id,
        }
      }
      case "s": {
        return {
          "type": "send-webhook",
          "target": action[1],
          "value": decompileStringBuilder(action[2], stringParts, variableSelectors),
          id,
        }
      }
      case "g": {
        return {
          "type": "get-schedule",
          "calendar_id": action[1],
          "calendar_name": action[2],
          "fordayOffset": action[3],
          id,
        }
      }
    }
  }
}

function decompileCondition(condition: ConditionStructure, variableSelectors: VariableSelector[]): Condition {
  if (typeof condition === "boolean") {
    return {type: "value", value: condition};
  } else {
    switch (condition[0]) {
      case "a":
        return {type: "and", conditions: condition[1].map(v => decompileCondition(v, variableSelectors))};
      case "o":
        return {type: "or", conditions: condition[1].map(v => decompileCondition(v, variableSelectors))};
      case "n":
        return {type: "not", condition: decompileCondition(condition[1], variableSelectors)};
      case "c":
        return {
          type: "compare",
          operator: condition[1],
          left: decompileVariableSelector(condition[2], variableSelectors),
          right: decompileValue(condition[3], variableSelectors),
        }
    }
  }
}

function decompileStringBuilder(structure: StringBuilderStructure, stringParts: [number, StringPart][], variableSelectors: VariableSelector[]): StringBuilder {
  return {
    parts: structure.map(part => decompileStringPart(part, stringParts, variableSelectors)),
  }
}

function decompileStringPart(structure: StringPartStructure, stringParts: [number, StringPart][], variableSelectors: VariableSelector[]): StringPart {
  const res: StringPart = (() => {
  if (structure.length === 2) {
    if (structure[0] === "\n") {
      return {type: "line-break", id: structure[1]};
    } else {
      return {type: "static", value: structure[0], id: structure[1]};
    }
  } else {
    switch (structure[0]) {
      case "v": {
        return {
          type: "variable",
          value: decompileVariableSelector(structure[2], variableSelectors),
          id: structure[1],
        }
      }
      case "e": {
        return {
          type: "each",
          target: decompileVariableSelector(structure[2], variableSelectors) as ArrayVariableSelector,
          template: decompileStringBuilder(structure[3], stringParts, variableSelectors),
          id: structure[1],
        }
      }
      case "i": {
        return {
          type: "if",
          condition: decompileCondition(structure[2], variableSelectors),
          then: decompileStringBuilder(structure[3], stringParts, variableSelectors),
          else: decompileStringBuilder(structure[4], stringParts, variableSelectors),
          id: structure[1],
        }
      }
    }
  }
  })();
  stringParts.push([res.id, res]);
  return res;
}

function decompileVariableSelector(structure: VariableSelectorStructure, variableSelectors: VariableSelector[]): VariableSelector {
  const res: VariableSelector = {
    "id": structure[0],
    "variable": structure[1] !== null ? decompileVariable(structure[1]) : null,
    "filter": structure[2] !== null ? decompileCondition(structure[2], variableSelectors) : null,
  }
  variableSelectors.push(res);
  return res;
}

function decompileVariable(id: VariableId): Variable {
  switch (id[0]) {
    case -2:
      return assert_nonnullish(defaultVariables[id[1]])[0];
    case -1:
      return {source: "trigger", index: id[1], type: "string"}; // stringを仮入れ
    default:
      return {source: "action", from: dummyAction, index: id[1], type: "string"}; // fromは仮action, stringも仮入れ
  }
}

function decompileValue(structure: ValueStructure, variableSelectors: VariableSelector[]): Value {
  if (["string", "number", "boolean"].includes(typeof structure)) {
    return {type: "constant", value: structure as string | number | boolean};
  } else {
    return {type: "variable", variable: decompileVariableSelector(structure as VariableSelectorStructure, variableSelectors)};
  }
}