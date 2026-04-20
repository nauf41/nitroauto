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
    <div className="string-builder">
      <button className="btn btn--sm" onClick={insertPart(0)}>{lang.stringBuilder.insert_head}</button>
      {props.value.parts.map((part, index) => (
        <div key={index} className="string-part">
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
          }} />
          <button className="btn btn--sm" onClick={insertPart(index+1)}>{lang.stringBuilder.insert_medium}</button>
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
          }} />
          <div className="nested-block">
            <StringBuilder value={props.part.template} args={[...props.args, ...(props.part.target.variable !== null ? getForEachVariables(props.part, props.part.target.variable) : [])]} setValue={(builder) => {
              if (props.part.type !== "each") return;
              props.setPart({...props.part, template: builder});
            }} />
          </div>
        </>
      )}
      { props.part.type === "if" && (
        <>
          <div className="nested-block nested-block--then">
            <div className="nested-block__label">{lang.stringBuilder.if}</div>
            <Condition condition={props.part.condition} args={props.args} setCondition={(condition) => {
              if (props.part.type !== "if") return;
              props.setPart({
                ...props.part,
                condition,
              });
            }} />
          </div>
          <div className="nested-block nested-block--then">
            <div className="nested-block__label">{lang.stringBuilder.then}</div>
            <StringBuilder value={props.part.then} args={props.args} setValue={(builder) => {
              if (props.part.type !== "if") return;
              props.setPart({
                ...props.part,
                then: builder,
              });
            }} />
          </div>
          <div className="nested-block nested-block--else">
            <div className="nested-block__label">{lang.stringBuilder.else}</div>
            <StringBuilder value={props.part.else} args={props.args} setValue={(builder) => {
              if (props.part.type !== "if") return;
              props.setPart({
                ...props.part,
                else: builder,
              })
            }} />
          </div>
        </>
      )}
      <button className="btn btn--sm btn--danger" onClick={props.deletePart}>✕</button>
    </>
  )
}