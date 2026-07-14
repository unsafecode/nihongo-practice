import { Fragment, useEffect, useMemo, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { ActionButton, ActionLink } from "../components/actions/Action";
import { Notice } from "../components/Notice";
import { SpeechNotice } from "../components/SpeechNotice";
import { useSpeech } from "../hooks/useSpeech";
import { getCatalog } from "../i18n/catalog";
import { useLocale } from "../i18n/LocaleContext";
import { readGuidedReturn } from "../routing/guidedToolLink";
import { useScript } from "../settings/ScriptContext";
import {
  SYLLABARY_GROUP_IDS,
  parseSyllabaryGroup,
  planSyllabaryScroll,
  scheduleGroupScroll,
  syllabaryGroupDomId,
  syllabaryGroupHeadingId,
  type SyllabaryGroupId,
} from "./groups";
import { DAKUTEN, GOJUON, INTRO, NOTES, VOWELS, YOON, YOON_VOWELS, type Kana, type KanaRow } from "./kana";
import "./syllabary.css";

export function Syllabary() {
  const { locale } = useLocale();
  const { script } = useScript();
  const { supported, japaneseVoiceAvailable, speakingKey, playbackFailed, speak } = useSpeech();
  const ui = getCatalog(locale).ui;
  const [searchParams] = useSearchParams();
  const groupSelection = useMemo(
    () => parseSyllabaryGroup(searchParams),
    [searchParams],
  );
  const guidedReturn = useMemo(
    () => readGuidedReturn(searchParams),
    [searchParams],
  );
  const plan = planSyllabaryScroll(groupSelection);
  const targetDomId = plan.kind === "target" ? plan.domId : null;

  useEffect(() => {
    if (targetDomId === null || typeof window === "undefined") return;
    return scheduleGroupScroll(
      {
        request: (callback) => window.requestAnimationFrame(callback),
        cancel: (handle) => window.cancelAnimationFrame(handle),
      },
      () => {
        const element = document.getElementById(targetDomId);
        if (!element) return;
        element.scrollIntoView({ behavior: "auto", block: "start" });
        element.focus({ preventScroll: true });
      },
    );
  }, [targetDomId]);

  const focusGroup = (group: SyllabaryGroupId) => {
    if (typeof document === "undefined") return;
    const element = document.getElementById(syllabaryGroupDomId(group));
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    element.focus({ preventScroll: true });
  };

  const cell = (kana: Kana | null, key: string) => {
    if (!kana) {
      return <div className="kana-empty" key={key} aria-hidden="true" />;
    }
    const active = speakingKey === kana.kana;
    return (
      <button key={key} type="button" className={`kana${active ? " is-active" : ""}`}
        onClick={() => speak(kana.kana, { key: kana.kana })} disabled={!supported}
        aria-label={`${kana.kana} (${kana.romaji})`}>
        {script === "hiragana" ? (
          <>
            <span className="kana__main" lang="ja">{kana.kana}</span>
            <span className="kana__sub">{kana.romaji}</span>
          </>
        ) : (
          <>
            <span className="kana__main kana__main--romaji">{kana.romaji}</span>
            <span className="kana__sub kana__sub--jp" lang="ja">{kana.kana}</span>
          </>
        )}
      </button>
    );
  };

  const grid = (rows: KanaRow[], heads: string[]) => (
    <div className="kana-grid" style={{ gridTemplateColumns: `2.2rem repeat(${heads.length}, minmax(0, 1fr))` }}>
      <div className="kana-corner" aria-hidden="true" />
      {heads.map((head) => (<div className="kana-head" key={`head-${head}`}>{head}</div>))}
      {rows.map((row) => (
        <Fragment key={row.label}>
          <div className="kana-rowlabel">{row.label}</div>
          {row.cells.map((entry, index) => cell(entry, `${row.label}-${index}`))}
        </Fragment>
      ))}
    </div>
  );

  const groupSection = (group: SyllabaryGroupId, heading: ReactNode, body: ReactNode) => {
    const targeted = plan.kind === "target" && plan.group === group;
    return (
      <section
        id={syllabaryGroupDomId(group)}
        tabIndex={-1}
        aria-labelledby={syllabaryGroupHeadingId(group)}
        className={`kana-section${targeted ? " is-targeted" : ""}`}
      >
        <h2 id={syllabaryGroupHeadingId(group)}>{heading}</h2>
        {body}
      </section>
    );
  };

  return (
    <main className="syllabary">
      <SpeechNotice supported={supported} japaneseVoiceAvailable={japaneseVoiceAvailable} playbackFailed={playbackFailed} />
      <div className="syllabary__intro">
        <h1>{ui.syllabary.title}</h1>
        <p>{INTRO[locale]}</p>
      </div>

      {groupSelection.status === "invalid" ? (
        <Notice
          tone="warning"
          title={ui.syllabary.invalidGroupTitle}
          body={ui.syllabary.invalidGroup}
        />
      ) : null}
      {guidedReturn.status === "invalid" ? (
        <Notice
          tone="warning"
          title={ui.syllabary.invalidReturnTitle}
          body={ui.syllabary.invalidReturn}
        />
      ) : null}
      {guidedReturn.status === "valid" ? (
        <ActionLink
          className="syllabary__return"
          variant="secondary"
          to={guidedReturn.href}
        >
          ← {ui.syllabary.backToLesson}
        </ActionLink>
      ) : null}

      <p className="sr-only" role="status" aria-live="polite">
        {plan.kind === "target"
          ? ui.syllabary.targetAnnounce(ui.syllabary.groups[plan.group])
          : ""}
      </p>

      <nav className="kana-groupnav" aria-label={ui.syllabary.groupNavLabel}>
        {SYLLABARY_GROUP_IDS.map((group) => (
          <ActionButton
            key={group}
            variant="secondary"
            className="kana-groupnav__link"
            onClick={() => focusGroup(group)}
          >
            {ui.syllabary.groups[group]}
          </ActionButton>
        ))}
      </nav>

      {groupSection("gojuon", <>Gojūon · {ui.syllabary.base}</>, grid(GOJUON, VOWELS))}
      {groupSection("dakuten", ui.syllabary.voiced, grid(DAKUTEN, VOWELS))}
      {groupSection("yoon", <>Yōon · {ui.syllabary.combinations}</>, grid(YOON, YOON_VOWELS))}
      {groupSection(
        "special-notes",
        ui.syllabary.notes,
        <div className="kana-notes">
          {NOTES.map((note) => (
            <div className="kana-note" key={note.kana}>
              <span className="kana-note__glyph" lang="ja">{note.kana}</span>
              <div>
                <b>{note.title[locale]}</b>
                <p>{note.body[locale]}</p>
              </div>
            </div>
          ))}
        </div>,
      )}
    </main>
  );
}
