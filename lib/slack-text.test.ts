import { describe, expect, it } from 'vitest';
import { slackValue } from './slack-text';

// 24 Nov 2026 security review: text from visitors reached Slack as markup. "<!channel>" pinged
// the channel, "<https://evil|Approve this signup>" rendered as a disguised link, and a plain URL
// in a name became a clickable link next to the real approval link.
describe('slackValue', () => {
  it('shows visitor text literally: no mentions, no disguised links', () => {
    const v = slackValue('<!channel> <https://evil.example/login|Approve this signup>');
    expect(v).toBe('`&lt;!channel&gt; &lt;https://evil.example/login|Approve this signup&gt;`');
    expect(v).not.toMatch(/<[!@#]|<https?:/);
  });

  it('puts plain links inside a code span, where Slack never links them', () => {
    expect(slackValue('Approve here https://evil.example/a')).toBe('`Approve here https://evil.example/a`');
  });

  it("can't be broken out of: backticks are replaced, lines are joined, & is escaped", () => {
    expect(slackValue('Ada` <!here> `x')).toBe("`Ada' &lt;!here&gt; 'x`");
    expect(slackValue('Ada\n• Email: boss@taash.tax')).toBe('`Ada • Email: boss@taash.tax`');
    expect(slackValue('Tom & Jerry')).toBe('`Tom &amp; Jerry`');
  });

  it('marks empty values instead of leaving an empty code span', () => {
    expect(slackValue('   ')).toBe('(empty)');
    expect(slackValue(null)).toBe('(none)');
  });

  it('keeps long values short', () => {
    expect(slackValue('x'.repeat(1000)).length).toBeLessThanOrEqual(302);
  });
});
