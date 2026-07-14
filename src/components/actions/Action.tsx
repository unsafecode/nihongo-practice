import type { ButtonHTMLAttributes, ReactElement } from "react";
import { Link, type LinkProps } from "react-router";

/**
 * The finite set of styled action variants required by the visual
 * direction: primary, secondary, destructive, inline, and icon.
 */
export type ActionVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "inline"
  | "icon";

export const actionVariants: readonly ActionVariant[] = [
  "primary",
  "secondary",
  "destructive",
  "inline",
  "icon",
];

function actionClassName(variant: ActionVariant, className?: string): string {
  return ["action", `action--${variant}`, className]
    .filter((value): value is string => Boolean(value))
    .join(" ");
}

export interface ActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: ActionVariant;
}

/** Styled button primitive covering every application-owned button action. */
export function ActionButton({
  variant,
  className,
  type = "button",
  ...rest
}: ActionButtonProps): ReactElement {
  return (
    <button
      type={type}
      className={actionClassName(variant, className)}
      {...rest}
    />
  );
}

export interface ActionLinkProps extends LinkProps {
  variant: ActionVariant;
}

/** Styled internal-link primitive sharing the same variants as ActionButton. */
export function ActionLink({
  variant,
  className,
  ...rest
}: ActionLinkProps): ReactElement {
  return <Link className={actionClassName(variant, className)} {...rest} />;
}
