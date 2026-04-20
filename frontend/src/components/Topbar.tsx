import { projects } from "../api/gas";
import { compile } from "../middle/compiler";
import { useProjectsStore } from "../states/projects";
import { languageSetStore } from "../misc/langSet";
import { triggerToStringExpression } from "../models/project";
import { useTriggerStore } from "../states/trigger";

export function Topbar() {
  const project = useProjectsStore();
  const lang = languageSetStore().getLanguageObject();

  return (
    <header className="topbar">
      <div className="topbar__actions">
        <button className="btn" onClick={async() => alert(await compile())}>just compile</button>
        <button className="btn btn--primary" onClick={async () => {
          if (project.activeProject) {
            await projects.updateCode(project.activeProject.id, await compile());
            const trigger = useTriggerStore.getState().trigger;
            await projects.updateDescription(project.activeProject.id, project.activeProject.title, trigger !== null ? triggerToStringExpression(trigger) : null, project.activeProject.isActive); project.setActiveProject(null)}}}>{lang.topbar.save_and_quit}</button>
      </div>
      <span className="topbar__title" onClick={() => {
        const proj = project.activeProject;
        if (!proj) return;
        const newTitle = window.prompt(lang.projectSelector.change_name_prompt);
        if (newTitle !== null) {
          if (newTitle === proj.title) return;
          project.updateProject(proj.id, newTitle, proj.trigger, proj.isActive);
          project.refreshProjects();
        }
      }}>{project.activeProject?.title}</span>
      <div className="topbar__right">
        <button className="btn btn--primary" onClick={async () => {if (!project.activeProject) return; await projects.updateCode(project.activeProject.id, await compile()); useProjectsStore.getState().setIsSynced(true)}}>{lang.topbar.save}</button>
        { project.isSynced
          ? <span className="sync-badge sync-badge--synced">{lang.topbar.synced}</span>
          : <span className="sync-badge sync-badge--unsynced">{lang.topbar.unsynced}</span>
        }
      </div>
    </header>
  )
}