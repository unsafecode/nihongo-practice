import { Component, type ErrorInfo, type ReactNode } from "react";
import type { Locale } from "../i18n/LocaleContext";
import { errorMessages } from "./errorMessages";

interface Props {
  locale: Locale;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

interface RecoveryLocation {
  hash: string;
  reload: () => void;
}

export function recoverToCourse(location: RecoveryLocation): void {
  location.hash = "#/percorso";
  location.reload();
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unrecoverable application error", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const copy = errorMessages[this.props.locale];
    return (
      <main className="app-error" role="alert">
        <p className="app-error__mark" aria-hidden="true">あ</p>
        <h1>{copy.title}</h1>
        <p>{copy.body}</p>
        <button
          type="button"
          onClick={() => recoverToCourse(window.location)}
        >
          {copy.reload}
        </button>
      </main>
    );
  }
}
