import { type ProjectStringExpression } from './../models/project';
import {assert_nonnullish} from '../misc/assert';
import {type TriggerStringExpression} from '../models/trigger';

const properties = new Map<string, string>();

let scriptLock = false;
let isInitialized = false;
export const mockApi = {
  init: () => {
    isInitialized = true;
    properties.set("projects", JSON.stringify([]));
    properties.set("projectIdCounter", "0");
  },
  getFormItems: (form_id: string) => {
    if (!isInitialized) mockApi.init();
    return [`${form_id}-form-item-1`, `${form_id}-form-item-2`, `${form_id}-form-item-3`];
  },
  getCalendars: () => {
    if (!isInitialized) mockApi.init();
    return [
      {id: "0000001", name: "Calendar 1", color: "#ff0000"},
      {id: "0000002", name: "Calendar 2", color: "#00ff00"},
      {id: "0000003", name: "Calendar 3", color: "#0000ff"},
    ];
  },
  getProjects: () => {
    if (!isInitialized) mockApi.init();
    return assert_nonnullish(properties.get("projects"));
  },
  createProject: (title: string, trigger: TriggerStringExpression) => {
    if (!isInitialized) mockApi.init();
    if (scriptLock) throw new Error("The script have already been locked.");
    scriptLock = true;

    const projects  = JSON.parse(assert_nonnullish(properties.get("projects"))) as ProjectStringExpression[];
    const idCounter = parseInt(assert_nonnullish(properties.get("projectIdCounter")));

    projects.push({
      id: idCounter,
      title,
      trigger,
      isActive: true
    });

    properties.set("projects", JSON.stringify(projects));
    properties.set("projectIdCounter", String(idCounter + 1));
    properties.set(`project_${idCounter}`, JSON.stringify([]));

    scriptLock = false;
  },
  updateProjectDescription: (id: number, title: string, trigger: TriggerStringExpression, isActive: boolean) => {
    if (!isInitialized) mockApi.init();
    if (scriptLock) throw new Error("The script have already been locked.");
    scriptLock = true;

    const projects  = JSON.parse(assert_nonnullish(properties.get("projects"))) as ProjectStringExpression[];
    const projectIndex = projects.findIndex((project) => project.id === id);
    if (projectIndex === -1) throw new Error(`Project with id ${id} not found.`);

    projects[projectIndex] = {
      ...projects[projectIndex],
      title,
      trigger,
      isActive,
    };

    properties.set("projects", JSON.stringify(projects));

    scriptLock = false;
  },
  updateProjectCode: (id: number, code: string) => {
    if (!isInitialized) mockApi.init();
    if (scriptLock) throw new Error("The script have already been locked.");
    scriptLock = true;

    properties.set(`project_${id}`, code);

    scriptLock = false;
  },
  getProjectCodeById: (id: number) => {
    if (!isInitialized) mockApi.init();
    console.log(id);
    return `[["td",1775284288179],[6,8],[[6,["g","0058cd78d2936be61ca77f27b894c73bfae9f1f2aa778a762f0c872e834ee621@group.calendar.google.com","VRChatイベントカレンダー",0,6]],[8,["s","https://chat.googleapis.com/v1/spaces/AAQALi6Qwm4/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=Mm9DB1I9RweLMc1_ooV1yL4AM8cNt1EpnpGd9hbIVro",[["e",16,[15,[6,0],null],[["v",20,[19,[16,0],null]],["(",24],["v",28,[27,[16,1],null]],[")",26]]]],8]]]]`;
    //return assert_nonnullish(properties.get(`project_${id}`));
  },
  deleteProject: (id: number) => {
    if (!isInitialized) mockApi.init();
    if (scriptLock) throw new Error("The script have already been locked.");
    scriptLock = true;

    const projects  = JSON.parse(assert_nonnullish(properties.get("projects"))) as ProjectStringExpression[];
    const projectIndex = projects.findIndex((project) => project.id === id);
    if (projectIndex === -1) throw new Error(`Project with id ${id} not found.`);

    projects.splice(projectIndex, 1);

    properties.set("projects", JSON.stringify(projects));
    properties.delete(`project_${id}`);

    scriptLock = false;
  },
}
