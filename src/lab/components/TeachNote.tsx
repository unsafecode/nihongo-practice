import { conjugate, stem } from "../engine/conjugate";
import type { Form, Scenario } from "../data/types";

interface Props {
  verb: Scenario["verb"];
  form: Form;
  timeIt: string;
  timeFuture: boolean;
}

const FORM_NOTE: Record<Form, string> = {
  pres: "ます = presente e futuro.",
  past: "ました = passato. La radice non cambia, cambia solo la desinenza.",
  neg: "ません = negativo (presente / futuro).",
  pastneg: "ませんでした = passato negativo.",
  vol: "ましょう = «facciamo…?» (proposta / invito).",
  des: "たいです = «voglio…» (desiderio).",
};

/**
 * Box regola in cima (mockup `.note`). Mostra dinamicamente gambo + desinenza
 * della forma attiva e una nota pedagogica per forma. Per il presente spiega
 * la regola presente=futuro.
 */
export function TeachNote({ verb, form, timeIt, timeFuture }: Props) {
  const stemJp = stem(verb.dict, verb.group);
  const conj = conjugate(verb, form);

  return (
    <div className="note">
      💡 <b>Regola:</b> gambo <b lang="ja">{stemJp}</b> (<i>{verb.stemRomaji}</i>) +
      terminazione <b lang="ja">{conj.ending}</b> (<i>{conj.endingRomaji}</i>). Cambi
      la forma → cambia solo la coda del verbo.
      <br />
      {form === "pres" && timeFuture ? (
        <>
          🔎 Qui il tempo è <b>futuro</b>
          {timeIt ? <> ({timeIt})</> : null} → in giapponese presente e futuro sono
          la stessa forma, in italiano usiamo il futuro «{verb.it.future}».
        </>
      ) : form === "pres" ? (
        <>
          🔎 In giapponese presente e futuro sono <b>la stessa forma</b> — è
          l'avverbio di tempo a dire se è «{verb.it.pres}» o «{verb.it.future}».
        </>
      ) : (
        <>🔎 {FORM_NOTE[form]}</>
      )}
    </div>
  );
}
