/**
 * Text that came from outside (a visitor's name or email, a browser error report, a provider's
 * error message), made safe to put in a Slack message.
 *
 * Slack reads message text as markup: `<!channel>` pings everyone, `<https://x|Approve>` shows a
 * disguised link, and a bare URL becomes clickable. Any of those in a name or error report could
 * plant a fake "Approve" link next to the real one, or spam the channel. So the value goes inside
 * an inline code span, where Slack shows text literally (no links, mentions or formatting), with
 * the three characters Slack requires escaped and backticks replaced so the span can't be closed
 * early. Line breaks are joined so a value can't forge extra lines in a one-fact-per-line message.
 *
 * Use it for every value we didn't write ourselves. Our own codes, counts and links stay as is.
 */
export function slackValue(value: string | null | undefined, maxLength = 300): string {
  if (value == null) return '(none)';
  const text = value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/`/g, "'")
    .slice(0, maxLength)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return text ? `\`${text}\`` : '(empty)';
}
