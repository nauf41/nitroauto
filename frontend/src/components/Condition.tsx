import { useEffect } from "react";
import { languageSetStore } from "../misc/langSet";
import { binaryComparisionOperators, type BinaryComparisionOperator, type Condition, type Condition as TCondition } from "../models/condition";
import { newVariableSelector, type Variable } from "../models/variables";
import { VariableSelector } from "./VariableSelector";

export function Condition(props: {condition: TCondition, setCondition: (arg: TCondition) => void, deleteCondition?: () => void, args: [Variable, string][]}) {
  const lang = languageSetStore().getLanguageObject();

  const onConditionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    switch (e.target.value) {
      case "true":
        props.setCondition({type: "value", value: true});
        break;
      case "false":
        props.setCondition({type: "value", value: false});
        break;
      case "and":
        props.setCondition({type: "and", conditions: []});
        break;
      case "or":
        props.setCondition({type: "or", conditions: []});
        break;
      case "not":
        props.setCondition({type: "not", condition: {type: "value", value: true}});
        break;
      case "compare":
        props.setCondition({type: "compare", operator: "==", left: newVariableSelector(), right: {type: "variable", variable: newVariableSelector()}});
        break;
    }
  }

  const leftType = props.condition.type === "compare" ? props.condition.left.variable?.type : null;
  useEffect(() => {
    if (props.condition.type === "compare" && props.condition.right.type === "constant") {
      switch (leftType) {
        case "string":
          if (typeof props.condition.right.value !== "string") {
            props.setCondition({...props.condition, right: {type: "constant", value: ""}});
          }
          break;
        case "number": case "arraylength<schedule>":
          if (typeof props.condition.right.value !== "number") {
            props.setCondition({...props.condition, right: {type: "constant", value: 0}});
          }
          break;
        case "boolean":
          if (typeof props.condition.right.value !== "boolean") {
            props.setCondition({...props.condition, right: {type: "constant", value: false}});
          }
          break;
        case "color":
          if (typeof props.condition.right.value !== "string" || !["lavender", "sage", "grape", "flamingo", "banana", "tangerine", "peacock", "graphite", "blueberry", "basil", "tomato"].includes(props.condition.right.value)) {
            props.setCondition({...props.condition, right: {type: "constant", value: "peacock"}}); // default color
          }
          break;
        default: // 定数表現を実装しない型の場合
          props.setCondition({...props.condition, right: {type: "constant", value: ""}});
      }
    }
  }, [leftType]);

  const getSelectionValue = () => {
    switch (props.condition.type) {
      case "value":
        return props.condition.value ? "true" : "false";
      case "and":
        return "and";
      case "or":
        return "or";
      case "not":
        return "not";
      case "compare":
        return "compare";
    }
  }

  const conditionInsert = (index: number) => () => {
    if (props.condition.type === "and" || props.condition.type === "or") {
      const newCondition: TCondition = {type: "value", value: true};
      const ar = [...props.condition.conditions];
      ar.splice(index, 0, newCondition);
      props.setCondition({...props.condition, conditions: ar});
    }
  }

  // === ADD / OR ===
  const conditionDelete = (index: number) => () => {
    if (props.condition.type === "and" || props.condition.type === "or") {
      const ar = [...props.condition.conditions];
      ar.splice(index, 1);
      props.setCondition({...props.condition, conditions: ar});
    }
  }

  const setCondition = (index: number) => (condition: TCondition) => {
    if (props.condition.type === "and" || props.condition.type === "or") {
      const ar = [...props.condition.conditions];
      ar[index] = condition;
      props.setCondition({...props.condition, conditions: ar});
    }
  }
  // ===

  // === NOT ===
  const setNotCondition = (condition: TCondition) => {
    if (props.condition.type === "not") {
      const conditions = {...props.condition};
      conditions.condition = condition;
      props.setCondition(conditions);
    }
  }
  // ===

  return (
    <>
      <select value={getSelectionValue()} onChange={onConditionTypeChange}>
        <option value="true">{lang.conditionSelector.true}</option>
        <option value="false">{lang.conditionSelector.false}</option>
        <option value="and">{lang.conditionSelector.and}</option>
        <option value="or">{lang.conditionSelector.or}</option>
        <option value="not">{lang.conditionSelector.not}</option>
        <option value="compare">{lang.conditionSelector.compare}</option>
      </select>
      { (props.condition.type === "and" || props.condition.type === "or") && (
        <>
          <button onClick={conditionInsert(0)}>{lang.conditionSelector.add_front}</button>
          { props.condition.conditions.map((cond, idx) => (
            <span key={idx}>
              <Condition key={idx} condition={cond} setCondition={setCondition(idx)} deleteCondition={conditionDelete(idx)} args={props.args} />
              <button onClick={conditionInsert(idx+1)}>{lang.conditionSelector.add_medium}</button>
            </span>
          ))}
        </>
      )}
      { props.condition.type === "not" && (
        <Condition condition={props.condition.condition} setCondition={setNotCondition} args={props.args} />
      )}
      { props.condition.type === "compare" && (
        <>
          <VariableSelector args={props.args} arg={props.condition.left} setArg={(arg) => props.condition.type === "compare" && props.setCondition({...props.condition, left: arg})} />
          <select value={props.condition.operator} onChange={(e) => props.condition.type === "compare" && props.setCondition({...props.condition, operator: e.target.value as BinaryComparisionOperator})}>
            { binaryComparisionOperators.map((op, idx) => (
              <option key={idx} value={op}>{op}</option>
            )) }
          </select>
          <select value={props.condition.right.type} onChange={(e) => {
            if (props.condition.type !== "compare") return;
            if (e.target.value !== props.condition.right.type) {
              if (e.target.value === "constant") {
                switch (props.condition.left.variable?.type) {
                  case "string":
                    props.setCondition({...props.condition, right: {type: "constant", value: ""}});
                    break;
                  case "number": case "arraylength<schedule>":
                    props.setCondition({...props.condition, right: {type: "constant", value: 0}});
                    break;
                  case "boolean":
                    props.setCondition({...props.condition, right: {type: "constant", value: false}});
                    break;
                  case "color":
                    props.setCondition({...props.condition, right: {type: "constant", value: "Peacock"}});
                    break;
                  default:
                    props.setCondition({...props.condition, right: {type: "constant", value: ""}});
                }
              } else if (e.target.value === "variable") {
                props.setCondition({...props.condition, right: {type: "variable", variable: newVariableSelector()}});
              }
            }
          }}>
            { props.condition.left.variable && ["string", "number", "boolean", "color", "arraylength<schedule>"].includes(props.condition.left.variable.type) &&
            <option value="constant">{lang.conditionSelector.constant}</option>
            }
            <option value="variable">{lang.conditionSelector.variable}</option>
          </select>
          { props.condition.right.type === "variable" && (
            <VariableSelector args={props.args} arg={props.condition.right.variable} setArg={(arg) => props.condition.type === "compare" && props.setCondition({...props.condition, right: {type: "variable", variable: arg}})} />
          )}
          { props.condition.left.variable && props.condition.right.type === "constant" && props.condition.left.variable.type === "string" && (
            <input type="text" value={props.condition.right.value as string} onChange={(e) => props.condition.type === "compare" && props.condition.right.type === "constant" && props.setCondition({...props.condition, right: {...props.condition.right, value: e.target.value }})} />
          )}
          { props.condition.left.variable && props.condition.right.type === "constant" && (props.condition.left.variable.type === "number" || props.condition.left.variable.type === "arraylength<schedule>") && (
            <input type="number" value={props.condition.right.value as number} onChange={(e) => props.condition.type === "compare" && props.condition.right.type === "constant" && props.setCondition({...props.condition, right: {...props.condition.right, value: Number(e.target.value) }})} />
          )}
          { props.condition.left.variable && props.condition.right.type === "constant" && props.condition.left.variable.type === "boolean" && (
            <select value={props.condition.right.value as boolean ? "true" : "false"} onChange={(e) => props.condition.type === "compare" && props.condition.right.type === "constant" && props.setCondition({...props.condition, right: {...props.condition.right, value: e.target.value === "true" }})}>
              <option value="true">{lang.conditionSelector.true}</option>
              <option value="false">{lang.conditionSelector.false}</option>
            </select>
          )}
          { props.condition.left.variable && props.condition.right.type === "constant" && props.condition.left.variable.type === "color" && (
            <select value={(props.condition.right.value) as string} onChange={(e) => props.condition.type === "compare" && props.condition.right.type === "constant" && props.setCondition({...props.condition, right: {...props.condition.right, value: e.target.value}})}>
              <option value="lavender" className="lavender">{lang.color.lavender}</option>
              <option value="sage" className="sage">{lang.color.sage}</option>
              <option value="grape" className="grape">{lang.color.grape}</option>
              <option value="flamingo" className="flamingo">{lang.color.flamingo}</option>
              <option value="banana" className="banana">{lang.color.banana}</option>
              <option value="tangerine" className="tangerine">{lang.color.tangerine}</option>
              <option value="peacock" className="peacock">{lang.color.peacock}</option>
              <option value="graphite" className="graphite">{lang.color.graphite}</option>
              <option value="blueberry" className="blueberry">{lang.color.blueberry}</option>
              <option value="basil" className="basil">{lang.color.basil}</option>
              <option value="tomato" className="tomato">{lang.color.tomato}</option>
            </select>
           )}
        </>
      ) }
      {props.deleteCondition && <button onClick={props.deleteCondition}>{lang.conditionSelector.delete_this}</button>}
    </>
  )
}
