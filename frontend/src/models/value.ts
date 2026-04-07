import type { VariableSelector } from "./variables";

export type ConstantValue = string | number | boolean;

export type Value =
| {type: "constant", value: ConstantValue}
| {type: "variable", variable: VariableSelector}
