import { describe, expect, it } from 'vitest';
import {
  NATIONAL_MINIMUM_WAGE_ANNUAL,
  NTA_2026_BRACKETS,
  PITA_PRE_2026_BRACKETS,
  describeBrackets,
} from './brackets';
import {
  computeCreatorTax,
  computeSalaryTax,
  pensionRelief,
  rentRelief,
  taxOn,
  type SalaryInput,
} from './compute';

/** The audited worked example: a Lagos earner on ₦780,000/month total compensation. */
const DEMO: SalaryInput = {
  basic: 450_000 * 12,
  housing: 180_000 * 12,
  transport: 90_000 * 12,
  other: 60_000 * 12,
  pensionRatePercent: 8,
  nhfEnabled: true,
  nhisAnnual: 12_000 * 12,
  annualRentPaid: 2_400_000,
};

describe('NTA 2026 bracket boundaries', () => {
  // Fourth Schedule: 0% / 15% / 18% / 21% / 23% / 25%
  it.each([
    [0, 0],
    [800_000, 0], // the whole first band is tax free
    [800_001, 0.15], // first naira into band 2
    [3_000_000, 0 + 2_200_000 * 0.15],
    [3_000_001, 330_000 + 0.18],
    [12_000_000, 330_000 + 9_000_000 * 0.18],
    [25_000_000, 330_000 + 1_620_000 + 13_000_000 * 0.21],
    [50_000_000, 330_000 + 1_620_000 + 2_730_000 + 25_000_000 * 0.23],
  ])('taxes ₦%s at exactly the band edge', (income, expected) => {
    expect(taxOn(income, NTA_2026_BRACKETS)).toBeCloseTo(expected, 2);
  });

  it('applies 25% above ₦50,000,000', () => {
    const at50 = taxOn(50_000_000, NTA_2026_BRACKETS);
    expect(taxOn(51_000_000, NTA_2026_BRACKETS) - at50).toBeCloseTo(1_000_000 * 0.25, 2);
  });

  it('never taxes the first ₦800,000', () => {
    expect(taxOn(799_999, NTA_2026_BRACKETS)).toBe(0);
  });
});

describe('pre-2026 PITA bracket boundaries', () => {
  it.each([
    [300_000, 21_000],
    [600_000, 21_000 + 33_000],
    [1_100_000, 54_000 + 75_000],
    [1_600_000, 129_000 + 95_000],
    [3_200_000, 224_000 + 336_000],
  ])('taxes ₦%s at exactly the band edge', (income, expected) => {
    expect(taxOn(income, PITA_PRE_2026_BRACKETS)).toBeCloseTo(expected, 2);
  });

  it('applies 24% above ₦3,200,000', () => {
    const at = taxOn(3_200_000, PITA_PRE_2026_BRACKETS);
    expect(taxOn(4_200_000, PITA_PRE_2026_BRACKETS) - at).toBeCloseTo(1_000_000 * 0.24, 2);
  });
});

describe('pension relief — the corrected base', () => {
  it('is 8% of basic + housing + transport, NOT gross', () => {
    // The defect this replaces: 8% of gross would be ₦748,800.
    expect(pensionRelief(5_400_000, 2_160_000, 1_080_000, 8)).toBe(691_200);
  });

  it('excludes "other allowances" from the pensionable base end-to-end', () => {
    // Raising "other allowances" must raise gross but leave the pension relief untouched.
    // If pension were computed on gross — the defect being fixed — both would move.
    const lowOther = computeSalaryTax({ ...DEMO, other: 0 });
    const highOther = computeSalaryTax({ ...DEMO, other: 5_000_000 });
    expect(highOther.grossIncome).toBeGreaterThan(lowOther.grossIncome);
    expect(highOther.reliefs.pension).toBe(lowOther.reliefs.pension);
    expect(highOther.reliefs.pension).toBe(691_200);
  });

  it('allows voluntary contributions above the 8% statutory floor', () => {
    expect(pensionRelief(1_000_000, 0, 0, 10)).toBe(100_000);
  });
});

