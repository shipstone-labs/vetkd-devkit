import crypto from "node:crypto";
import indexeddb from "fake-indexeddb";
import { beforeAll } from "vitest";

beforeAll(() => {
  Object.defineProperty(window, "crypto", {
    value: crypto.webcrypto,
    writable: true,
  });

  globalThis.indexedDB = indexeddb;
});
