import {
  NATIONAL_MINIMUM_WAGE_ANNUAL,
  NTA_2026_BRACKETS,
  PITA_PRE_2026_BRACKETS,
  RELIEF_RULES,
  type TaxBracket,
} from './brackets';

/** Applies a graduated bracket table to a taxable amount. */
export function taxOn(taxableIncome: number, brackets: readonly TaxBracket[]): number {
  let tax = 0;
  let remaining = Math.max(0, taxableIncome);
  for (const band of brackets) {
    if (remaining <= 0) break;
    const inBand = Math.min(remaining, band.max - band.min);
    tax += inBand * band.rate;
    remaining -= inBand;
  }
  return tax;
}

/**
 * Employee pension contribution.
 *
 * Nigeria Tax Act 2025 s.30(2)(a)(iii) makes "contributions under the Pension Reform Act"
 * deductible. PRA 2014 s.4(1) sets the employee contribution at a minimum of 8% of
 * "monthly emoluments", defined as not less than basic + housing + transport — NOT gross.
 * FCT-IRS guidance states the same: "National Pension Scheme (8% of Basic, Housing and
 * Transport)".
 *
 * The previous implementation used gross income, which over-stated the relief whenever the
 * user entered anything under "Other allowances" and therefore UNDER-stated their tax.
 * See docs/design/03-tax-content-2026.md §4.
 *
 * No upper clamp: 8% is a statutory floor, and voluntary contributions above it are
 * permitted. Whether excess voluntary contributions are deductible without limit is marked
 * Medium confidence in §3.2 of that document and should be confirmed with a tax adviser.
 */
export function pensionRelief(
  basic: number,
  housing: number,
  transport: number,
  ratePercent: number = RELIEF_RULES.pensionMinimumRate * 100
): number {
  const pensionableEmoluments = basic + housing + transport;
  return Math.max(0, pensionableEmoluments * (ratePercent / 100));
}

/** National Housing Fund: 2.5% of basic salary. */
export function nhfRelief(basic: number, enabled: boolean): number {
  return enabled ? Math.max(0, basic) * RELIEF_RULES.nhfRateOfBasic : 0;
}

/** Rent relief: 20% of annual rent paid, capped at ₦500,000. */
export function rentRelief(annualRentPaid: number): number {
  return Math.min(Math.max(0, annualRentPaid) * RELIEF_RULES.rentReliefRate, RELIEF_RULES.rentReliefCap);
}

/** Pre-2026 Consolidated Relief Allowance. Abolished by the Nigeria Tax Act 2025. */
export function priorConsolidatedRelief(grossIncome: number): number {
  const g = Math.max(0, grossIncome);
  return (
    Math.max(g * RELIEF_RULES.priorCraRateOfGross, RELIEF_RULES.priorCraFloor) +
    g * RELIEF_RULES.priorCraAdditionalRateOfGross
  );
}

export type Reliefs = {
  pension: number;
  nhf: number;
  nhis: number;
  rentRelief: number;
  businessExpenses: number;
  total: number;
};

export type Comparison = {
  priorRegimeAnnualTax: number;
  priorRegimeMonthlyTax: number;
  priorRegimeEffectiveRate: number;
  /** Positive = you pay LESS under the 2026 rules. Negative = you pay MORE. */
  difference: number;
  differencePercent: number;
};

export type TaxResult = {
  grossIncome: number;
  reliefs: Reliefs;
  taxableIncome: number;
  annualTax: number;
  monthlyTax: number;
  effectiveRate: number;
  takeHomeAnnual: number;
  takeHomeMonthly: number;
  /** True when the national-minimum-wage exemption zeroed the liability. */
  exemptUnderMinimumWage: boolean;
  comparison: Comparison;
};

export type SalaryInput = {
  /** All figures ANNUAL. */
  basic: number;
  housing: number;
  transport: number;
  other: number;
  pensionRatePercent: number;
  nhfEnabled: boolean;
  nhisAnnual: number;
  annualRentPaid: number;
};

export type CreatorInput = {
  /** All figures ANNUAL. */
  grossIncome: number;
  businessExpenses: number;
  annualRentPaid: number;
};

function comparisonOf(grossIncome: number, currentTax: number, priorTax: number): Comparison {
  const difference = priorTax - currentTax;
  return {
    priorRegimeAnnualTax: priorTax,
    priorRegimeMonthlyTax: priorTax / 12,
    priorRegimeEffectiveRate: grossIncome > 0 ? (priorTax / grossIncome) * 100 : 0,
    difference,
    differencePercent: priorTax > 0 ? (difference / priorTax) * 100 : 0,
  };
}

