import crypto from "node:crypto";
import { beforeAll } from "vitest";

beforeAll(() => {
  Object.defineProperty(window, "crypto", {
    value: crypto.webcrypto,
    writable: true,
  });
});
