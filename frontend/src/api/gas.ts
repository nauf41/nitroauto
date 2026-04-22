import type { ProjectStringExpression } from "../models/project";
import type { TriggerStringExpression } from "../models/trigger";
import { mockApi } from "../mock";
import { useNetworkLoadingState } from "../states/network";

const cache = new Map<string, GasResponse>();

function run(cachable: boolean, name: string, ...args: unknown[]): Promise<unknown> {
  if (cachable && cache.has(JSON.stringify([name, args]))) {
    return Promise.resolve(cache.get(JSON.stringify([name, args])));
  }

  useNetworkLoadingState.getState().startRequest();
  const finish = () => useNetworkLoadingState.getState().finishRequest();

  if (!import.meta.env.DEV) {
    return new Promise<unknown>((resolve: (value: unknown) => unknown, reject: (reason?: unknown) => unknown) => {
      try {
        console.log(`Request: ${name}(${JSON.stringify(args)})`);
        //@ts-expect-error google.script.run is automatically processed by GAS
        google.script.run.withSuccessHandler((result: unknown) => {
          if (cachable) {
            cache.set(JSON.stringify([name, args]), {status: "success", value: result});
          }
          console.log(`SUCCESS RESPONSE: ${result}`);
          finish();
          resolve(result);
        }).withFailureHandler((error: unknown) => {
          if (cachable) {
            cache.set(JSON.stringify([name, args]), {status: "failure", er: error});
          }
          console.error(`ERROR RESPONSE: ${error}`);
          finish();
          reject(error);
        })[name](...args);
      } catch (error) {
        finish();
        reject(error);
      }
    });
  } else {
    return new Promise<unknown>((resolve: (value: unknown) => unknown, reject: (reason?: unknown) => unknown) => {
      try {
        setTimeout(() => resolve((mockApi[name as keyof typeof mockApi] as (...arg: unknown[]) => unknown)(...args)), 1000);
      } catch (error) {
        reject(error);
      }
    }).finally(finish);
  }
}

export function getFormItems(form_id: string): Promise<string[]> {
  return run(true, "getFormItems", form_id) as Promise<string[]>;
}

export function getCalendars(): Promise<Calendar[]> {
  return run(true, "getCalendars") as Promise<Calendar[]>;
}

const codeCache: Map<number, string> = new Map();
export const projects = {
  // C
  create: (title: string, trigger: TriggerStringExpression) => run(false, "createProject", title, trigger) as Promise<void>,

  // R
  get: async (id: number) => {const code = await run(false, "getProjectCodeById", id); codeCache.set(id, code as string); return code as string},
  getList: async () => {
    const res = await run(false, "getProjects");
    console.log(res);
    return JSON.parse(res as string) as ProjectStringExpression[];
  },

  // U
  updateDescription: (id: number, title: string, trigger: TriggerStringExpression | null, isActive: boolean) => run(false, "updateProjectDescription", id, title, trigger, isActive) as Promise<void>,
  updateCode: (id: number, code: string) => run(false, "updateProjectCode", id, code) as Promise<void>,

  // D
  delete: (id: number) => run(false, "deleteProject", id) as Promise<void>,

  isSynced: (id: number, code: string) => codeCache.get(id) === code,
}

export type Calendar = {
  id: string,
  name: string,
  color: string,
}

type GasResponse =
| {status: "success", value: unknown}
| {status: "failure", er: unknown}
