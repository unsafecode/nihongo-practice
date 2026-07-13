import { useLocation, useNavigate } from "react-router";
import { useLocale } from "../../i18n/LocaleContext";
import { getCourseCopy } from "../i18n/catalog";

function invalidPathFromState(state: unknown): string | null {
  if (
    typeof state === "object" &&
    state !== null &&
    "invalidPath" in state &&
    typeof state.invalidPath === "string"
  ) {
    return state.invalidPath;
  }
  return null;
}

export function RouteNotice() {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const location = useLocation();
  const navigate = useNavigate();
  const invalidPath = invalidPathFromState(location.state);

  if (!invalidPath) return null;

  return (
    <div className="route-notice" role="status">
      <p>{copy.home.invalidRoute(invalidPath)}</p>
      <button
        type="button"
        onClick={() =>
          navigate(
            { pathname: location.pathname, search: location.search },
            { replace: true, state: null },
          )
        }
      >
        {copy.home.dismiss}
      </button>
    </div>
  );
}
