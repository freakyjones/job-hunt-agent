import '@testing-library/jest-dom';
import ws from 'ws';

if (typeof globalThis.WebSocket === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.WebSocket = ws as any;
}
