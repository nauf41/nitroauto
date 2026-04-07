import { languageSetStore } from "../misc/langSet";
import { newStringPart, type StringBuilder, type StringPart } from "../models/stringBuilder";
import type { Variable } from "../models/variables";
import { getForEachVariables } from "../states/variables";
import { Condition } from "./Condition";
import { ArrayVariableSelector, VariableSelector } from "./VariableSelector";

export function StringBuilder(props: {value: StringBuilder, setValue: (arg: StringBuilder) => void, args: [Variable, string][]}) {
  const lang = languageSetStore().getLanguageObject();

  const insertPart = (index: number, part?: StringPart["type"]) => () => {
    const ar = [...props.value.parts];
    ar.splice(index, 0, newStringPart(part));
    props.setValue({
      ...props.value,
      parts: ar,
    });
  }

  return (
    <div>
      <button onClick={insertPart(0)}>{lang.stringBuilder.insert_head}</button><br />
      {props.value.parts.map((part, index) => (
        <div key={index}>
          <StringPart args={props.args} part={part} setPart={(newPart) => {
            const ar = [...props.value.parts];
            ar[index] = newPart;
            props.setValue({
              ...props.value,
              parts: ar,
            });
          }} deletePart={() => {
            const ar = [...props.value.parts];
            ar.splice(index, 1);
            props.setValue({
              ...props.value,
              parts: ar,
            });
          }} /><br />
          <button onClick={insertPart(index+1)}>{lang.stringBuilder.insert_medium}</button>
        </div>
      ))}
    </div>
  )
}

export function StringPart(props: {part: StringPart, setPart: (arg: StringPart) => void, deletePart: () => void, args: [Variable, string][]}) {
  const lang = languageSetStore().getLanguageObject();

  const changeType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as StringPart["type"];
    props.setPart(newStringPart(type));
  }

  return (
    <>
      <select value={props.part.type} onChange={changeType}>
        <option value="static">{lang.stringBuilder.static}</option>
        <option value="variable">{lang.stringBuilder.variable}</option>
        <option value="line-break">{lang.stringBuilder.line_break}</option>
        <option value="each">{lang.stringBuilder.each}</option>
        <option value="if">{lang.stringBuilder.if}</option>
      </select>
      { props.part.type === "static" && (
        <input type="text" value={props.part.value} onChange={(e) => {
          if (props.part.type !== "static") return;
          props.setPart({
            ...props.part,
            value: e.target.value,
          });
        }} />
      )}
      { props.part.type === "variable" && (
        <VariableSelector args={props.args} arg={props.part.value} setArg={(arg) => {
          if (props.part.type !== "variable") return;
          props.setPart({
            ...props.part,
            value: arg,
          });
        }} />
      )}
      { props.part.type === "each" && (
        <>
          <ArrayVariableSelector args={props.args} arg={props.part.target} setArg={(arg) => {
            if (props.part.type !== "each") return;
            props.setPart({
              ...props.part,
              target: arg,
            });
          }} /><br />
          <StringBuilder value={props.part.template} args={[...props.args, ...(props.part.target.variable !== null ? getForEachVariables(props.part, props.part.target.variable) : [])]} setValue={(builder) => {
            if (props.part.type !== "each") return;
            props.setPart({...props.part, template: builder});
          }} />
        </>
      )}
      { props.part.type === "if" && (
        <>
          {lang.stringBuilder.if} <Condition condition={props.part.condition} args={props.args} setCondition={(condition) => {
            if (props.part.type !== "if") return;
            props.setPart({
              ...props.part,
              condition,
            });
          }} /><br />
          {lang.stringBuilder.then} <StringBuilder value={props.part.then} args={props.args} setValue={(builder) => {
            if (props.part.type !== "if") return;
            props.setPart({
              ...props.part,
              then: builder,
            });
          }} /><br />
          {lang.stringBuilder.else} <StringBuilder value={props.part.else} args={props.args} setValue={(builder) => {
            if (props.part.type !== "if") return;
            props.setPart({
              ...props.part,
              else: builder,
            })
          }} /><br />
        </>
      )}
      <button onClick={props.deletePart}>X</button>
    </>
  )
}