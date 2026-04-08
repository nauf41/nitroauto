import {stringFrom, type TriggerStoreStructure, type CodeStore, type TypedValue, type JsonStringified, type RuntimeContext } from "./runtimeStructure";
import type { ActionStructure, ConditionStructure, StringBuilderStructure, StringPartStructure, TriggerStringExpression, VariableSelectorStructure } from "./structure";

export function prepare_next_trigger(e: GoogleAppsScript.Events.TimeDriven | GoogleAppsScript.Events.FormsOnFormSubmit) {
  const delete_this_trigger = () => ScriptApp.getProjectTriggers().filter(trigger => trigger.getUniqueId() === e.triggerUid).forEach(trigger => ScriptApp.deleteTrigger(trigger));
  let result_trig = null;
  const trigger = (JSON.parse(PropertiesService.getScriptProperties().getProperty('triggers')!) as {triggerId: string, triggerObject: string, projectId: number}[])
    .find(trigger => trigger.triggerId === e.triggerUid)!;
  const trig_obj = JSON.parse(trigger.triggerObject) as TriggerStringExpression;
  switch (trig_obj.type) {
    case "form-submit": break;
    case "timed": {
      switch (trig_obj.time.type) {
        case "once": {
          delete_this_trigger();
          break;
        }
        case "daily": {
          const tim = new Date();
          const tim_trig = new Date(trig_obj.time.time);
          tim.setHours(tim_trig.getHours());
          tim.setMinutes(tim_trig.getMinutes());
          tim.setSeconds(0);
          if (tim.getTime() <= (new Date()).getTime() + 10 * 1000) {
            tim.setDate(tim.getDate() + 1);
          }
          const trig = ScriptApp.newTrigger('trigger_timed').timeBased().at(tim).create();
          result_trig = {triggerId: trig.getUniqueId(), triggerObject: JSON.stringify(trig_obj), projectId: trigger.projectId};
          break;
        }
        case "weekly": {
          const tim = new Date();
          const tim_trig = new Date(trig_obj.time.time);
          tim.setHours(tim_trig.getHours());
          tim.setMinutes(tim_trig.getMinutes());
          tim.setSeconds(0);
          if (tim.getTime() < (new Date()).getTime() + 10 * 1000) {
            tim.setDate(tim.getDate() + 1);
          }

          for (let i = 0; i < 100; i++) {
            if (trig_obj.time.dayOfWeek.includes(tim.getDay())) break;
            tim.setDate(tim.getDate() + 1);
          }

          const trig = ScriptApp.newTrigger('trigger_timed').timeBased().at(tim).create();
          result_trig = {triggerId: trig.getUniqueId(), triggerObject: JSON.stringify(trig_obj), projectId: trigger.projectId};
          break;
        }
      }
    }
  }

  if (result_trig !== null) {
    const lock = LockService.getScriptLock();
    lock.waitLock(300 * 1000);
    const triggers = JSON.parse(PropertiesService.getScriptProperties().getProperty('triggers')!) as TriggerStoreStructure[];
    const new_triggers = triggers.map(trigger => trigger.triggerId === e.triggerUid ? result_trig : trigger);
    PropertiesService.getScriptProperties().setProperty('triggers', JSON.stringify(new_triggers));
  }
}

export function trigger_timed(e: GoogleAppsScript.Events.TimeDriven) {
  //try {
    const tim = new Date();

    const triggers = JSON.parse(PropertiesService.getScriptProperties().getProperty('triggers')!) as TriggerStoreStructure[];
    const project_id = triggers.find(trigger => trigger.triggerId === e.triggerUid)!.projectId;
    const code = PropertiesService.getScriptProperties().getProperty(`project_${project_id}`)!;

    runner(tim, [], code);
  //} catch (e) {
  //  Logger.log(`Error in trigger_timed: ${e}`);
  //} finally {
    prepare_next_trigger(e);
  //}
}

