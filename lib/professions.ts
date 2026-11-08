/**
 * The "What do you do?" choices on the waitlist form. The API accepts only these, so the
 * profession column and the OneSignal tag can't be filled with arbitrary text.
 */
export const PROFESSIONS = [
  'Freelancer',
  'Content creator',
  'Small business',
  'Salary earner',
  'Other',
] as const;

export type Profession = (typeof PROFESSIONS)[number];

export const isProfession = (value: unknown): value is Profession =>
  typeof value === 'string' && (PROFESSIONS as readonly string[]).includes(value);
