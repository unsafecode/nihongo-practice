interface Props {
  supported: boolean;
  japaneseVoiceAvailable: boolean;
}

export function SpeechNotice({ supported, japaneseVoiceAvailable }: Props) {
  if (supported && japaneseVoiceAvailable) return null;

  if (!supported) {
    return (
      <div className="notice notice--warn" role="status">
        <strong>Audio non disponibile.</strong> Questo browser non supporta la
        sintesi vocale. Prova con Chrome, Edge o Safari aggiornati.
      </div>
    );
  }

  return (
    <div className="notice" role="status">
      <strong>Nessuna voce giapponese trovata.</strong> L'app funziona lo
      stesso, ma per sentire l'audio aggiungi una voce ja-JP. Su macOS:
      Impostazioni → Accessibilità → Contenuto vocale → Voce di sistema →
      Gestisci voci → Giapponese (es. Kyoko).
    </div>
  );
}
