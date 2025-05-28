/// <reference types="svelte" />
/// <reference types="vite/client" />

// This adds proper types for Vite's environment variables
interface ImportMetaEnv {
  readonly DFX_NETWORK: string;
  readonly CANISTER_ID_INTERNET_IDENTITY: string;
  // Add other env vars as needed
  readonly [key: string]: string;
}

// This adds the env property to ImportMeta
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
