import { useEffect, useState } from "react";
import {
  lessonSectionAnchorId,
  type LessonSectionId,
} from "../../routing/lessonSections";
import { pickActiveSection, type SectionOffset } from "./activeSection";

/**
 * Scrollspy hook (design spec §5.4 / Task D.2). It measures each lesson
 * section anchor's document offset and feeds them to the pure, unit-tested
 * `pickActiveSection` selector, recomputing on scroll, resize and
 * IntersectionObserver changes (coalesced through one animation frame). It is
 * strictly read-only: it never navigates or pushes a history entry, so a
 * scroll can never spam the history stack, and it always tears down its
 * listeners/observer on cleanup. The active id drives the rail's
 * `aria-current="step"`; programmatic scrolling (and its reduced-motion
 * handling) stays the concern of the rail links + RouteScrollManager.
 */
export function useActiveSection(
  sectionIds: readonly LessonSectionId[],
): LessonSectionId {
  const [activeId, setActiveId] = useState<LessonSectionId>(sectionIds[0]);

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") {
      return;
    }
    let frame = 0;

    const compute = () => {
      frame = 0;
      const offsets: SectionOffset[] = [];
      for (const id of sectionIds) {
        const element = document.getElementById(lessonSectionAnchorId(id));
        if (element) {
          offsets.push({
            id,
            top: element.getBoundingClientRect().top + window.scrollY,
          });
        }
      }
      if (offsets.length === 0) return;
      // A resolution-independent probe line ~a third down the viewport: the
      // section occupying the upper reading area wins at each boundary, which
      // pickActiveSection resolves deterministically (inclusive last <= probe).
      const probe = window.scrollY + window.innerHeight * 0.34;
      const next = pickActiveSection(offsets, probe);
      setActiveId((previous) => (previous === next ? previous : next));
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(schedule)
        : null;
    if (observer) {
      for (const id of sectionIds) {
        const element = document.getElementById(lessonSectionAnchorId(id));
        if (element) observer.observe(element);
      }
    }

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    };
  }, [sectionIds]);

  return activeId;
}