export function trigger_onFormSubmit(e: GoogleAppsScript.Events.FormsOnFormSubmit) {
  //try {
    const tim = new Date();

    const trig_vars: TypedValue[] = e.response.getItemResponses().map(itemResponse => ["string", itemResponse.getResponse().toString()]);
    const triggerProperty = JSON.parse(PropertiesService.getScriptProperties().getProperty('triggers')!) as TriggerStoreStructure[];
    const projectId = triggerProperty.find(trigger => trigger.triggerId === e.triggerUid)!.projectId;
    const code = PropertiesService
        .getScriptProperties()
        .getProperty(`project_${projectId}`)!;

    runner(tim, trig_vars, code);
  //} catch (e) {
  //  Logger.log(`Error in trigger_onFormSubmit: ${e}`);
  //} finally {
    prepare_next_trigger(e);
  //}
}

export function runner(tim: Date, trig_vars: TypedValue[], code: JsonStringified<CodeStore | []>) {
  if (code === "[]") {
    return;
  }

  const [trigger, flow, actions] = JSON.parse(code) as CodeStore;
  if (!flow || flow.length === 0) return;

  const context: RuntimeContext = {
    callStack: [],
    defaultVariables: [["date", tim]],
    triggerVariables: trig_vars,
    actionVariablesForFollowing: [],
    actionVariablesForChildren: [],
    actions,
  }

  for (const now of flow) {
    context.callStack.push(now);
    executeAction(context.actions.find(action => action[0] === now)![1], context);
    context.callStack.pop();
  }
}

export function executeAction(code: ActionStructure, context: RuntimeContext) {
  Logger.log(`Executing Action: ${JSON.stringify(code)}`);
  if (typeof code === "number") return;
  switch (code[0]) {
    case "i": {
      context.callStack.push(code[4]);
      if (evaluateCondition(code[1], context)) {
        for (const id of code[2]) {
          executeAction(context.actions.find((v) => v[0] === id)![1], context);
        }
      } else {
        for (const id of code[3]) {
          executeAction(context.actions.find((v) => v[0] === id)![1], context);
        }
      }
      context.callStack.pop();
      break;
    }
    case "e": {
      const array = evaluateVariableSelector(code[1], context);
      if (array === null || array[0] !== "array<schedule>") break;
      for (let i = 0; i < array[1].length; i++) {
        context.actionVariablesForChildren.push([code[3], getForEachVariables(array, i)]);
        for (const id of code[2]) {
          executeAction(context.actions.find((v) => v[0] === id)![1], context);
        }
        context.actionVariablesForChildren.pop();
      }
      break;
    }
    case "s": {
      const target = code[1];
      const text = evaluateStringBuilder(code[2], context);

      Logger.log(`Sending webhook\nTarget: ${target}\nText: ${text}`);
      UrlFetchApp.fetch(target, {
        method: "post",
        headers: {'Content-Type': 'application/json; charset=UTF-8'},
        payload: JSON.stringify({"text": text}),
      });
      break;
    }
    case "g": {
      const calendar = CalendarApp.getCalendarById(code[1]);
      if (!calendar) break;
      const events = calendar.getEventsForDay(new Date(Date.now() + code[3] * 24 * 60 * 60 * 1000));
      context.actionVariablesForFollowing.push([code[4], [["array<schedule>", events], ["arraylength<schedule>", events]]]);
      break;
    }
  }
}

