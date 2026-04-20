import { projects } from "../api/gas";
import { decompile } from "../middle/decompiler";
import { languageSetStore } from "../misc/langSet"
import { triggerToStringExpression } from "../models/project";
import { useProjectsStore } from "../states/projects";

export function ProjectSelector() {
  const lang = languageSetStore().getLanguageObject();
  const project = useProjectsStore();

  return (
    <div className="project-selector">
      <div className="project-selector__header">
        <h1>nitroauto</h1>
        <p>Select a project to open or create a new one.</p>
      </div>
      <div className="project-table-container">
        <table className="project-table">
          <thead>
            <tr>
              <th>{lang.projectSelector.project_name}</th>
              <th>{lang.projectSelector.is_active}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {project.projects.map((proj, idx) => (
              <tr key={idx}>
                <td className="project-table__name" onClick={async () => {
                  const newTitle = window.prompt(lang.projectSelector.change_name_prompt);
                  if (newTitle !== null) {
                    if (newTitle === proj.title) return;
                    await project.updateProject(proj.id, newTitle, proj.trigger, proj.isActive);
                  }
                  project.refreshProjects();
                }}>{proj.title}</td>
                <td><input type="checkbox" checked={proj.isActive} onChange={(e) => project.updateProject(proj.id, proj.title, proj.trigger, e.target.checked)} /></td>
                <td><button className="btn btn--sm" onClick={async () => {console.log("a"); project.setActiveProject(proj); console.log("b"); await decompile(await projects.get(proj.id)); console.log("c"); useProjectsStore.getState().setIsSynced(true); console.log("d");}}>{lang.projectSelector.open}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn btn--primary" onClick={async () => {
        const newTitle = window.prompt(lang.projectSelector.change_name_prompt);
        if (newTitle !== null) {
          await projects.create(newTitle, triggerToStringExpression({type: "timed", time: {type: "once", time: new Date()}}));
        }
        project.refreshProjects();
      }}>{lang.projectSelector.create_new}</button>
    </div>
  )
}
