/**
 * Structured server logs. Each call writes one JSON line to the function's output, which Vercel
 * keeps in the project's Logs tab (team members only; search for the event name, e.g.
 * `waitlist.pending`). Anything that needs someone's attention also goes to Slack.
 *
 * Never pass personal data: no names, email addresses, IP addresses, tokens or free text typed
 * by a visitor. Use a reference (a row id or `refFor()` from lib/signing) to connect a log line
 * to the matching Slack message, which is where the details live.
 */
export type LogValue = string | number | boolean | null | undefined;
export type LogLevel = 'info' | 'warn' | 'error';

export function logEvent(level: LogLevel, event: string, fields: Record<string, LogValue> = {}): void {
  const line = JSON.stringify({ event, ...fields });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}
