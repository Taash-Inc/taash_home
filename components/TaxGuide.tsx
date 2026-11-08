import {
  computeSalaryTax,
  describeBrackets,
  formatNaira,
  NATIONAL_MINIMUM_WAGE_MONTHLY,
  NTA_2026_BRACKETS,
  RELIEF_RULES,
  TAX_YEAR,
} from '@/lib/tax';

/**
 * The written guide under the calculator on /tax-calculator: the bands, what lowers your tax,
 * a worked example and what changed. Search engines rank a page on what it says, and people
 * searching "Nigeria tax 2026" want the rules as well as a number.
 *
 * Every figure is computed from lib/tax (sources in docs/design/03-tax-content-2026.md), so the
 * guide and the calculator above it can never disagree.
 */
const BANDS = describeBrackets(NTA_2026_BRACKETS);

// The calculator's own example figures, monthly.
const EXAMPLE = { basic: 450_000, housing: 180_000, transport: 90_000, other: 60_000 };
const example = computeSalaryTax({
  basic: EXAMPLE.basic * 12,
  housing: EXAMPLE.housing * 12,
  transport: EXAMPLE.transport * 12,
  other: EXAMPLE.other * 12,
  pensionRatePercent: RELIEF_RULES.pensionMinimumRate * 100,
  nhfEnabled: true,
  nhisAnnual: 0,
  annualRentPaid: 0,
});
const monthlyGross = EXAMPLE.basic + EXAMPLE.housing + EXAMPLE.transport + EXAMPLE.other;
const n = (v: number) => `₦${formatNaira(v)}`;

const RELIEFS = [
  {
    title: 'Pension',
    body: `At least ${RELIEF_RULES.pensionMinimumRate * 100}% of your basic salary, housing and transport allowances, under the Pension Reform Act.`,
  },
  { title: 'National Housing Fund (NHF)', body: `${RELIEF_RULES.nhfRateOfBasic * 100}% of your basic salary.` },
  { title: 'Health insurance (NHIS)', body: 'Your contributions to the National Health Insurance Scheme.' },
  {
    title: 'Rent relief',
    body: `${Math.round(RELIEF_RULES.rentReliefRate * 100)}% of the rent you pay in a year, up to ${n(RELIEF_RULES.rentReliefCap)}.`,
  },
  {
    title: 'Business costs',
    body: 'For freelance and business income: what it costs you to earn it, such as equipment, data and transport for work.',
  },
];

export default function TaxGuide() {
  return (
    <section className='border-t border-ink-200 bg-white py-20 lg:py-24'>
      <div className='mx-auto max-w-3xl px-4 sm:px-6'>
        <h2 className='text-3xl font-bold tracking-tight text-balance text-ink-1000 md:text-[2.25rem] md:leading-[1.12]'>
          How personal income tax works in Nigeria in {TAX_YEAR}
        </h2>
        <p className='mt-4 text-lg leading-relaxed text-ink-700'>
          The Nigeria Tax Act 2025 sets the rates from 1 January {TAX_YEAR}. Your taxable income is
          what you earn minus your reliefs and deductions, and it is taxed in bands: each band is
          taxed at its own rate, so a higher rate only applies to the part of your income inside
          that band.
        </p>

        <h3 className='mt-10 text-xl font-bold text-ink-1000'>The {TAX_YEAR} tax bands</h3>
        <div className='mt-4 overflow-hidden rounded-2xl ring-1 ring-ink-200'>
          <table className='w-full text-left'>
            <caption className='sr-only'>Personal income tax bands under the Nigeria Tax Act 2025</caption>
            <thead className='bg-ink-50 text-sm text-ink-700'>
              <tr>
                <th scope='col' className='px-4 py-3 font-semibold'>
                  Taxable income
                </th>
                <th scope='col' className='px-4 py-3 text-right font-semibold'>
                  Rate
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-ink-200'>
              {BANDS.map((b) => (
                <tr key={b.amount}>
                  <th scope='row' className='px-4 py-3 font-medium text-ink-900'>
                    {b.amount}
                  </th>
                  <td className={`px-4 py-3 text-right font-bold tabular-nums ${b.zeroRated ? 'text-positive-700' : 'text-ink-1000'}`}>
                    {b.rate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className='mt-10 text-xl font-bold text-ink-1000'>What lowers your tax</h3>
        <ul className='mt-4 grid gap-3 sm:grid-cols-2'>
          {RELIEFS.map((r) => (
            <li key={r.title} className='rounded-2xl bg-ink-50 p-4 ring-1 ring-ink-200'>
              <p className='font-semibold text-ink-1000'>{r.title}</p>
              <p className='mt-1 text-sm leading-relaxed text-ink-700'>{r.body}</p>
            </li>
          ))}
        </ul>
        <p className='mt-4 text-ink-700'>
          If your salary is at or below the national minimum wage of{' '}
          {n(NATIONAL_MINIMUM_WAGE_MONTHLY)} a month, no PAYE is due.
        </p>

        <h3 className='mt-10 text-xl font-bold text-ink-1000'>A worked example</h3>
        <p className='mt-3 leading-relaxed text-ink-700'>
          Someone paid {n(monthlyGross)} a month ({n(EXAMPLE.basic)} basic, {n(EXAMPLE.housing)}{' '}
          housing, {n(EXAMPLE.transport)} transport and {n(EXAMPLE.other)} other allowances), paying{' '}
          {RELIEF_RULES.pensionMinimumRate * 100}% pension and the National Housing Fund, has{' '}
          {n(example.reliefs.total)} of reliefs a year. Their taxable income is{' '}
          {n(example.taxableIncome)}, and their tax comes to{' '}
          <strong className='text-ink-1000'>{n(example.annualTax)} a year</strong>, about{' '}
          <strong className='text-ink-1000'>{n(example.monthlyTax)} a month</strong>, an effective
          rate of {example.effectiveRate.toFixed(1)}%.
        </p>

        <h3 className='mt-10 text-xl font-bold text-ink-1000'>What changed from the old rules</h3>
        <p className='mt-3 leading-relaxed text-ink-700'>
          Before {TAX_YEAR}, the Personal Income Tax Act taxed the first ₦300,000 at 7% and gave
          everyone a Consolidated Relief Allowance. The Nigeria Tax Act 2025 replaced both: the first
          ₦800,000 of taxable income is now tax-free, and rent relief is new. Many people on low and
          middle incomes pay less as a result, while some higher earners pay more; the calculator
          above shows the difference for you.
        </p>
      </div>
    </section>
  );
}