describe('rent relief', () => {
  it('is 20% of annual rent', () => {
    expect(rentRelief(1_000_000)).toBe(200_000);
  });

  it('caps at ₦500,000', () => {
    expect(rentRelief(10_000_000)).toBe(500_000);
  });

  it('binds exactly at ₦2,500,000 of rent', () => {
    expect(rentRelief(2_500_000)).toBe(500_000);
    expect(rentRelief(2_499_999)).toBeLessThan(500_000);
  });

  it('is zero when no rent is declared', () => {
    expect(rentRelief(0)).toBe(0);
  });
});

describe('NHF', () => {
  it('is 2.5% of basic salary', () => {
    expect(computeSalaryTax({ ...DEMO, annualRentPaid: 0 }).reliefs.nhf).toBe(135_000);
  });

  it('is zero when disabled', () => {
    expect(computeSalaryTax({ ...DEMO, nhfEnabled: false }).reliefs.nhf).toBe(0);
  });
});

describe('national minimum wage exemption', () => {
  it('zeroes tax at exactly the minimum wage', () => {
    const r = computeSalaryTax({
      basic: NATIONAL_MINIMUM_WAGE_ANNUAL,
      housing: 0,
      transport: 0,
      other: 0,
      pensionRatePercent: 0,
      nhfEnabled: false,
      nhisAnnual: 0,
      annualRentPaid: 0,
    });
    // Without the exemption this returns ₦6,000 — the defect being fixed here.
    expect(r.annualTax).toBe(0);
    expect(r.exemptUnderMinimumWage).toBe(true);
  });

  it('does not apply one naira above the minimum wage', () => {
    const r = computeSalaryTax({
      basic: NATIONAL_MINIMUM_WAGE_ANNUAL + 1,
      housing: 0,
      transport: 0,
      other: 0,
      pensionRatePercent: 0,
      nhfEnabled: false,
      nhisAnnual: 0,
      annualRentPaid: 0,
    });
    expect(r.exemptUnderMinimumWage).toBe(false);
  });
});

describe('zero and empty input', () => {
  it('returns zero tax for zero salary income', () => {
    const r = computeSalaryTax({
      basic: 0, housing: 0, transport: 0, other: 0,
      pensionRatePercent: 8, nhfEnabled: true, nhisAnnual: 0, annualRentPaid: 0,
    });
    expect(r.grossIncome).toBe(0);
    expect(r.annualTax).toBe(0);
    expect(r.effectiveRate).toBe(0);
    expect(r.exemptUnderMinimumWage).toBe(false);
  });

  it('returns zero tax for zero creator income', () => {
    const r = computeCreatorTax({ grossIncome: 0, businessExpenses: 0, annualRentPaid: 0 });
    expect(r.annualTax).toBe(0);
    expect(r.effectiveRate).toBe(0);
  });

  it('never returns negative taxable income when reliefs exceed gross', () => {
    const r = computeCreatorTax({ grossIncome: 100_000, businessExpenses: 900_000, annualRentPaid: 0 });
    expect(r.taxableIncome).toBe(0);
    expect(r.annualTax).toBe(0);
  });
});

describe('take-home', () => {
  it('nets off PAYE, pension, NHF and NHIS', () => {
    const r = computeSalaryTax(DEMO);
    const expected =
      r.grossIncome - r.annualTax - r.reliefs.pension - r.reliefs.nhf - r.reliefs.nhis;
    expect(r.takeHomeAnnual).toBeCloseTo(expected, 2);
  });

  it('is materially lower than the old gross-less-tax figure', () => {
    const r = computeSalaryTax(DEMO);
    const oldWrongFigure = r.grossIncome - r.annualTax;
    // The audited overstatement was ~₦1.0m/yr.
    expect(oldWrongFigure - r.takeHomeAnnual).toBeCloseTo(970_200, 0);
  });

  it('nets business expenses for creators', () => {
    const r = computeCreatorTax({ grossIncome: 10_200_000, businessExpenses: 2_280_000, annualRentPaid: 0 });
    expect(r.takeHomeAnnual).toBeCloseTo(10_200_000 - 2_280_000 - r.annualTax, 2);
  });
});

