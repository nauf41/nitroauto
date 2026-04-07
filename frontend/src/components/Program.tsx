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
    <>
      <button onClick={async () => document.getElementById("target")!.textContent = await compile()}>Compile</button>
      <Trigger trigger={triggerState.trigger} setTrigger={triggerState.setTrigger} />
      <Actions actions={actionsState.actions} insertAction={actionsState.insertAction} editAction={actionsState.editAction} deleteAction={actionsState.deleteAction} args={triggerArgs} />
      <div id="target"></div>
    </>
  )
}