import type { ActionBlock } from "../models/action";
import type { BinaryComparisionOperator, Condition } from "../models/condition"
import type { VariableType } from "../models/variables";

// condition, actions, variablesは参照番号.

export type ActionId = number;
export type VariableId = [number, number]; // source (trigger=>-1, default: -2), actionSourceIndex
export type VariableTypeEnumId = number;

// ケツはid
export type ActionStructure =
| ["i", ConditionStructure, ActionId[], ActionId[], number] // if, cond, then, else
| ["e", VariableSelectorStructure, ActionId[], number] // foreach, target, template
| ["s", string, StringBuilderStructure, number] // send-webhook, target, value
| ["g", string, string, number, number] // get-schedule, calendar_id, calendar_name, fordayOffset
| number // 未設定

export type ConditionStructure =
| boolean
| ["a", ConditionStructure[]] // and
| ["o", ConditionStructure[]] // or
| ["n", ConditionStructure] // not
| ["c", BinaryComparisionOperator, VariableSelectorStructure, ValueStructure] // compare, operator, left, right. 左辺値は常に実行時定数で、右辺値は実行時定数とコンパイル時定数のどちらかを取る。

export type StringBuilderStructure = StringPartStructure[];

export type StringPartStructure =
| [string,number] // line-breakはここに"\n"で表され、デコンパイル時にline-breakに変換される
| ["v",number, VariableSelectorStructure] // variable
| ["e",number, VariableSelectorStructure, StringBuilderStructure] // each, target, template
| ["i",number, ConditionStructure, StringBuilderStructure, StringBuilderStructure] // if, condition, then, else

export type VariableSelectorStructure = [
  number,
  VariableId | null, // variable: Variable. nullは未設定
  ConditionStructure | null, // filter: Condition. nullは未設定
]

export type ValueStructure =
| string  // constant value
| number  // constant value
| boolean // constant value
| VariableSelectorStructure // 1つだけobjectだから識別可能


export type TriggerStructure =
| null // 未設定
| ["f", string] // form_submit, form_id
| ["to", number] // timed, once, time
| ["td", number] // timed, daily, time
| ["tw", number, number[]] // timed, weekly, time, dayOfWeek

export type ActionDecompileDraft = ActionBlock & (
  | {type: "if", condition: Condition, then: ActionId[], else: ActionId[]}
)

export type VariableDecompileDraft =
| {source: "default", index: number, type: VariableType}
| {source: "trigger", index: number, type: VariableType}
| {source: "action", index: number}
