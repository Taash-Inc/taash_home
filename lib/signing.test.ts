import { describe, expect, it } from 'vitest';
import { checkApproval, clientIp, hashIp, refFor, signApproval } from './signing';

const SECRET = 'service-key';
const ID = '3f1c2b4a-1d2e-4f5a-8b9c-0d1e2f3a4b5c';

describe('approval links', () => {
  it('accepts its own signature until the link expires', () => {
    const exp = 2_000_000;
    const sig = signApproval(ID, exp, SECRET)!;
    expect(checkApproval(ID, exp, sig, { now: 1_000_000, secret: SECRET })).toBe('ok');
    expect(checkApproval(ID, exp, sig, { now: 2_000_001, secret: SECRET })).toBe('expired');
  });

  it('rejects a signature for another signup, another expiry, or another key', () => {
    const exp = 2_000_000;
    const sig = signApproval(ID, exp, SECRET)!;
    const opts = { now: 1, secret: SECRET };
    expect(checkApproval(ID.replace('3f', '4f'), exp, sig, opts)).toBe('invalid');
    expect(checkApproval(ID, exp + 1, sig, opts)).toBe('invalid');
    expect(checkApproval(ID, exp, sig, { now: 1, secret: 'other-key' })).toBe('invalid');
    expect(checkApproval(ID, exp, 'a'.repeat(64), opts)).toBe('invalid');
    expect(checkApproval(ID, exp, 'not-hex', opts)).toBe('invalid');
  });

  it('cannot sign or accept anything without a key', () => {
    expect(signApproval(ID, 1, '')).toBeNull();
    expect(checkApproval(ID, 2, 'a'.repeat(64), { now: 1, secret: '' })).toBe('invalid');
  });

  it('uses separate keys per purpose, so a reference is not a valid signature', () => {
    expect(refFor(`${ID}.1`, SECRET)).not.toBe(signApproval(ID, 1, SECRET)?.slice(0, 10));
  });
});

describe('privacy helpers', () => {
  it('hashes IPs so the address itself is never stored', () => {
    const hash = hashIp('102.89.1.2', SECRET)!;
    expect(hash).toMatch(/^[0-9a-f]{32}$/);
    expect(hash).not.toContain('102');
    expect(hashIp('102.89.1.2', SECRET)).toBe(hash);
    expect(hashIp('102.89.1.3', SECRET)).not.toBe(hash);
    expect(hashIp(null, SECRET)).toBeNull();
  });

  it('gives each email a stable short reference that does not reveal it', () => {
    expect(refFor('Ada@Example.com', SECRET)).toBe(refFor('ada@example.com', SECRET));
    expect(refFor('ada@example.com', SECRET)).toMatch(/^[0-9a-f]{10}$/);
  });

  it("reads the client's IP from Vercel's headers", () => {
    expect(clientIp(new Headers({ 'x-real-ip': '1.2.3.4', 'x-forwarded-for': '5.6.7.8' }))).toBe('1.2.3.4');
    expect(clientIp(new Headers({ 'x-forwarded-for': '5.6.7.8, 10.0.0.1' }))).toBe('5.6.7.8');
    expect(clientIp(new Headers())).toBeNull();
  });
});
