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

export function newTrigger(type: Trigger["type"]): Trigger {
  switch (type) {
    case "timed":
      return {type: "timed", time: {type: "once", time: new Date()}}
    case "form-submit":
      return {type: "form-submit", form_id: ""}
  }
}
