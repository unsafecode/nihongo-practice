import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { SpeechRecognitionProvider } from "./course/speech/SpeechRecognitionContext.tsx";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SpeechRecognitionProvider>
      <App />
    </SpeechRecognitionProvider>
  </StrictMode>,
);
