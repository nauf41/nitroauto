import type { CodeStore, JsonStringified, ProjectStore } from "./runtimeStructure";
import type { TriggerStringExpression } from "./structure";

import * as runtime from "./runtime";
import "./runtimeStructure";
import "./structure";
const globalExports: [string, any][] = [
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
  ["prepare_next_trigger", runtime.prepare_next_trigger],
  ["trigger_timed", runtime.trigger_timed],
  ["trigger_onFormSubmit", runtime.trigger_onFormSubmit],
  ["runner", runtime.runner],
  ["executeAction", runtime.executeAction],
  ["evaluateCondition", runtime.evaluateCondition],
  ["evaluateVariableSelector", runtime.evaluateVariableSelector],
  ["getForEachVariables", runtime.getForEachVariables],
  ["generatePeriod", runtime.generatePeriod],
  ["getColorStringFromIndex", runtime.getColorStringFromIndex],
  ["evaluateStringBuilder", runtime.evaluateStringBuilder],
  ["evaluateStringPart", runtime.evaluateStringPart],
];

globalExports.forEach(([name, func]) => {
  (globalThis as any)[name] = func;
});

// must be called once before using this app
function init() {
  try {getFormItems('');} catch(e) {} finally {
    try {getCalendars();} catch(e) {} finally {
      PropertiesService.getScriptProperties().setProperty('projects', JSON.stringify([]));
    PropertiesService.getScriptProperties().setProperty('projectIdCounter', '0');
    }
  }
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index');
}

//#network-callable
//@param form_id: string
function getFormItems(form_id: string) {
  const form = FormApp.openById(form_id);
  const items = form.getItems();
  return items.map(item => item.getTitle());
}

//#network-callable
function getCalendars() {
  const calendars = CalendarApp.getAllCalendars();
  return calendars.map(calendar => ({
    id: calendar.getId(),
    name: calendar.getName(),
    color: calendar.getColor(),
  }));
}

//#network-callable
function getProjects() {
  return PropertiesService.getScriptProperties().getProperty('projects');
}

//@param title: string
//@param trigger: JsonStringified<Trigger>
function createProject(title: string, trigger: string) {
  const lock = LockService.getScriptLock();
  lock.tryLock(0);
  const projects = JSON.parse(PropertiesService.getScriptProperties().getProperty('projects')!);
  const id = Number(PropertiesService.getScriptProperties().getProperty('projectIdCounter'));

  projects.push({
    id,
    title,
    trigger,
    isActive: false,
  });

  PropertiesService.getScriptProperties().setProperty('projects', JSON.stringify(projects));
  PropertiesService.getScriptProperties().setProperty('projectIdCounter', String(id + 1));
  PropertiesService.getScriptProperties().setProperty(`project_${id}`, JSON.stringify([]));

  lock.releaseLock();
}

function updateProjectDescription(id: number, title: string, trigger: TriggerStringExpression | null, isActive: boolean) {
  const lock = LockService.getScriptLock();
  lock.tryLock(0);
  const projects: ProjectStore[] = JSON.parse(PropertiesService.getScriptProperties().getProperty('projects')!);
  const projectIndex = projects.findIndex(project => project.id === id);
  if (projectIndex === -1) {
    lock.releaseLock();
    return false;
  }

  projects[projectIndex] = {
    ...projects[projectIndex],
    id,
    title,
    trigger,
    isActive,
  };

  PropertiesService.getScriptProperties().setProperty('projects', JSON.stringify(projects));

  updateAllTrigger();

  lock.releaseLock();

  return true;
}

function updateProjectCode(id: number, code: JsonStringified<CodeStore>) {
  const lock = LockService.getScriptLock();
  lock.tryLock(0);
  const projectCodeKey = `project_${id}`;
  PropertiesService.getScriptProperties().setProperty(projectCodeKey, code);
  lock.releaseLock();
}

function getProjectCodeById(id: number) {
  const projectCodeKey = `project_${id}`;
  return PropertiesService.getScriptProperties().getProperty(projectCodeKey) ?? '';
}

function deleteProjectById(id: number) {
  const lock = LockService.getScriptLock();
  lock.tryLock(0);
  const projects: ProjectStore[] = JSON.parse(PropertiesService.getScriptProperties().getProperty('projects')!);
  const projectIndex = projects.findIndex(project => project.id === id);
  if (projectIndex === -1) {
    lock.releaseLock();
    return false;
  }

  projects.splice(projectIndex, 1);
  PropertiesService.getScriptProperties().setProperty('projects', JSON.stringify(projects));
  PropertiesService.getScriptProperties().deleteProperty(`project_${id}`);
  lock.releaseLock();
  return true;
}

function updateAllTrigger() {
  const lock = LockService.getScriptLock();
  lock.tryLock(0);
  const projects: ProjectStore[] = JSON.parse(PropertiesService.getScriptProperties().getProperty('projects')!);
  ScriptApp.getProjectTriggers().forEach(trigger => ScriptApp.deleteTrigger(trigger));
  const data = JSON.stringify(projects.filter(proj => proj.trigger !== null && proj.isActive).map(project => {
    const trigger = project.trigger! as TriggerStringExpression;
    switch (trigger.type) {
      case "form-submit": {
        console.log(`processing for form trigger: ${trigger.form_id}`)
        const trig = ScriptApp.newTrigger('trigger_onFormSubmit').forForm(trigger.form_id).onFormSubmit().create();
        return {triggerId: trig.getUniqueId(), triggerObject: JSON.stringify(trigger), projectId: project.id}
      }
      case "timed": {
        switch (trigger.time.type) {
          case "once": {
            const tim = new Date(trigger.time.time);
            const trig = ScriptApp.newTrigger('trigger_timed').timeBased().at(tim).create();
            return {triggerId: trig.getUniqueId(), triggerObject: JSON.stringify(trigger), projectId: project.id}
          }
          case "daily": {
            const tim = new Date();
            const tim_trig = new Date(trigger.time.time);
            tim.setHours(tim_trig.getHours());
            tim.setMinutes(tim_trig.getMinutes());
            tim.setSeconds(0);

            if (tim.getTime() <= (new Date()).getTime() + 10 * 1000) {
              tim.setDate(tim.getDate() + 1);
            }

            const trig = ScriptApp.newTrigger('trigger_timed').timeBased().at(tim).create();
            return {triggerId: trig.getUniqueId(), triggerObject: JSON.stringify(trigger), projectId: project.id}
          }
          case "weekly": {
            const tim = new Date();
            const tim_trig = new Date(trigger.time.time);
            tim.setHours(tim_trig.getHours());
            tim.setMinutes(tim_trig.getMinutes());
            tim.setSeconds(0);
            if (tim.getTime() < (new Date()).getTime() + 10 * 1000) {
              tim.setDate(tim.getDate() + 1);
            }

            for (let i = 0; i < 100; i++) {
              if (trigger.time.dayOfWeek.includes(tim.getDay())) break;
              tim.setDate(tim.getDate() + 1);
            }

            const trig = ScriptApp.newTrigger('trigger_timed').timeBased().at(tim).create();
            return {triggerId: trig.getUniqueId(), triggerObject: JSON.stringify(trigger), projectId: project.id}
          }
        }
      }
    }
  }));

  PropertiesService.getScriptProperties().setProperty("triggers", data);
  lock.releaseLock();
}