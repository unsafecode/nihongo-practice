import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  AppErrorBoundary,
  recoverToCourse,
} from "./AppErrorBoundary";

describe("AppErrorBoundary", () => {
  it("renders localized recovery UI after an error", () => {
    const boundary = new AppErrorBoundary({
      locale: "en",
      children: null,
    });
    boundary.state = AppErrorBoundary.getDerivedStateFromError(
      new Error("boom"),
    );
    const html = renderToStaticMarkup(
      createElement(Fragment, null, boundary.render()),
    );
    expect(html).toContain("Something went wrong");
    expect(html).toContain("Reload the app");
  });

  it("returns to the course hash before reloading", () => {
    const reload = vi.fn();
    const location = { hash: "#/broken", reload };
    recoverToCourse(location);
    expect(location.hash).toBe("#/percorso");
    expect(reload).toHaveBeenCalledOnce();
  });
});
