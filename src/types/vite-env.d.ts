/// <reference types="vite/client" />

interface ImportMeta {
  readonly hot?: {
    accept: (callback?: (mod?: any) => void) => void;
    on: (event: string, callback: (data: any) => void) => void;
    prune: (callback: () => void) => void;
    dispose: (callback: (data: any) => void) => void;
  };
}
