/**
 * React's renderToStaticMarkup HTML-escapes text content (including apostrophes
 * as `&#x27;`) even in plain text nodes, so free-form prose copy must be
 * escaped the same way before a `.toContain()` check against rendered HTML.
 *
 * Established in CourseMap.test.ts and duplicated into CourseHome.test.ts and
 * GuidedToolLink.test.ts — consolidated here so all render-test call sites
 * track the same implementation.
 */
export function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
