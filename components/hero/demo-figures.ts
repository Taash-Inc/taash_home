import { NTA_2026_BRACKETS, rentRelief, taxOn } from '@/lib/tax';

/**
 * The worked example in the hero phone demo, computed with the calculator's own engine so the
 * demo can never show a figure the calculator on the same page would disagree with.
 *
 * Lives outside PhoneDemo.tsx because that is a client module: a server component importing a
 * value from it gets a client reference, not the number.
 */
export const INCOME = 5_100_000;
export const DEDUCTIONS_BEFORE = 320_000;
/** The two expenses swiped right in the demo: an Uber ride and a laptop purchase. */
export const SWIPED = [2_505.04, 45_000] as const;
export const DEDUCTIONS_AFTER = DEDUCTIONS_BEFORE + SWIPED[0] + SWIPED[1];
export const TAX_BEFORE = taxOn(INCOME - DEDUCTIONS_BEFORE, NTA_2026_BRACKETS);
export const TAX_AFTER = taxOn(INCOME - DEDUCTIONS_AFTER, NTA_2026_BRACKETS);
export const TAX_SAVED = TAX_BEFORE - TAX_AFTER;

/** Scan chapter: the receipt read on the phone. */
export const SCAN_LINES = [
  { item: 'Ring light 18"', amount: 28_500 },
  { item: 'Delivery', amount: 3_500 },
] as const;
export const SCAN_TOTAL = SCAN_LINES.reduce((sum, line) => sum + line.amount, 0);

/** Ask chapter: the relief Taash AI points out. */
export const ANNUAL_RENT = 2_500_000;
export const RENT_RELIEF = rentRelief(ANNUAL_RENT);
export const RENT_SAVING =
  TAX_AFTER - taxOn(INCOME - DEDUCTIONS_AFTER - RENT_RELIEF, NTA_2026_BRACKETS);

/** Save chapter: tax set aside so far, and the weekly amount to be ready by 31 March. */
export const SET_ASIDE_BEFORE = 398_000;
export const WEEKS_LEFT = 20;
export const WEEKLY = Math.round((TAX_AFTER - SET_ASIDE_BEFORE) / WEEKS_LEFT);
export const SET_ASIDE_AFTER = SET_ASIDE_BEFORE + WEEKLY;
