import { languageSetStore } from "../misc/langSet";
import { newAction, type Action, type ActionDraft } from "../models/action";
import { Condition } from "./Condition";
import { type Condition as TCondition } from "../models/condition";
import type { ArrayVariableSelector as TArrayVariableSelector, Variable } from "../models/variables";
import { ArrayVariableSelector } from "./VariableSelector";
import { StringBuilder } from "./StringBuilder";
import { getVariablesForChildren, getVariablesForFollowing } from "../states/variables";
import { useNetState } from "../states/net";

export function Actions(props: {
  actions: Action[],
  insertAction: (index: number, action: Action) => void,
  editAction: (index: number, action: Action) => void,
  deleteAction: (index: number) => void,
  args: [Variable, string][],
}) {
  const lang = languageSetStore().getLanguageObject();

  return (
    <div className="actions">
      <button className="btn btn--sm actions__add-btn" onClick={() => props.insertAction(0, newAction("null"))}>{lang.action.add_head}</button>
      {
        props.actions.map((action, index) => {
          const aboveVars = props.actions.slice(0, index).flatMap(getVariablesForFollowing);
          const varsForChildren = getVariablesForChildren(action);
          const nowArgs = [...props.args, ...aboveVars, ...varsForChildren];
          return (
            <>
              <div key={index} className="action-block">
                <div className="action-block__header">
                  <select value={action.type} onChange={(e) => props.editAction(index, newAction(e.target.value as ActionDraft["type"]))}>
                    <option value="null">{lang.action.null}</option>
                    <option value="if">{lang.action.if}</option>
                    <option value="foreach">{lang.action.foreach}</option>
                    <option value="send-webhook">{lang.action.send_webhook}</option>
                    <option value="get-schedule">{lang.action.get_schedule}</option>
                  </select>
                </div>
                { action.type === "if" && (
                  <IfAction action={action} setAction={(arg) => props.editAction(index, arg)} args={nowArgs} />
                )}
                { action.type === "foreach" && (
                  <ForEachAction action={action} setAction={(arg) => props.editAction(index, arg)} args={nowArgs} />
                )}
                { action.type === "send-webhook" && (
                  <SendWebhookAction action={action} setAction={(arg) => props.editAction(index, arg)} args={nowArgs} />
                )}
                { action.type === "get-schedule" && (
                  <GetSchedulesAction action={action} setAction={(arg) => props.editAction(index, arg)} args={nowArgs} />
                )}
                <div className="action-block__footer">
                  <button className="btn btn--sm btn--danger" onClick={() => props.deleteAction(index)}>{lang.action.delete_this}</button>
                </div>
              </div>
            <button className="btn btn--sm actions__add-btn" onClick={() => props.insertAction(index+1, newAction("null"))}>{lang.action.add_medium}</button>
            </>
          )
        })
      }
    </div>
  )
}

