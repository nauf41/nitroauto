"use strict";
var global = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

  // src/runtimeStructure.ts
  function stringFrom(value) {
    switch (value[0]) {
      case "string":
      case "color":
        return value[1];
      case "number":
      case "boolean":
        return String(value[1]);
      case "date":
        return `${value[1].getFullYear()}/${value[1].getMonth() + 1}/${value[1].getDate()} ${value[1].getHours()}:${value[1].getMinutes()}:${value[1].getSeconds()}`;
      case "schedule":
        return value[1].getTitle();
      case "array<schedule>":
        return JSON.stringify(value[1].map((event) => event.getTitle()));
      case "arraylength<schedule>":
        return String(value[1].length);
    }
  }
  __name(stringFrom, "stringFrom");

  // src/runtime.ts
  function prepare_next_trigger(e) {
    const delete_this_trigger = /* @__PURE__ */ __name(() => ScriptApp.getProjectTriggers().filter((trigger2) => trigger2.getUniqueId() === e.triggerUid).forEach((trigger2) => ScriptApp.deleteTrigger(trigger2)), "delete_this_trigger");
    let result_trig = null;
    const trigger = JSON.parse(PropertiesService.getScriptProperties().getProperty("triggers")).find((trigger2) => trigger2.triggerId === e.triggerUid);
    const trig_obj = JSON.parse(trigger.triggerObject);
    switch (trig_obj.type) {
      case "form-submit":
        break;
      case "timed": {
        switch (trig_obj.time.type) {
          case "once": {
            delete_this_trigger();
            break;
          }
          case "daily": {
            const tim = /* @__PURE__ */ new Date();
            const tim_trig = new Date(trig_obj.time.time);
            tim.setHours(tim_trig.getHours());
            tim.setMinutes(tim_trig.getMinutes());
            tim.setSeconds(0);
            if (tim.getTime() <= (/* @__PURE__ */ new Date()).getTime() + 10 * 1e3) {
              tim.setDate(tim.getDate() + 1);
            }
            const trig = ScriptApp.newTrigger("trigger_timed").timeBased().at(tim).create();
            result_trig = { triggerId: trig.getUniqueId(), triggerObject: JSON.stringify(trig_obj), projectId: trigger.projectId };
            break;
          }
          case "weekly": {
            const tim = /* @__PURE__ */ new Date();
            const tim_trig = new Date(trig_obj.time.time);
            tim.setHours(tim_trig.getHours());
            tim.setMinutes(tim_trig.getMinutes());
            tim.setSeconds(0);
            if (tim.getTime() < (/* @__PURE__ */ new Date()).getTime() + 10 * 1e3) {
              tim.setDate(tim.getDate() + 1);
            }
            for (let i = 0; i < 100; i++) {
              if (trig_obj.time.dayOfWeek.includes(tim.getDay())) break;
              tim.setDate(tim.getDate() + 1);
            }
            const trig = ScriptApp.newTrigger("trigger_timed").timeBased().at(tim).create();
            result_trig = { triggerId: trig.getUniqueId(), triggerObject: JSON.stringify(trig_obj), projectId: trigger.projectId };
            break;
          }
        }
      }
    }
    if (result_trig !== null) {
      const lock = LockService.getScriptLock();
      lock.waitLock(300 * 1e3);
      const triggers = JSON.parse(PropertiesService.getScriptProperties().getProperty("triggers"));
      const new_triggers = triggers.map((trigger2) => trigger2.triggerId === e.triggerUid ? result_trig : trigger2);
      PropertiesService.getScriptProperties().setProperty("triggers", JSON.stringify(new_triggers));
    }
  }
  __name(prepare_next_trigger, "prepare_next_trigger");
  function trigger_timed(e) {
    const tim = /* @__PURE__ */ new Date();
    const triggers = JSON.parse(PropertiesService.getScriptProperties().getProperty("triggers"));
    const project_id = triggers.find((trigger) => trigger.triggerId === e.triggerUid).projectId;
    const code = PropertiesService.getScriptProperties().getProperty(`project_${project_id}`);
    runner(tim, [], code);
    prepare_next_trigger(e);
  }
  __name(trigger_timed, "trigger_timed");
  function trigger_onFormSubmit(e) {
    const tim = /* @__PURE__ */ new Date();
    const trig_vars = e.response.getItemResponses().map((itemResponse) => ["string", itemResponse.getResponse().toString()]);
    const triggerProperty = JSON.parse(PropertiesService.getScriptProperties().getProperty("triggers"));
    const projectId = triggerProperty.find((trigger) => trigger.triggerId === e.triggerUid).projectId;
    const code = PropertiesService.getScriptProperties().getProperty(`project_${projectId}`);
    runner(tim, trig_vars, code);
    prepare_next_trigger(e);
  }
  __name(trigger_onFormSubmit, "trigger_onFormSubmit");
  function runner(tim, trig_vars, code) {
    if (code === "[]") {
      return;
    }
    const [trigger, flow, actions] = JSON.parse(code);
    if (!flow || flow.length === 0) return;
    const context = {
      callStack: [],
      defaultVariables: [["date", tim]],
      triggerVariables: trig_vars,
      actionVariablesForFollowing: [],
      actionVariablesForChildren: [],
      actions
    };
    for (const now of flow) {
      context.callStack.push(now);
      executeAction(context.actions.find((action) => action[0] === now)[1], context);
      context.callStack.pop();
    }
  }
  __name(runner, "runner");
  function executeAction(code, context) {
    Logger.log(`Executing Action: ${JSON.stringify(code)}`);
    if (typeof code === "number") return;
    switch (code[0]) {
      case "i": {
        context.callStack.push(code[4]);
        if (evaluateCondition(code[1], context)) {
          for (const id of code[2]) {
            executeAction(context.actions.find((v) => v[0] === id)[1], context);
          }
        } else {
          for (const id of code[3]) {
            executeAction(context.actions.find((v) => v[0] === id)[1], context);
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
            executeAction(context.actions.find((v) => v[0] === id)[1], context);
          }
          context.actionVariablesForChildren.pop();
        }
        break;
      }
      case "s": {
        const target = code[1];
        const text = evaluateStringBuilder(code[2], context);
        Logger.log(`Sending webhook
Target: ${target}
Text: ${text}`);
        UrlFetchApp.fetch(target, {
          method: "post",
          headers: { "Content-Type": "application/json; charset=UTF-8" },
          payload: JSON.stringify({ "text": text })
        });
        break;
      }
      case "g": {
        const calendar = CalendarApp.getCalendarById(code[1]);
        if (!calendar) break;
        const events = calendar.getEventsForDay(new Date(Date.now() + code[3] * 24 * 60 * 60 * 1e3));
        context.actionVariablesForFollowing.push([code[4], [["array<schedule>", events]]]);
        context.actionVariablesForFollowing.push([code[4], [["arraylength<schedule>", events]]]);
        break;
      }
    }
  }
  __name(executeAction, "executeAction");
  function evaluateCondition(code, context) {
    var _a, _b;
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
            return [typeof code[3], code[3]];
          } else {
            return evaluateVariableSelector(code[3], context);
          }
        })();
        switch (code[1]) {
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
                  if (((_a = left[1][i]) == null ? void 0 : _a.getId()) !== ((_b = right[1][i]) == null ? void 0 : _b.getId())) {
                    return false;
                  }
                }
                return true;
              } else if (left[0] === "arraylength<schedule>" && right[0] === "arraylength<schedule>") {
                return left[1].length === right[1].length;
              } else {
                return false;
              }
            }
          }
          case "!=": {
            return !(() => {
              var _a2, _b2;
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
                    if (((_a2 = left[1][i]) == null ? void 0 : _a2.getId()) !== ((_b2 = right[1][i]) == null ? void 0 : _b2.getId())) {
                      return false;
                    }
                  }
                  return true;
                } else if (left[0] === "arraylength<schedule>" && right[0] === "arraylength<schedule>") {
                  return left[1].length === right[1].length;
                } else {
                  return false;
                }
              }
            })();
          }
          case ">": {
            if (left === null || right === null) return false;
            if (left[0] === "string" && right[0] === "string" || left[0] === "number" && right[0] === "number" || left[0] === "color" && right[0] === "color" || left[0] === "date" && right[0] === "date") {
              return left[1] > right[1];
            }
            if (left[0] === "arraylength<schedule>" && right[0] === "arraylength<schedule>") {
              return left[1].length > right[1].length;
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
            return false;
          }
        }
      }
    }
  }
  __name(evaluateCondition, "evaluateCondition");
  function evaluateVariableSelector(code, context) {
    if (code[1] !== null && code[1] != void 0) {
      let v = null;
      if (code[1][0] === -2) {
        v = context.defaultVariables[code[1][1]];
      } else if (code[1][0] === -1) {
        v = context.triggerVariables[code[1][1]];
      } else {
        Logger.log(`Searching for ${code[1][0]}, ${code[1][1]}`);
        if (context.callStack.includes(code[1][0])) {
          v = context.actionVariablesForChildren.find((val) => val[0] === code[1][0])[1][code[1][1]];
        } else {
          v = context.actionVariablesForFollowing.find((val) => val[0] === code[1][0])[1][code[1][1]];
        }
      }
      Logger.log(`Variable: ${JSON.stringify(v)}`);
      if (code[2] !== null && (v[0] === "array<schedule>" || v[0] === "arraylength<schedule>")) {
        context.callStack.push(code[0]);
        const res = v[1].filter((now, idx) => {
          context.actionVariablesForChildren.push([code[0], getForEachVariables(v, idx)]);
          const isOk = evaluateCondition(code[2], context);
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
  __name(evaluateVariableSelector, "evaluateVariableSelector");
  function getForEachVariables(v, idx) {
    if (v[0] === "array<schedule>" || v[0] === "arraylength<schedule>") {
      return [
        ["string", v[1][idx].getTitle()],
        ["string", generatePeriod(
          v[1][idx].getStartTime(),
          v[1][idx].getEndTime()
        )],
        ["boolean", v[1][idx].isAllDayEvent()],
        ["string", getColorStringFromIndex(v[1][idx].getColor())]
      ];
    } else {
      return [["string", v[idx].toString()]];
    }
  }
  __name(getForEachVariables, "getForEachVariables");
  function generatePeriod(start, end) {
    return `${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")} - ${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`;
  }
  __name(generatePeriod, "generatePeriod");
  function getColorStringFromIndex(index) {
    return ["lavender", "sage", "grape", "flamingo", "banana", "tangerine", "peacock", "graphite", "blueberry", "basil", "tomato"][Number(index) - 1];
  }
  __name(getColorStringFromIndex, "getColorStringFromIndex");
  function evaluateStringBuilder(code, context) {
    Logger.log(`Evaluating StringBuilder: ${JSON.stringify(code)}`);
    const res = code.map((part) => evaluateStringPart(part, context)).join("");
    Logger.log(`stringbuilder; returning ${res}`);
    return res;
  }
  __name(evaluateStringBuilder, "evaluateStringBuilder");
  function evaluateStringPart(code, context) {
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
          const ok = evaluateCondition(code[2], context);
          return evaluateStringBuilder(code[ok ? 3 : 4], context);
        }
      }
    }
  }
  __name(evaluateStringPart, "evaluateStringPart");

  // src/app.ts
  var globalExports = [
    ["init", init],
    ["doGet", doGet],
    ["getFormItems", getFormItems],
    ["getCalendars", getCalendars],
    ["getProjects", getProjects],
    ["createProject", createProject],
    ["updateProjectDescription", updateProjectDescription],
    ["updateProjectCode", updateProjectCode],
    ["getProjectCodeById", getProjectCodeById],
    ["deleteProjectById", deleteProjectById],
    ["updateAllTrigger", updateAllTrigger],
    ["prepare_next_trigger", prepare_next_trigger],
    ["trigger_timed", trigger_timed],
    ["trigger_onFormSubmit", trigger_onFormSubmit],
    ["runner", runner],
    ["executeAction", executeAction],
    ["evaluateCondition", evaluateCondition],
    ["evaluateVariableSelector", evaluateVariableSelector],
    ["getForEachVariables", getForEachVariables],
    ["generatePeriod", generatePeriod],
    ["getColorStringFromIndex", getColorStringFromIndex],
    ["evaluateStringBuilder", evaluateStringBuilder],
    ["evaluateStringPart", evaluateStringPart]
  ];
  globalExports.forEach(([name, func]) => {
    globalThis[name] = func;
  });
  function init() {
    try {
      getFormItems("");
    } catch (e) {
    } finally {
      try {
        getCalendars();
      } catch (e) {
      } finally {
        PropertiesService.getScriptProperties().setProperty("projects", JSON.stringify([]));
        PropertiesService.getScriptProperties().setProperty("projectIdCounter", "0");
      }
    }
  }
  __name(init, "init");
  function doGet() {
    return HtmlService.createHtmlOutputFromFile("index");
  }
  __name(doGet, "doGet");
  function getFormItems(form_id) {
    const form = FormApp.openById(form_id);
    const items = form.getItems();
    return items.map((item) => item.getTitle());
  }
  __name(getFormItems, "getFormItems");
  function getCalendars() {
    const calendars = CalendarApp.getAllCalendars();
    return calendars.map((calendar) => ({
      id: calendar.getId(),
      name: calendar.getName(),
      color: calendar.getColor()
    }));
  }
  __name(getCalendars, "getCalendars");
  function getProjects() {
    return PropertiesService.getScriptProperties().getProperty("projects");
  }
  __name(getProjects, "getProjects");
  function createProject(title, trigger) {
    const lock = LockService.getScriptLock();
    lock.tryLock(0);
    const projects = JSON.parse(PropertiesService.getScriptProperties().getProperty("projects"));
    const id = Number(PropertiesService.getScriptProperties().getProperty("projectIdCounter"));
    projects.push({
      id,
      title,
      trigger,
      isActive: false
    });
    PropertiesService.getScriptProperties().setProperty("projects", JSON.stringify(projects));
    PropertiesService.getScriptProperties().setProperty("projectIdCounter", String(id + 1));
    PropertiesService.getScriptProperties().setProperty(`project_${id}`, JSON.stringify([]));
    lock.releaseLock();
  }
  __name(createProject, "createProject");
  function updateProjectDescription(id, title, trigger, isActive) {
    const lock = LockService.getScriptLock();
    lock.tryLock(0);
    const projects = JSON.parse(PropertiesService.getScriptProperties().getProperty("projects"));
    const projectIndex = projects.findIndex((project) => project.id === id);
    if (projectIndex === -1) {
      lock.releaseLock();
      return false;
    }
    projects[projectIndex] = __spreadProps(__spreadValues({}, projects[projectIndex]), {
      id,
      title,
      trigger,
      isActive
    });
    PropertiesService.getScriptProperties().setProperty("projects", JSON.stringify(projects));
    updateAllTrigger();
    lock.releaseLock();
    return true;
  }
  __name(updateProjectDescription, "updateProjectDescription");
  function updateProjectCode(id, code) {
    const lock = LockService.getScriptLock();
    lock.tryLock(0);
    const projectCodeKey = `project_${id}`;
    PropertiesService.getScriptProperties().setProperty(projectCodeKey, code);
    lock.releaseLock();
  }
  __name(updateProjectCode, "updateProjectCode");
  function getProjectCodeById(id) {
    var _a;
    const projectCodeKey = `project_${id}`;
    return (_a = PropertiesService.getScriptProperties().getProperty(projectCodeKey)) != null ? _a : "";
  }
  __name(getProjectCodeById, "getProjectCodeById");
  function deleteProjectById(id) {
    const lock = LockService.getScriptLock();
    lock.tryLock(0);
    const projects = JSON.parse(PropertiesService.getScriptProperties().getProperty("projects"));
    const projectIndex = projects.findIndex((project) => project.id === id);
    if (projectIndex === -1) {
      lock.releaseLock();
      return false;
    }
    projects.splice(projectIndex, 1);
    PropertiesService.getScriptProperties().setProperty("projects", JSON.stringify(projects));
    PropertiesService.getScriptProperties().deleteProperty(`project_${id}`);
    lock.releaseLock();
    return true;
  }
  __name(deleteProjectById, "deleteProjectById");
  function updateAllTrigger() {
    const lock = LockService.getScriptLock();
    lock.tryLock(0);
    const projects = JSON.parse(PropertiesService.getScriptProperties().getProperty("projects"));
    ScriptApp.getProjectTriggers().forEach((trigger) => ScriptApp.deleteTrigger(trigger));
    const data = JSON.stringify(projects.filter((proj) => proj.trigger !== null && proj.isActive).map((project) => {
      const trigger = project.trigger;
      switch (trigger.type) {
        case "form-submit": {
          console.log(`processing for form trigger: ${trigger.form_id}`);
          const trig = ScriptApp.newTrigger("trigger_onFormSubmit").forForm(trigger.form_id).onFormSubmit().create();
          return { triggerId: trig.getUniqueId(), triggerObject: JSON.stringify(trigger), projectId: project.id };
        }
        case "timed": {
          switch (trigger.time.type) {
            case "once": {
              const tim = new Date(trigger.time.time);
              const trig = ScriptApp.newTrigger("trigger_timed").timeBased().at(tim).create();
              return { triggerId: trig.getUniqueId(), triggerObject: JSON.stringify(trigger), projectId: project.id };
            }
            case "daily": {
              const tim = /* @__PURE__ */ new Date();
              const tim_trig = new Date(trigger.time.time);
              tim.setHours(tim_trig.getHours());
              tim.setMinutes(tim_trig.getMinutes());
              tim.setSeconds(0);
              if (tim.getTime() <= (/* @__PURE__ */ new Date()).getTime() + 10 * 1e3) {
                tim.setDate(tim.getDate() + 1);
              }
              const trig = ScriptApp.newTrigger("trigger_timed").timeBased().at(tim).create();
              return { triggerId: trig.getUniqueId(), triggerObject: JSON.stringify(trigger), projectId: project.id };
            }
            case "weekly": {
              const tim = /* @__PURE__ */ new Date();
              const tim_trig = new Date(trigger.time.time);
              tim.setHours(tim_trig.getHours());
              tim.setMinutes(tim_trig.getMinutes());
              tim.setSeconds(0);
              if (tim.getTime() < (/* @__PURE__ */ new Date()).getTime() + 10 * 1e3) {
                tim.setDate(tim.getDate() + 1);
              }
              for (let i = 0; i < 100; i++) {
                if (trigger.time.dayOfWeek.includes(tim.getDay())) break;
                tim.setDate(tim.getDate() + 1);
              }
              const trig = ScriptApp.newTrigger("trigger_timed").timeBased().at(tim).create();
              return { triggerId: trig.getUniqueId(), triggerObject: JSON.stringify(trigger), projectId: project.id };
            }
          }
        }
      }
    }));
    PropertiesService.getScriptProperties().setProperty("triggers", data);
    lock.releaseLock();
  }
  __name(updateAllTrigger, "updateAllTrigger");
})();
