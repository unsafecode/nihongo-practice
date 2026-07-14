import { useLocation, useNavigate } from "react-router";
import { Notice } from "../../components/Notice";
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
    <Notice
      tone="warning"
      title={copy.home.invalidRouteTitle}
      body={copy.home.invalidRoute(invalidPath)}
      dismissLabel={copy.home.dismiss}
      onDismiss={() =>
        navigate(
          { pathname: location.pathname, search: location.search },
          { replace: true, state: null },
        )
      }
    />
  );
}
