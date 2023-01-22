/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly SHARED_ARRAY_BUFFER_TOKEN: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}