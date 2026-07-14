import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { ActionButton } from "./actions/Action";
import { isDismissKey, resolveTrapFocusIndex } from "./focusTrap";

export interface SettingsDrawerProps {
  open: boolean;
  triggerId: string;
  onClose: () => void;
  closeLabel: string;
  heading: string;
  children: ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/**
 * Mobile settings overlay: portals to <body> so it never changes header
 * flow or pushes page content, moves focus into itself on open, traps
 * Tab/Shift+Tab using the pure helpers in ./focusTrap, restores focus to
 * the trigger on close, and marks the app root `inert` while open so the
 * background is neither pointer- nor keyboard-interactive.
 */
export function SettingsDrawer({
  open,
  triggerId,
  onClose,
  closeLabel,
  heading,
  children,
}: SettingsDrawerProps): ReactElement | null {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    focusableElements(panel)[0]?.focus();

    const appRoot = document.getElementById("root");
    appRoot?.setAttribute("inert", "");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      appRoot?.removeAttribute("inert");
      document.body.style.overflow = previousOverflow;
      document.getElementById(triggerId)?.focus();
    };
  }, [open, triggerId]);

  if (!open) return null;

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (isDismissKey(event.key)) {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const focusables = focusableElements(panelRef.current);
    if (focusables.length === 0) return;
    const active = (document.activeElement as HTMLElement | null) ?? focusables[0];
    const nextIndex = resolveTrapFocusIndex(focusables, active, event.shiftKey);
    if (nextIndex === -1) return;
    event.preventDefault();
    focusables[nextIndex]?.focus();
  }

  return createPortal(
    <div className="settings-drawer">
      <div
        className="settings-drawer__backdrop"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="settings-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        onKeyDown={handleKeyDown}
      >
        <div className="settings-drawer__head">
          <p className="settings-drawer__heading">{heading}</p>
          <ActionButton
            type="button"
            variant="icon"
            className="settings-drawer__close"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </ActionButton>
        </div>
        <div className="settings-drawer__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
