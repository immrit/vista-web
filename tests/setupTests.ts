import fetch from 'node-fetch';
import { TextEncoder, TextDecoder } from 'util';

if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
}

if (!globalThis.TextDecoder) {
  // @ts-expect-error - TextDecoder type mismatch between Node versions
  globalThis.TextDecoder = TextDecoder;
}

if (!globalThis.fetch) {
  // @ts-expect-error - assign fetch polyfill
  globalThis.fetch = fetch;
}

