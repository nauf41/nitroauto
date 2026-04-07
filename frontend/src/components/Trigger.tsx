import type React from "react";
import { languageSetStore } from "../misc/langSet";
import { newTrigger, type TimedTriggerData, type Trigger as TTrigger } from "../models/trigger";
import { getLocaleDateTimeString, parseLocaleDateTimeString } from "../misc/timeUtils";

export function Trigger(props: {trigger: TTrigger | null, setTrigger: (arg: TTrigger) => void}) {
  const onTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as TTrigger["type"];
    props.setTrigger(newTrigger(value));
  }
  const lang = languageSetStore().getLanguageObject();

  return (
    <div>
      <select value={props.trigger?.type ?? "unselected"} onChange={onTypeChange}>
        <option value="unselected" disabled>{lang.triggerSelector.unselected}</option>
        <option value="timed">{lang.triggerSelector.timed}</option>
        <option value="form-submit">{lang.triggerSelector.form_submit}</option>
      </select>
      { props.trigger?.type === "timed" && <TimedTrigger trigger={props.trigger} setTrigger={props.setTrigger} /> }
      { props.trigger?.type === "form-submit" && <input type="text" value={props.trigger.form_id} onChange={e => {
        props.setTrigger({type: "form-submit", form_id: e.target.value});
    }} /> }
    </div>
  )
}

export function TimedTrigger(props: {trigger: TTrigger, setTrigger: (arg: TTrigger) => void}) {
  const lang = languageSetStore().getLanguageObject();
  if (props.trigger.type !== "timed") return <></>;

  const onTimeTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (props.trigger.type !== "timed") return;

    let newData: TimedTriggerData;
    switch (e.target.value) {
      case "once":
        newData = {type: "once", time: new Date()};
        break;
      case "daily":
        newData = {type: "daily", time: new Date()};
        break;
      case "weekly":
        newData = {type: "weekly", time: new Date(), dayOfWeek: []};
        break;
      default:
        return;
    }

    props.setTrigger({
      ...props.trigger,
      time: newData,
    });
  }

  const dayOfWeek = (index: number) => {
    if (props.trigger.type !== "timed") return false;
    if (props.trigger.time.type !== "weekly") return false;
    return props.trigger.time.dayOfWeek.includes(index);
  }

  const onDayOfWeekChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const to = e.target.checked;
    if (props.trigger.type !== "timed") return;
    if (props.trigger.time.type !== "weekly") return;
    let newDayOfWeek: number[];
    if (to && !props.trigger.time.dayOfWeek.includes(index)) {
      newDayOfWeek = [...props.trigger.time.dayOfWeek, index];
    } else if (!to && props.trigger.time.dayOfWeek.includes(index)) {
      newDayOfWeek = props.trigger.time.dayOfWeek.filter(i => i !== index);
    }

    props.setTrigger({
      ...props.trigger,
      time: {
        ...props.trigger.time,
        dayOfWeek: newDayOfWeek!,
      }
    });
  }

  const onOnceTimeChange = (e: React.FocusEvent<HTMLInputElement>) => {
    if (props.trigger.type !== "timed") return;
    if (props.trigger.time.type !== "once") return;

    if (e.target.value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      const newTime = new Date(parseLocaleDateTimeString(e.target.value));
      props.setTrigger({
        ...props.trigger,
        time: {
          ...props.trigger.time,
          time: newTime,
        }
      });
    }
  }

  const onRepeatTimeChange = (e: React.FocusEvent<HTMLInputElement>) => {
    console.log(`received blue event:`, e);
    if (props.trigger.type !== "timed") return;
    if (props.trigger.time.type === "once") return;

    const [hours, minutes] = e.target.value.split(":").map(Number);
    console.log(`parsed time:`, hours, minutes);
    if ([hours, minutes].every(v => v != null && !isNaN(v) && v != undefined)) {
      const newTime = new Date(props.trigger.time.time);
      console.log("created time: ", newTime);
      newTime.setHours(hours);
      console.log("set hour: ", newTime);
      newTime.setMinutes(minutes);
      console.log("set minute: ", newTime);

      props.setTrigger({
        ...props.trigger,
        time: {
          ...props.trigger.time,
          time: newTime,
        }
      });
    }
  }

  return (
    <>
      <select value={props.trigger.time.type} onChange={onTimeTypeChange}>
        <option value="once">{lang.triggerSelector.once}</option>
        <option value="daily">{lang.triggerSelector.daily}</option>
        <option value="weekly">{lang.triggerSelector.weekly}</option>
      </select>
      {props.trigger.time.type === "once" && (
        <input type="datetime-local" defaultValue={getLocaleDateTimeString(props.trigger.time.time)} onBlur={onOnceTimeChange} />
      )}
      {props.trigger.time.type === "weekly" && (
        [lang.triggerSelector.sunday, lang.triggerSelector.monday, lang.triggerSelector.tuesday, lang.triggerSelector.wednesday, lang.triggerSelector.thursday, lang.triggerSelector.friday, lang.triggerSelector.saturday].map((day, index) => (
          <span key={index}>
            <input key={index} type="checkbox" checked={dayOfWeek(index)} onChange={onDayOfWeekChange(index)} /> {day}
          </span>
        ))
      )}
      {(props.trigger.time.type === "daily" || props.trigger.time.type === "weekly") && (
        <input type="time" value={`${props.trigger.time.time.getHours().toString().padStart(2, "0")}:${props.trigger.time.time.getMinutes().toString().padStart(2, "0")}`} onChange={onRepeatTimeChange} />
      )}
    </>
  )
}
