import { describe, it, expect, beforeEach } from 'vitest';
import { telemetry } from '../../src/lib/telemetry';

describe('telemetry utility', () => {
  beforeEach(() => {
    telemetry.clear();
    // Also clear the mock data the first getEvents call would set
    localStorage.clear();
  });

  it('should log an event and retrieve it', () => {
    telemetry.log('transaction', 'Test transaction event', { projectId: 1 });
    const events = telemetry.getEvents();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toBe('transaction');
    expect(events[0].message).toBe('Test transaction event');
  });

  it('should prepend new events (most recent first)', () => {
    telemetry.log('wallet_connect', 'First event');
    telemetry.log('page_view', 'Second event');
    const events = telemetry.getEvents();
    expect(events[0].type).toBe('page_view');
    expect(events[1].type).toBe('wallet_connect');
  });

  it('should clear all events', () => {
    telemetry.log('error', 'Some error');
    telemetry.clear();
    // After clear, getEvents will initialize with mock data
    const events = telemetry.getEvents();
    // Mock data has 6 events
    expect(events.length).toBe(6);
  });

  it('should assign unique IDs to each event', () => {
    telemetry.log('page_view', 'Visit A');
    telemetry.log('page_view', 'Visit B');
    const events = telemetry.getEvents();
    const ids = events.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should include metadata in logged events', () => {
    telemetry.log('wallet_connect', 'Connected', { walletType: 'freighter' });
    const events = telemetry.getEvents();
    expect(events[0].metadata).toEqual({ walletType: 'freighter' });
  });

  it('should keep a max of 100 events', () => {
    for (let i = 0; i < 110; i++) {
      telemetry.log('page_view', `Visit ${i}`);
    }
    const events = telemetry.getEvents();
    expect(events.length).toBeLessThanOrEqual(100);
  });

  it('should store a valid ISO timestamp', () => {
    telemetry.log('error', 'ts test');
    const events = telemetry.getEvents();
    expect(() => new Date(events[0].timestamp)).not.toThrow();
    expect(new Date(events[0].timestamp).toISOString()).toBe(events[0].timestamp);
  });
});
