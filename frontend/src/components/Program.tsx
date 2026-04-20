import { useActionStore } from "../states/actions";
import { useTriggerStore } from "../states/trigger";
import { Actions } from "./Actions";
import { Trigger } from "./Trigger";
import { compile } from "../middle/compiler";
import { useTriggerArgs } from "../states/variables";

export function Program() {
  const triggerState = useTriggerStore();
  const actionsState = useActionStore();
  const triggerArgs = useTriggerArgs();


  return (
    <main className="program">
      <div className="section-card">
        <div className="section-card__header">
          <span className="section-card__title">Trigger</span>
        </div>
        <div className="section-card__body">
          <Trigger trigger={triggerState.trigger} setTrigger={triggerState.setTrigger} />
        </div>
      </div>
      <div className="section-card">
        <div className="section-card__header">
          <span className="section-card__title">Actions</span>
        </div>
        <div className="section-card__body">
          <Actions actions={actionsState.actions} insertAction={actionsState.insertAction} editAction={actionsState.editAction} deleteAction={actionsState.deleteAction} args={triggerArgs} />
        </div>
      </div>
      <div className="section-card">
        <div className="section-card__header">
          <span className="section-card__title">Compiled output</span>
          <button className="btn btn--sm" onClick={async () => document.getElementById("target")!.textContent = await compile()}>Compile</button>
        </div>
        <div className="section-card__body">
          <pre id="target" className="compile-output"></pre>
        </div>
      </div>
    </main>
  )
}