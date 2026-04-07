import type React from "react";
import { type Variable, type VariableSelector as TVariableSelector } from "../models/variables";
import { languageSetStore } from "../misc/langSet";
import type { ArrayVariableSelector, ArrayVariableSelector as TArrayVariableSelector } from "../models/variables";
import { Condition } from "./Condition";
import { getForEachVariables } from "../states/variables";

export function VariableSelector(props: {args: [Variable, string][], arg: TVariableSelector, setArg: (arg: TVariableSelector) => void}) {
  const getArgValue = (arg: Variable) => {
    if (arg.source === "default") return `default;${arg.index}`;
    if (arg.source === "trigger") return `trigger;${arg.index}`;
    if (arg.source === "action") return `action;${arg.from.id};${arg.index}`;
  }

  const onSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    if (value === "unselected") return;
    if (value.startsWith("default;")) props.setArg({...props.arg, filter: null, variable: props.args.find(arg => arg[0].source === "default" && value === `default;${arg[0].index}`)?.[0] ?? null});
    if (value.startsWith("trigger;")) props.setArg({...props.arg, filter: null, variable: props.args.find(arg => arg[0].source === "trigger" && value === `trigger;${arg[0].index}`)?.[0] ?? null});
    if (value.startsWith("action;"))  props.setArg({...props.arg, filter: null, variable: props.args.find(arg => arg[0].source === "action" && value === `action;${arg[0].from.id};${arg[0].index}`)?.[0] ?? null});
  }

  const onFilterActivatityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    if (!checked) {
      props.setArg({...props.arg, filter: null});
    } else {
      props.setArg({...props.arg, filter: {type: "value", value: true}});
    }
  }

  const lang = languageSetStore().getLanguageObject();

  return (
    <>
      <select value={(props.arg.variable && getArgValue(props.arg.variable)) ?? "unselected"} onChange={onSelectionChange}>
        <option value="unselected" disabled>{lang.argumentSelector.unselected}</option>
        { props.args.map(([arg, name], idx) => (
          <option key={idx} value={getArgValue(arg)}>{name ?? lang.variableSelector.unknown_variable}</option>
        ))}
      </select>
      { (props.arg.variable?.type.match(/^array<.*>$/) || props.arg.variable?.type.match(/^arraylength<.*>$/)) && (
        <>
          <input type="checkbox" checked={props.arg.filter!==null} onChange={onFilterActivatityChange} />
          { props.arg.filter !== null && (
            <>
              <Condition args={[...props.args, ...getForEachVariables(props.arg, props.arg.variable)]} condition={props.arg.filter} setCondition={(cond) => props.setArg({...props.arg, filter: cond})} />
            </>
          )}
        </>
      )}
    </>
  )
}

export type ArrayType = { type: `array<${string}>` };
export function ArrayVariableSelector(props: {args: [Variable, string][], arg: TVariableSelector, setArg: (arg: TArrayVariableSelector) => void}) {
  return (
    <VariableSelector args={props.args.filter(arg => arg[0].type.match(/^array<.*>$/))} arg={props.arg} setArg={(arg) => props.setArg(arg as TArrayVariableSelector)} />
  )
}
