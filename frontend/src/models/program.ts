import type { Action } from "./action";
import type { Trigger } from "./trigger";

export interface Program {
  trigger: Trigger | null;
  action: Action[];
}
