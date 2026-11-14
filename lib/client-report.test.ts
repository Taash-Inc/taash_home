import { describe, expect, it } from 'vitest';
import { browserOf, isReportType, scrub } from './client-report';

describe('scrub', () => {
  it('removes email addresses, long numbers, tokens and query strings', () => {
    expect(scrub('Failed for ada.obi@example.com')).toBe('Failed for [email]');
    expect(scrub('Card 4111111111111111 phone 08031234567')).toBe('Card [number] phone [number]');
    expect(scrub(`token ${'a1B2'.repeat(10)} bad`)).toBe('token [token] bad');
    expect(scrub('GET https://www.taash.tax/email-preferences?t=secret failed')).toBe(
      'GET https://www.taash.tax/email-preferences?[…] failed'
    );
  });

  it('keeps short, useful error text and caps the length', () => {
    expect(scrub("Cannot read properties of undefined (reading 'map')")).toBe(
      "Cannot read properties of undefined (reading 'map')"
    );
    expect(scrub('x'.repeat(500)).length).toBeLessThanOrEqual(160);
    expect(scrub('line one\nline two')).toBe('line one line two');
  });
});

describe('browserOf', () => {
  it('names the in-app browsers the ads send people from', () => {
    expect(
      browserOf('Mozilla/5.0 (Linux; Android 14; SM-A146P) AppleWebKit/537.36 Chrome/131.0 Mobile Instagram 350.0')
    ).toBe('Instagram in-app on Android');
    expect(browserOf('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) [FBAN/FBIOS;FBAV/480.0]')).toBe(
      'Facebook in-app on iOS'
    );
    expect(browserOf('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Safari/604.1')).toBe(
      'Safari on iOS'
    );
  });
});

it('only accepts known report types', () => {
  expect(isReportType('js-error')).toBe(true);
  expect(isReportType('delete-everything')).toBe(false);
});
