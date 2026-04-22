import { useEffect } from "react";
import { Program } from "./components/Program"
import { LoadingPopup } from "./components/LoadingPopup";
import { ProjectSelector } from "./components/ProjectSelector";
import { Topbar } from "./components/Topbar";
import { useProjectsStore } from "./states/projects"

function App() {
  const projectState = useProjectsStore();

  useEffect(() => {
    useProjectsStore.getState().refreshProjects();
  }, [])

  return (
    <>
        <LoadingPopup />
        { projectState.activeProject === null && <ProjectSelector />}
        { projectState.activeProject !== null && <><Topbar /><Program /></> }
    </>
  )
}

export default App