export function evaluateCondition(code: ConditionStructure, context: RuntimeContext): boolean {
  Logger.log(`Processing: ${JSON.stringify(code)}`);
  Logger.log(`Variables: ${JSON.stringify(context)}`);
  if (typeof code === "boolean") return code;
  switch (code[0]) {
    case "a": {
      for (const sub_code of code[1]) {
        if (!evaluateCondition(sub_code, context)) {
          return false;
        }
      }
      return true;
    }
    case "o": {
      for (const sub_code of code[1]) {
        if (evaluateCondition(sub_code, context)) {
          return true;
        }
      }
      return false;
    }
    case "n": {
      return !evaluateCondition(code[1], context);
    }
    case "c": {
      const left = evaluateVariableSelector(code[2], context);
      const right = (() => {
        if (typeof code[3] === "string" || typeof code[3] === "number" || typeof code[3] === "boolean") {
          return [typeof code[3], code[3]] as TypedValue;
        } else {
          return evaluateVariableSelector(code[3], context);
        }
      })();

      Logger.log(`Comparing ${JSON.stringify([left, code[1], right])}`);

      const res = (() => {switch (code[1]) {
        case "==": {
          if (left === null) {
            return right === null;
          } else if (right === null) {
            return false;
          } else {
            if (left[0] === "string" && right[0] === "string" || left[0] === "number" && right[0] === "number" || left[0] === "boolean" && right[0] === "boolean" || left[0] === "color" && right[0] === "color") {
              return left[1] === right[1];
            } else if (left[0] === "date" && right[0] === "date") {
              return left[1].getTime() === right[1].getTime();
            } else if (left[0] === "schedule" && right[0] === "schedule") {
              return left[1].getId() === right[1].getId();
            } else if (left[0] === "array<schedule>" && right[0] === "array<schedule>") {
              if (left[1].length !== right[1].length) return false;
              for (let i = 0; i < left[1].length; i++) {
                if (left[1][i]?.getId() !== right[1][i]?.getId()) {
                  return false;
                }
              }
              return true;
            } else if (left[0] === "arraylength<schedule>" && right[0] === "arraylength<schedule>") {
              return left[1].length === right[1].length;
            } else if (left[0] === "arraylength<schedule>" && right[0] === "number") {
              return left[1].length === right[1];
            } else {
              return false;
            }
          }
        }
        case "!=": {
          return !(() => {if (left === null) {
            return right === null;
          } else if (right === null) {
            return false;
          } else {
            if (left[0] === "string" && right[0] === "string" || left[0] === "number" && right[0] === "number" || left[0] === "boolean" && right[0] === "boolean" || left[0] === "color" && right[0] === "color") {
              return left[1] === right[1];
            } else if (left[0] === "date" && right[0] === "date") {
              return left[1].getTime() === right[1].getTime();
            } else if (left[0] === "schedule" && right[0] === "schedule") {
              return left[1].getId() === right[1].getId();
            } else if (left[0] === "array<schedule>" && right[0] === "array<schedule>") {
              if (left[1].length !== right[1].length) return false;
              for (let i = 0; i < left[1].length; i++) {
                if (left[1][i]?.getId() !== right[1][i]?.getId()) {
                  return false;
                }
              }
              return true;
            } else if (left[0] === "arraylength<schedule>" && right[0] === "arraylength<schedule>") {
              return left[1].length === right[1].length;
            } else if (left[0] === "arraylength<schedule>" && right[0] === "number") {
              return left[1].length === right[1];
            } else {
              return false;
            }
          }})();
        }
        case ">": {
          if (left === null || right === null) return false;
          if (left[0] === "string" && right[0] === "string" || left[0] === "number" && right[0] === "number" || left[0] === "color" && right[0] === "color" || left[0] === "date" && right[0] === "date") {
            return left[1] > right[1];
          }
          if (left[0] === "arraylength<schedule>" && right[0] === "arraylength<schedule>") {
            return left[1].length > right[1].length;
          }
          if (left[0] === "arraylength<schedule>" && right[0] === "number") {
            return left[1].length > right[1];
          }

          return false;
        }
        case "<": {
          if (left === null || right === null) return false;
          if (left[0] === "string" && right[0] === "string" || left[0] === "number" && right[0] === "number" || left[0] === "color" && right[0] === "color" || left[0] === "date" && right[0] === "date") {
            return left[1] < right[1];
          }
          if (left[0] === "arraylength<schedule>" && right[0] === "arraylength<schedule>") {
            return left[1].length < right[1].length;
          }
          if (left[0] === "arraylength<schedule>" && right[0] === "number") {
            return left[1].length < right[1];
          }

          return false;
        }
        case ">=": {
          if (left === null || right === null) return false;
          if (left[0] === "string" && right[0] === "string" || left[0] === "number" && right[0] === "number" || left[0] === "color" && right[0] === "color" || left[0] === "date" && right[0] === "date") {
            return left[1] >= right[1];
          }
          if (left[0] === "arraylength<schedule>" && right[0] === "arraylength<schedule>") {
            return left[1].length >= right[1].length;
          }
          if (left[0] === "arraylength<schedule>" && right[0] === "number") {
            return left[1].length >= right[1];
          }

          return false;
        }
        case "<=": {
          if (left === null || right === null) return false;
          if (left[0] === "string" && right[0] === "string" || left[0] === "number" && right[0] === "number" || left[0] === "color" && right[0] === "color" || left[0] === "date" && right[0] === "date") {
            return left[1] <= right[1];
          }
          if (left[0] === "arraylength<schedule>" && right[0] === "arraylength<schedule>") {
            return left[1].length <= right[1].length;
          }
          if (left[0] === "arraylength<schedule>" && right[0] === "number") {
            return left[1].length <= right[1];
          }

          return false;
        }
      }
      })();

      Logger.log(`Condition result: ${res}`);
      return res;
    }
  }
}

