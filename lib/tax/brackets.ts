/**
 * Statutory data for Nigerian personal income tax.
 *
 * Every figure here is sourced in docs/design/03-tax-content-2026.md, which cites the
 * Nigeria Tax Act 2025 as published in the Federal Republic of Nigeria Official Gazette
 * No. 117, Vol. 112, 26 June 2025 (Act No. 7), plus FCT-IRS guidance for the prior regime.
 *
 * Updating for a new tax year should be a change to THIS FILE ONLY.
 */

/** The year of assessment these figures apply to. */
export const TAX_YEAR = 2026;

/** When the figures in this file were last verified against primary sources. ISO date. */
export const FIGURES_AS_AT = '2026-09-04';

export type TaxBracket = {
  /** Lower bound, exclusive of the previous band. */
  min: number;
  /** Upper bound. `Infinity` for the top band. */
  max: number;
  /** Marginal rate as a fraction, e.g. 0.15 for 15%. */
  rate: number;
};

/**
 * Nigeria Tax Act 2025, Fourth Schedule (Gazette p. A542), referred from s.58(1).
 * In force from 1 January 2026. Quoted verbatim in 03-tax-content-2026.md §1.
 *
 *   (a) First N800,000 at 0%;      (d) Next N13,000,000 at 21%;
 *   (b) Next N2,200,000 at 15%;    (e) Next N25,000,000 at 23%; and
 *   (c) Next N9,000,000 at 18%;    (f) Above N50,000,000 at 25%.
 */
export const NTA_2026_BRACKETS: readonly TaxBracket[] = [
  { min: 0, max: 800_000, rate: 0 },
  { min: 800_000, max: 3_000_000, rate: 0.15 },
  { min: 3_000_000, max: 12_000_000, rate: 0.18 },
  { min: 12_000_000, max: 25_000_000, rate: 0.21 },
  { min: 25_000_000, max: 50_000_000, rate: 0.23 },
  { min: 50_000_000, max: Infinity, rate: 0.25 },
] as const;

/**
 * The pre-2026 PITA graduated rates, retained only to show users how the change affected
 * them. Verified against the FCT Internal Revenue Service "Guide to Personal Income Tax
 * Computation". These rates no longer apply to any year of assessment.
 */
export const PITA_PRE_2026_BRACKETS: readonly TaxBracket[] = [
  { min: 0, max: 300_000, rate: 0.07 },
  { min: 300_000, max: 600_000, rate: 0.11 },
  { min: 600_000, max: 1_100_000, rate: 0.15 },
  { min: 1_100_000, max: 1_600_000, rate: 0.19 },
  { min: 1_600_000, max: 3_200_000, rate: 0.21 },
  { min: 3_200_000, max: Infinity, rate: 0.24 },
] as const;

/**
 * Human-readable band labels, derived from the bracket data above so the displayed table
 * and the arithmetic can never drift apart. (They were two separate literals before —
 * see 00-audit.md §6.3.)
 */
export function describeBrackets(brackets: readonly TaxBracket[]) {
  return brackets.map((b, i) => {
    const rate = `${Math.round(b.rate * 100)}%`;
    if (b.max === Infinity) return { amount: `Above ₦${b.min.toLocaleString('en-NG')}`, rate, zeroRated: b.rate === 0 };
    const size = b.max - b.min;
    return {
      amount: `${i === 0 ? 'First' : 'Next'} ₦${size.toLocaleString('en-NG')}`,
      rate,
      zeroRated: b.rate === 0,
    };
  });
}

/** National minimum wage, monthly. Earners at or below it are not liable to PAYE. */
export const NATIONAL_MINIMUM_WAGE_MONTHLY = 70_000;
export const NATIONAL_MINIMUM_WAGE_ANNUAL = NATIONAL_MINIMUM_WAGE_MONTHLY * 12;

/** Statutory relief parameters. */
export const RELIEF_RULES = {
  /** Pension Reform Act 2014 s.4(1): employee contributes a minimum of 8% of monthly
   *  emoluments, defined as not less than basic + housing + transport. It is a FLOOR,
   *  not a cap — voluntary contributions above it are permitted. */
  pensionMinimumRate: 0.08,
  /** National Housing Fund: 2.5% of basic salary. */
  nhfRateOfBasic: 0.025,
  /** NTA 2025 s.30(2)(a)(vi): 20% of annual rent paid, capped at ₦500,000. */
  rentReliefRate: 0.2,
  rentReliefCap: 500_000,
  /** Rent above this point cannot increase the relief. */
  get rentAtWhichCapBinds() {
    return this.rentReliefCap / this.rentReliefRate; // ₦2,500,000
  },
  /** Pre-2026 Consolidated Relief Allowance: higher of ₦200,000 or 1% of gross, plus 20%. */
  priorCraFloor: 200_000,
  priorCraRateOfGross: 0.01,
  priorCraAdditionalRateOfGross: 0.2,
  /** Pre-2026 minimum tax: 1% of gross where computed tax falls below it. */
  priorMinimumTaxRate: 0.01,
} as const;
