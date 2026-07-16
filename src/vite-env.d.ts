/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Compile-time opt-in for the Phase 1 foundation fixture harness route.
   * Registered only when this equals the exact string "true"; absent from
   * normal and GitHub Pages builds.
   */
  readonly VITE_FOUNDATION_FIXTURES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
