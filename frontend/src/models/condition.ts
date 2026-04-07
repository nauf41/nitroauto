import type { Value } from "./value";
import type { VariableSelector } from "./variables";

export type BinaryComparisionOperator = "==" | "!=" | ">" | "<" | ">=" | "<=";
export const binaryComparisionOperators: BinaryComparisionOperator[] = ["==", "!=", ">", "<", ">=", "<="];

export type Condition =
| {type: "value", value: boolean}
| {type: "and", conditions: Condition[]}
| {type: "or", conditions: Condition[]}
| {type: "not", condition: Condition}
| {type: "compare", operator: BinaryComparisionOperator, left: VariableSelector, right: Value}

export function newCondition(): Condition {
  return {type: "value", value: true};
}