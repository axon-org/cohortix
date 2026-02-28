import { describe, it, expect } from 'vitest';
import { HEARTBEAT_INTERVAL_MS, evaluateRuntimeStatus } from '../runtime/heartbeat';

describe('Heartbeat lifecycle transitions', () => {
  const now = new Date('2026-02-28T00:00:00Z');

  it('returns offline when no heartbeat exists', () => {
    expect(evaluateRuntimeStatus(null, now)).toBe('offline');
  });

  it('stays online within degraded threshold', () => {
    const lastBeat = new Date(now.getTime() - HEARTBEAT_INTERVAL_MS * 2);
    expect(evaluateRuntimeStatus(lastBeat, now)).toBe('online');
  });

  it('moves to error after missed heartbeats', () => {
    const lastBeat = new Date(now.getTime() - HEARTBEAT_INTERVAL_MS * 4);
    expect(evaluateRuntimeStatus(lastBeat, now)).toBe('error');
  });

  it('moves to offline after disconnect window', () => {
    const lastBeat = new Date(now.getTime() - 6 * 60 * 1000);
    expect(evaluateRuntimeStatus(lastBeat, now)).toBe('offline');
  });

  it('moves to paused after suspension window', () => {
    const lastBeat = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    expect(evaluateRuntimeStatus(lastBeat, now)).toBe('paused');
  });
});
