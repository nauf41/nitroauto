export type ActionBlock = {
  id: number,
}
export type BinaryComparisionOperator = "==" | "!=" | ">" | "<" | ">=" | "<=";
export type Condition =
| {type: "value", value: boolean}
| {type: "and", conditions: Condition[]}
| {type: "or", conditions: Condition[]}
| {type: "not", condition: Condition}
| {type: "compare", operator: BinaryComparisionOperator, left: VariableSelector, right: Value}
export type Variable =
| {source: "default", index: number, type: VariableType}
| {source: "trigger", index: number, type: VariableType}
| {source: "action", from: ActionBlock /* 参照 */, index: number, type: VariableType}
export type ConstantValue = string | number | boolean;
export type Value =
| {type: "constant", value: ConstantValue}
| {type: "variable", variable: VariableSelector}
export type VariableType = "string" | "number" | "boolean" | "date" | "schedule" | "color" | "array<schedule>" | `arraylength<schedule>`;
export type VariableSelector = ActionBlock & {
  variable: Variable | null,
  filter: Condition | null, // foreachと同じ展開
}
export type Trigger =
| {type: "timed", time: TimedTriggerData}
| {type: "form-submit", form_id: string}

export type TimedTriggerData =
| {type: "once", time: Date}
| {type: "daily", time: Date}
| {type: "weekly", time: Date, dayOfWeek: number[]} // 0-6, sun-sat

export type TriggerStringExpression =
| {type: "timed", time: TimedTriggerDataStringExpression}
| {type: "form-submit", form_id: string}

export type ISO8601ExtendedString = string;

export type TimedTriggerDataStringExpression =
| {type: "once", time: ISO8601ExtendedString}
| {type: "daily", time: ISO8601ExtendedString}
| {type: "weekly", time: ISO8601ExtendedString, dayOfWeek: number[]} // 0-6, mon-sun
// === end import ===

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
