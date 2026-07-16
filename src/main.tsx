import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { SpeechRecognitionProvider } from "./course/speech/SpeechRecognitionContext.tsx";
import { resolveInjectedSpeechRecognizer } from "./course/speech/injectedRecognizer.ts";
import "./styles.css";

// Production resolves `undefined` here, so the provider uses the real browser
// adapter; an E2E harness may inject a fake recognizer before boot (Slice D
// plan Task 4). Passing `undefined` is identical to omitting the prop.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SpeechRecognitionProvider recognizer={resolveInjectedSpeechRecognizer()}>
      <App />
    </SpeechRecognitionProvider>
  </StrictMode>,
);