export function IfAction(props: {action: Action, setAction: (arg: Action) => void, args: [Variable, string][]}) {
  const lang = languageSetStore().getLanguageObject();

  if (props.action.type !== "if") return <></>;

  const updateCondition = (condition: TCondition) => {
    if (props.action.type !== "if") return;
    props.setAction({
      ...props.action,
      condition,
    });
  }

  const insertThenAction = (index: number, action: Action) => {
    if (props.action.type !== "if") return;
    const then = [...props.action.then];
    then.splice(index, 0, action);
    props.setAction({
      ...props.action,
      then,
    });
  }

  const editThenAction = (index: number, action: Action) => {
    if (props.action.type !== "if") return;
    const then = [...props.action.then];
    then[index] = action;
    props.setAction({
      ...props.action,
      then,
    });
  }

  const deleteThenAction = (index: number) => {
    if (props.action.type !== "if") return;
    const then = [...props.action.then];
    then.splice(index, 1);
    props.setAction({
      ...props.action,
      then,
    });
  }

  const insertElseAction = (index: number, action: Action) => {
    if (props.action.type !== "if") return;
    const else_ = [...props.action.else];
    else_.splice(index, 0, action);
    props.setAction({
      ...props.action,
      else: else_,
    });
  }

  const editElseAction = (index: number, action: Action) => {
    if (props.action.type !== "if") return;
    const else_ = [...props.action.else];
    else_[index] = action;
    props.setAction({
      ...props.action,
      else: else_,
    });
  }

  const deleteElseAction = (index: number) => {
    if (props.action.type !== "if") return;
    const else_ = [...props.action.else];
    else_.splice(index, 1);
    props.setAction({
      ...props.action,
      else: else_,
    });
  }

  return (
    <div>
      <div className="nested-block nested-block--then">
        <div className="nested-block__label">{lang.if.if}</div>
        <Condition condition={props.action.condition} setCondition={updateCondition} args={props.args} />
      </div>
      <div className="nested-block nested-block--then">
        <div className="nested-block__label">{lang.if.then}</div>
        <Actions actions={props.action.then} insertAction={insertThenAction} editAction={editThenAction} deleteAction={deleteThenAction} args={props.args} />
      </div>
      { props.action.else.length === 0 && (
        <button className="btn btn--sm" onClick={() => insertElseAction(0, newAction("null"))}>{lang.if.add_else}</button>
      )}
      { props.action.else.length > 0 && (
        <div className="nested-block nested-block--else">
          <div className="nested-block__label">{lang.if.else}</div>
          <Actions actions={props.action.else} insertAction={insertElseAction} editAction={editElseAction} deleteAction={deleteElseAction} args={props.args} />
        </div>
      )}
    </div>
  )
}

export function ForEachAction(props: {action: Action, setAction: (arg: Action) => void, args: [Variable, string][]}) {
  const lang = languageSetStore().getLanguageObject();

  if (props.action.type !== "foreach") return <></>;

  const setArgument = (arg: TArrayVariableSelector) => {
    if (props.action.type !== "foreach") return;
    props.setAction({
      ...props.action,
      target: arg
    });
  } // TODO actions本体を実装

  return (
    <div className="nested-block">
      <div className="nested-block__label">{lang.foreach.foreach}</div>
      <ArrayVariableSelector args={props.args} arg={props.action.target} setArg={setArgument} />
    </div>
  )
}

export function SendWebhookAction(props: {action: Action, setAction: (arg: Action) => void, args: [Variable, string][]}) {
  const lang = languageSetStore().getLanguageObject();

  if (props.action.type !== "send-webhook") return <></>;

  const setUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (props.action.type !== "send-webhook") return;
    props.setAction({
      ...props.action,
      target: e.target.value,
    });
  }

  return (
    <div className="action-row">
      <label>{lang.sendWebhookAction.url}</label>
      <input type="text" value={props.action.target} onChange={setUrl} size={50} />
      <label>{lang.sendWebhookAction.message}</label>
      <StringBuilder value={props.action.value} setValue={(value) => {
        if (props.action.type !== "send-webhook") return;
        props.setAction({
          ...props.action,
          value,
        });
      }} args={props.args} />
    </div>
  )
}

export function GetSchedulesAction(props: {action: Action, setAction: (arg: Action) => void, args: [Variable, string][]}) {
  const lang = languageSetStore().getLanguageObject();
  const calendars = useNetState().calendars;

  if (props.action.type !== "get-schedule") return <></>;
  return (
    <div className="action-row">
      <label>{lang.getSchedulesAction.calendar}</label>
      <select value={props.action.calendar_id} onChange={e => props.action.type === "get-schedule" && props.setAction({...props.action, calendar_id: e.target.value, calendar_name: calendars.find(cal => cal.id === e.target.value)?.name ?? ""})}>
        { calendars.map(cal => <option key={cal.id} value={cal.id} style={{color: cal.color}}>{cal.name}</option>)}
      </select>
      <label>{lang.getSchedulesAction.dateOffset}</label>
      <input type="number" step={1} value={props.action.fordayOffset} onChange={(e) => props.action.type === "get-schedule" && props.setAction({...props.action, fordayOffset: e.target.valueAsNumber})} />
    </div>
  )
}