describe('creator path', () => {
  it('grants rent relief, which it previously did not', () => {
    const withRent = computeCreatorTax({ grossIncome: 10_200_000, businessExpenses: 2_280_000, annualRentPaid: 2_400_000 });
    const withoutRent = computeCreatorTax({ grossIncome: 10_200_000, businessExpenses: 2_280_000, annualRentPaid: 0 });
    expect(withRent.reliefs.rentRelief).toBe(480_000);
    expect(withRent.annualTax).toBeLessThan(withoutRent.annualTax);
  });
});

describe('regime comparison', () => {
  it('reports a saving for a mid earner', () => {
    const r = computeSalaryTax(DEMO);
    expect(r.comparison.difference).toBeGreaterThan(0);
  });

  it('reports a NEGATIVE difference for a high earner — 2026 costs more', () => {
    const high = computeSalaryTax({
      basic: 1_650_000 * 12, housing: 660_000 * 12, transport: 360_000 * 12, other: 330_000 * 12,
      pensionRatePercent: 8, nhfEnabled: true, nhisAnnual: 0, annualRentPaid: 2_400_000,
    });
    expect(high.grossIncome).toBe(36_000_000);
    expect(high.comparison.difference).toBeLessThan(0);
  });

  it('applies the pre-2026 1% minimum tax on very low incomes', () => {
    const r = computeSalaryTax({
      basic: 200_000, housing: 0, transport: 0, other: 0,
      pensionRatePercent: 0, nhfEnabled: false, nhisAnnual: 0, annualRentPaid: 0,
    });
    // CRA wipes out chargeable income, so the prior regime falls back to 1% of gross.
    expect(r.comparison.priorRegimeAnnualTax).toBeCloseTo(2_000, 2);
  });
});

describe('golden file — the audited worked example', () => {
  it('reproduces every figure in docs/design/03-tax-content-2026.md §4', () => {
    const r = computeSalaryTax(DEMO);
    expect(r.grossIncome).toBe(9_360_000);
    expect(r.reliefs.pension).toBe(691_200);
    expect(r.reliefs.nhf).toBe(135_000);
    expect(r.reliefs.nhis).toBe(144_000);
    expect(r.reliefs.rentRelief).toBe(480_000);
    expect(r.reliefs.total).toBe(1_450_200);
    expect(r.taxableIncome).toBe(7_909_800);
    expect(Math.round(r.annualTax)).toBe(1_213_764);
    expect(Math.round(r.monthlyTax)).toBe(101_147);
    expect(r.effectiveRate).toBeCloseTo(12.97, 2);
    expect(Math.round(r.takeHomeAnnual)).toBe(7_176_036);
  });
});

describe('displayed bands are derived from the same data as the arithmetic', () => {
  it('describes the 2026 bands', () => {
    expect(describeBrackets(NTA_2026_BRACKETS).map((b) => `${b.amount} @ ${b.rate}`)).toEqual([
      'First ₦800,000 @ 0%',
      'Next ₦2,200,000 @ 15%',
      'Next ₦9,000,000 @ 18%',
      'Next ₦13,000,000 @ 21%',
      'Next ₦25,000,000 @ 23%',
      'Above ₦50,000,000 @ 25%',
    ]);
  });

  it('describes the pre-2026 bands', () => {
    expect(describeBrackets(PITA_PRE_2026_BRACKETS).map((b) => `${b.amount} @ ${b.rate}`)).toEqual([
      'First ₦300,000 @ 7%',
      'Next ₦300,000 @ 11%',
      'Next ₦500,000 @ 15%',
      'Next ₦500,000 @ 19%',
      'Next ₦1,600,000 @ 21%',
      'Above ₦3,200,000 @ 24%',
    ]);
  });
});