export function evaluateVariableSelector(code: VariableSelectorStructure, context: RuntimeContext): TypedValue | null {
  if (code[1] !== null && code[1] != undefined) {
    let v: TypedValue | null = null;
    if (code[1][0] === -2) {
      v = context.defaultVariables[code[1][1]]!;
    } else if (code[1][0] === -1) {
      v = context.triggerVariables[code[1][1]]!;
    } else {
      Logger.log(`Searching for ${code[1][0]}, ${code[1][1]}`);
      if (context.callStack.includes(code[1][0])) {
        v = context.actionVariablesForChildren.find(val => val[0] === code[1]![0])![1][code[1][1]]!;
      } else {
        v = context.actionVariablesForFollowing.find(val => val[0] === code[1]![0])![1][code[1][1]]!;
      }
    }

    Logger.log(`Variable: ${JSON.stringify(v)}`);

    if (code[2] !== null && (v[0] === "array<schedule>" || v[0] === "arraylength<schedule>")) {
      context.callStack.push(code[0]);
      const res = v[1].filter((now, idx) => {
        context.actionVariablesForChildren.push([code[0], getForEachVariables(v, idx)]);
        const isOk = evaluateCondition(code[2]!, context);
        context.actionVariablesForChildren.pop();
        Logger.log(`Result: ${isOk} for index ${idx} (left-hand: ${JSON.stringify(v[1][idx])}`);
        return isOk;
      });
      context.callStack.pop();
      return [v[0], res];
    } else {
      return v;
    }
  } else {
    return null;
  }
}

export function getForEachVariables(v: TypedValue, idx: number): TypedValue[] {
  if (v[0] === "array<schedule>" || v[0] === "arraylength<schedule>") {
    return [
      ["string", v[1][idx]!.getTitle()],
      ["string", generatePeriod(
        v[1][idx]!.getStartTime(),
        v[1][idx]!.getEndTime()
      )],
      ["boolean", v[1][idx]!.isAllDayEvent()],
      ["string", getColorStringFromIndex(v[1][idx]!.getColor())]
    ];
  } else {
    return [["string", v[idx]!.toString()]]; // never reaches here
  }
}

export function generatePeriod(start: GoogleAppsScript.Base.Date, end: GoogleAppsScript.Base.Date): string {
  return `${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")} - ${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;
}

export function getColorStringFromIndex(index: string): string {
  return ["lavender", "sage", "grape", "flamingo", "banana", "tangerine", "peacock", "graphite", "blueberry", "basil", "tomato"][Number(index)-1]!;
}

export function evaluateStringBuilder(code: StringBuilderStructure, context: RuntimeContext): string {
  Logger.log(`Evaluating StringBuilder: ${JSON.stringify(code)}`);
  const res = code.map(part => evaluateStringPart(part, context)).join("");
  Logger.log(`stringbuilder; returning ${res}`);
  return res;
}

export function evaluateStringPart(code: StringPartStructure, context: RuntimeContext): string {
  Logger.log(`Evaluating StringPart: ${JSON.stringify(code)}`);
  if (code.length === 2) {
    Logger.log(`Returning ${code[0]}`);
    return code[0];
  } else {
    switch (code[0]) {
      case "v": {
        const v = evaluateVariableSelector(code[2], context);
        if (v === null) return "";
        return stringFrom(v);
      }
      case "e": {
        const v = evaluateVariableSelector(code[2], context);
        if (v === null || v[0] !== "array<schedule>") return "";
        const result = [];
        for (const val in v[1]) {
          context.actionVariablesForChildren.push([code[1], getForEachVariables(v, Number(val))]);
          context.callStack.push(code[1]);
          const res = evaluateStringBuilder(code[3], context);
          context.actionVariablesForChildren.pop();
          context.callStack.pop();
          result.push(res);
        }
        return result.join("");
      }
      case "i": {
        const ok = (evaluateCondition(code[2], context));
        return evaluateStringBuilder(code[ok ? 3 : 4], context);
      }
    }
  }
}