/** Pre-2026 minimum tax: 1% of gross where the computed liability falls below it. */
function applyPriorMinimumTax(tax: number, grossIncome: number): number {
  return Math.max(tax, Math.max(0, grossIncome) * RELIEF_RULES.priorMinimumTaxRate);
}

export function computeSalaryTax(input: SalaryInput): TaxResult {
  const basic = Math.max(0, input.basic);
  const housing = Math.max(0, input.housing);
  const transport = Math.max(0, input.transport);
  const other = Math.max(0, input.other);
  const grossIncome = basic + housing + transport + other;

  const pension = pensionRelief(basic, housing, transport, input.pensionRatePercent);
  const nhf = nhfRelief(basic, input.nhfEnabled);
  const nhis = Math.max(0, input.nhisAnnual);
  const rent = rentRelief(input.annualRentPaid);

  const reliefs: Reliefs = {
    pension,
    nhf,
    nhis,
    rentRelief: rent,
    businessExpenses: 0,
    total: pension + nhf + nhis + rent,
  };

  const taxableIncome = Math.max(0, grossIncome - reliefs.total);

  // Employees earning no more than the national minimum wage are not liable to PAYE.
  const exemptUnderMinimumWage = grossIncome > 0 && grossIncome <= NATIONAL_MINIMUM_WAGE_ANNUAL;
  const annualTax = exemptUnderMinimumWage ? 0 : taxOn(taxableIncome, NTA_2026_BRACKETS);

  // Take-home nets off the statutory contributions the employee actually pays. Rent relief
  // is a relief, not a payroll deduction, so it is correctly absent here.
  const takeHomeAnnual = grossIncome - annualTax - pension - nhf - nhis;

  const priorTaxable = Math.max(
    0,
    grossIncome - (priorConsolidatedRelief(grossIncome) + pension + nhf + nhis)
  );
  const priorTax = applyPriorMinimumTax(taxOn(priorTaxable, PITA_PRE_2026_BRACKETS), grossIncome);

  return {
    grossIncome,
    reliefs,
    taxableIncome,
    annualTax,
    monthlyTax: annualTax / 12,
    effectiveRate: grossIncome > 0 ? (annualTax / grossIncome) * 100 : 0,
    takeHomeAnnual,
    takeHomeMonthly: takeHomeAnnual / 12,
    exemptUnderMinimumWage,
    comparison: comparisonOf(grossIncome, annualTax, priorTax),
  };
}

export function computeCreatorTax(input: CreatorInput): TaxResult {
  const grossIncome = Math.max(0, input.grossIncome);
  const businessExpenses = Math.max(0, input.businessExpenses);
  // Rent relief is not employment-specific — NTA 2025 s.30(2)(a)(vi) applies to individuals.
  // It was previously missing from this path entirely.
  const rent = rentRelief(input.annualRentPaid);

  const reliefs: Reliefs = {
    pension: 0,
    nhf: 0,
    nhis: 0,
    rentRelief: rent,
    businessExpenses,
    total: businessExpenses + rent,
  };

  const taxableIncome = Math.max(0, grossIncome - reliefs.total);
  const annualTax = taxOn(taxableIncome, NTA_2026_BRACKETS);

  // Business expenses are real outflows, so they are netted from take-home as well.
  const takeHomeAnnual = grossIncome - businessExpenses - annualTax;

  const priorTaxable = Math.max(
    0,
    grossIncome - (businessExpenses + priorConsolidatedRelief(grossIncome))
  );
  const priorTax = applyPriorMinimumTax(taxOn(priorTaxable, PITA_PRE_2026_BRACKETS), grossIncome);

  return {
    grossIncome,
    reliefs,
    taxableIncome,
    annualTax,
    monthlyTax: annualTax / 12,
    effectiveRate: grossIncome > 0 ? (annualTax / grossIncome) * 100 : 0,
    takeHomeAnnual,
    takeHomeMonthly: takeHomeAnnual / 12,
    // The minimum-wage exemption is expressed for employees / PAYE. Not applied here.
    exemptUnderMinimumWage: false,
    comparison: comparisonOf(grossIncome, annualTax, priorTax),
  };
}
