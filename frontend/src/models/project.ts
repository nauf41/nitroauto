import type { TimedTriggerData, TimedTriggerDataStringExpression, Trigger, TriggerStringExpression } from "./trigger"

export type Project = {
  id: number;
  title: string;
  trigger: Trigger;
  isActive: boolean;
}

export type ProjectStringExpression = {
  id: number;
  title: string;
  trigger: TriggerStringExpression;
  isActive: boolean;
}

export function projectToStringExpression(project: Project): ProjectStringExpression {
  return {
    id: project.id,
    title: project.title,
    trigger: triggerToStringExpression(project.trigger),
    isActive: project.isActive,
  }
}

export function triggerToStringExpression(trigger: Trigger): TriggerStringExpression {
  switch (trigger.type) {
    case "timed":
      return {
        type: "timed",
        time: timedTriggerDataToStringExpression(trigger.time),
      }
    case "form-submit":
      return {
        type: "form-submit",
        form_id: trigger.form_id.match(/^https:\/\/docs\.google\.com\/forms\/d\/([^/]+)\/.*/)?.[1] ?? "",
      }
  }
}

export function timedTriggerDataToStringExpression(data: TimedTriggerData): TimedTriggerDataStringExpression {
  switch (data.type) {
    case "once":
      return {
        type: "once",
        time: data.time.toISOString(),
      }
    case "daily":
      return {
        type: "daily",
        time: data.time.toISOString(),
      }
    case "weekly":
      return {
        type: "weekly",
        time: data.time.toISOString(),
        dayOfWeek: data.dayOfWeek,
      }
  }
}

export function projectFromStringExpression(expr: ProjectStringExpression): Project {
  return {
    id: expr.id,
    title: expr.title,
    trigger: triggerFromStringExpression(expr.trigger),
    isActive: expr.isActive,
  }
}

export function triggerFromStringExpression(expr: TriggerStringExpression): Trigger {
  switch (expr.type) {
    case "timed":
      return {
        type: "timed",
        time: timedTriggerDataFromStringExpression(expr.time),
      }
    case "form-submit":
      return {
        type: "form-submit",
        form_id: `https://docs.google.com/forms/d/${expr.form_id}/edit`,
      }
  }
}

export function timedTriggerDataFromStringExpression(expr: TimedTriggerDataStringExpression): TimedTriggerData {
  switch (expr.type) {
    case "once":
      return {
        type: "once",
        time: new Date(expr.time),
      }
    case "daily":
      return {
        type: "daily",
        time: new Date(expr.time),
      }
    case "weekly":
      return {
        type: "weekly",
        time: new Date(expr.time),
        dayOfWeek: expr.dayOfWeek,
      }
  }
}