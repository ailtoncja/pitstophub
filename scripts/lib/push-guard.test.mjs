import { describe, expect, it } from 'vitest';
import { DEFAULT_TZ, isAllowedPushEndpoint, safeTimeZone } from './push-guard.mjs';

describe('isAllowedPushEndpoint', () => {
  it('aceita os servicos de push dos navegadores', () => {
    expect(isAllowedPushEndpoint('https://fcm.googleapis.com/fcm/send/abc:123')).toBe(true);
    expect(isAllowedPushEndpoint('https://web.push.apple.com/QGx1y2')).toBe(true);
    expect(isAllowedPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/gAAA')).toBe(true);
    expect(isAllowedPushEndpoint('https://wns2-par02p.notify.windows.com/w/?token=AQE')).toBe(true);
  });

  it('recusa outros hosts, http, porta, credenciais e lixo', () => {
    expect(isAllowedPushEndpoint('https://evil.example.com/fcm.googleapis.com')).toBe(false);
    expect(isAllowedPushEndpoint('https://fcm.googleapis.com.evil.com/x')).toBe(false);
    expect(isAllowedPushEndpoint('https://notify.windows.com.evil.com/x')).toBe(false);
    expect(isAllowedPushEndpoint('https://evilnotify.windows.com/x')).toBe(false);
    expect(isAllowedPushEndpoint('http://fcm.googleapis.com/fcm/send/abc')).toBe(false);
    expect(isAllowedPushEndpoint('https://fcm.googleapis.com:8443/fcm/send/abc')).toBe(false);
    expect(isAllowedPushEndpoint('https://user:pass@fcm.googleapis.com/x')).toBe(false);
    expect(isAllowedPushEndpoint('http://169.254.169.254/latest/meta-data')).toBe(false);
    expect(isAllowedPushEndpoint('nao e url')).toBe(false);
    expect(isAllowedPushEndpoint(null)).toBe(false);
  });
});

describe('safeTimeZone', () => {
  it('mantem fusos validos', () => {
    expect(safeTimeZone('Europe/Lisbon')).toBe('Europe/Lisbon');
    expect(safeTimeZone('UTC')).toBe('UTC');
  });

  it('cai no padrao com fuso invalido ou vazio', () => {
    expect(safeTimeZone('Mars/Olympus')).toBe(DEFAULT_TZ);
    expect(safeTimeZone('')).toBe(DEFAULT_TZ);
    expect(safeTimeZone(undefined)).toBe(DEFAULT_TZ);
    expect(safeTimeZone(42)).toBe(DEFAULT_TZ);
  });
});
