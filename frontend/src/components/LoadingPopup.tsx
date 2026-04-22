import { languageSetStore } from "../misc/langSet";
import { useNetworkLoadingState } from "../states/network";

export function LoadingPopup() {
  const lang = languageSetStore((state) => state.getLanguageObject());
  const isLoading = useNetworkLoadingState((state) => state.isLoading);

  if (!isLoading) {
    return null;
  }

  return (
    <div className="loading-popup" role="status" aria-live="polite" aria-busy="true">
      <h1 className="loading-popup__text">{lang.network.loading_popup}</h1>
    </div>
  )
}