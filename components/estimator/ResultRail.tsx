'use client';

import {
  FIGURES_AS_AT,
  TAX_YEAR,
  describeBrackets,
  formatNaira,
  NTA_2026_BRACKETS,
  PITA_PRE_2026_BRACKETS,
  type TaxResult,
} from '@/lib/tax';
import { useState } from 'react';
import WaitlistCapture from '../WaitlistCapture';
import { Figure, RollingFigure } from './Figure';

const NTA_BANDS = describeBrackets(NTA_2026_BRACKETS);
const PITA_BANDS = describeBrackets(PITA_PRE_2026_BRACKETS);

function Line({ k, v, tone, strong }: { k: string; v: string; tone?: 'positive'; strong?: boolean }) {
  return (
    <div className='flex items-baseline justify-between gap-3 py-1.5 text-sm'>
      <span className={strong ? 'font-bold text-ink-1000' : 'text-ink-700'}>{k}</span>
      <Figure className={`${strong ? 'font-bold' : 'font-medium'} ${tone === 'positive' ? 'text-positive-700' : 'text-ink-1000'}`}>
        {v}
      </Figure>
    </div>
  );
}

function Disclosure({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className='border-t border-ink-200 first:border-t-0'>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className='flex min-h-12 w-full items-center justify-between gap-2 py-3 text-left text-sm font-semibold text-ink-1000'>
        {label}
        <svg
          width='16'
          height='16'
          viewBox='0 0 16 16'
          fill='none'
          aria-hidden='true'
          className={`shrink-0 text-ink-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <path d='M4 6l4 4 4-4' stroke='currentColor' strokeWidth='1.75' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
      </button>
      {open ? <div className='pb-4'>{children}</div> : null}
    </div>
  );
}

/**
 * The answer. One navy card styled like the app's own "Estimated Tax" card: the monthly
 * figure, the yearly one, and what you keep. Signup sits straight under it. Everything else,
 * the workings, the comparison with the old rules and the bands, is folded away below: it
 * used to be open by default, which made an empty calculator a wall of zeros and tables.
 */
export function ResultRail({
  result,
  isCreator,
  hasInput,
  pensionRate,
  nhfEnabled,
  annualRentPaid,
  onTryExample,
}: {
  result: TaxResult;
  isCreator: boolean;
  hasInput: boolean;
  pensionRate: number;
  nhfEnabled: boolean;
  annualRentPaid: number;
  onTryExample: () => void;
}) {
  const { comparison } = result;
  const cheaper = comparison.difference > 0;
  const same = comparison.difference === 0;
  const max = Math.max(result.annualTax, comparison.priorRegimeAnnualTax, 1);

  return (
    <aside aria-label='Your estimate' className='space-y-4 lg:sticky lg:top-24'>
      <div className='relative overflow-hidden rounded-3xl bg-[#0a2140] p-6 text-white shadow-[0_30px_60px_-30px_rgb(9_23_48/0.6)] sm:p-7'>
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_0%,rgb(255_255_255/0.1),transparent_60%)]'
        />
        <div className='relative'>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='text-sm text-white/80'>Estimated tax · NTA 2025</p>
            {hasInput ? (
              <span className='rounded-full bg-[#fbe429]/15 px-2.5 py-0.5 text-xs font-semibold text-[#fbe429]'>
                {result.effectiveRate.toFixed(1)}% of income
              </span>
            ) : null}
          </div>

          <p className='mt-2 flex items-baseline text-[clamp(2.5rem,7vw,3.25rem)] leading-none font-bold tracking-tight'>
            <span aria-hidden='true' className='mr-0.5'>
              ₦
            </span>
            {hasInput ? (
              <RollingFigure value={formatNaira(result.monthlyTax)} />
            ) : (
              <span className='text-white/35'>0</span>
            )}
            <span className='ml-1.5 text-base font-medium text-white/60'>/month</span>
          </p>

          {/* The only place the figure is announced. */}
          <p className='sr-only' aria-live='polite' aria-atomic='true'>
            {hasInput
              ? `You owe ₦${formatNaira(result.monthlyTax)} per month, ₦${formatNaira(result.annualTax)} per year.`
              : 'Enter your income to see what you owe.'}
          </p>

          <p className='mt-2 text-sm text-white/65'>
            {hasInput ? (
              <>
                <Figure>₦{formatNaira(result.annualTax)}</Figure> for the year
              </>
            ) : (
              'Answer the questions to see your tax for 2026.'
            )}
          </p>

          {result.exemptUnderMinimumWage ? (
            <p className='mt-3 rounded-xl bg-[#22c55e]/15 px-3 py-2 text-xs text-[#8ef0b2]'>
              At or below the national minimum wage, so no tax is due.
            </p>
          ) : null}

          {hasInput ? (
            <>
              <div className='my-5 h-px bg-white/10' />
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-xs text-white/65'>You keep</p>
                  <Figure className='mt-0.5 block text-lg font-bold text-[#8ef0b2]'>
                    ₦{formatNaira(result.takeHomeMonthly)}
                    <span className='text-xs font-normal text-white/55'>/mo</span>
                  </Figure>
                </div>
                <div className='text-right'>
                  <p className='text-xs text-white/65'>{isCreator ? 'Deductions' : 'Reliefs'}</p>
                  <Figure className='mt-0.5 block text-lg font-bold'>
                    ₦{formatNaira(result.reliefs.total)}
                    <span className='text-xs font-normal text-white/55'>/yr</span>
                  </Figure>
                </div>
              </div>
              {same ? null : (
                <p
                  className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    cheaper ? 'bg-[#22c55e]/15 text-[#8ef0b2]' : 'bg-negative-500/15 text-[#ffb4ab]'
                  }`}>
                  ₦{formatNaira(Math.abs(comparison.difference))} {cheaper ? 'less' : 'more'} a year than the old rules
                </p>
              )}
            </>
          ) : (
            <button
              type='button'
              onClick={onTryExample}
              className='mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#fbe429] px-5 text-sm font-bold text-ink-1000 transition-transform duration-200 active:scale-[0.98]'>
              Try it with example figures
              <span aria-hidden='true'>→</span>
            </button>
          )}
        </div>
      </div>

      {/* The moment of value is the moment to ask. */}
      {hasInput ? (
        <div className='rounded-3xl bg-white p-5 ring-1 ring-ink-1000/[0.06] shadow-[0_18px_50px_-30px_rgb(15_23_42/0.35)]'>
          <p className='font-semibold text-ink-1000'>Track this all year with Taash</p>
          <p className='mt-1 mb-3 text-sm text-ink-700'>
            Get early access. Early members get a lifetime discount.
          </p>
          <WaitlistCapture placement='calculator' />
        </div>
      ) : null}

      <div className='rounded-3xl bg-white px-5 py-1 ring-1 ring-ink-1000/[0.06]'>
        <Disclosure label='How it’s worked out'>
          <Line k='Gross income' v={`₦${formatNaira(result.grossIncome)}`} />
          {isCreator ? (
            <Line k='Business expenses' v={`−₦${formatNaira(result.reliefs.businessExpenses)}`} tone='positive' />
          ) : (
            <>
              <Line k={`Pension (${pensionRate}%)`} v={`−₦${formatNaira(result.reliefs.pension)}`} tone='positive' />
              {nhfEnabled ? <Line k='Housing Fund (NHF)' v={`−₦${formatNaira(result.reliefs.nhf)}`} tone='positive' /> : null}
              {result.reliefs.nhis > 0 ? <Line k='Health insurance (NHIS)' v={`−₦${formatNaira(result.reliefs.nhis)}`} tone='positive' /> : null}
            </>
          )}
          {result.reliefs.rentRelief > 0 ? (
            <Line k={`Rent relief (20% of ₦${formatNaira(annualRentPaid)})`} v={`−₦${formatNaira(result.reliefs.rentRelief)}`} tone='positive' />
          ) : null}
          <div className='mt-1 border-t border-ink-200 pt-1'>
            <Line k='Taxable income' v={`₦${formatNaira(result.taxableIncome)}`} strong />
            <Line k='Tax for the year' v={`₦${formatNaira(result.annualTax)}`} strong />
          </div>
        </Disclosure>

        <Disclosure label={`Compared with the old (pre-${TAX_YEAR}) rules`}>
          <ComparisonBar label={`${TAX_YEAR} · Nigeria Tax Act`} amount={result.annualTax} max={max} fill='bg-ink-1000' delay={100} />
          <ComparisonBar label='Old PITA rules' amount={comparison.priorRegimeAnnualTax} max={max} fill='bg-ink-300' delay={240} />
          <p className='mt-2 text-xs text-ink-600'>The old rules no longer apply. Shown for context only.</p>
        </Disclosure>

        <Disclosure label={`The ${TAX_YEAR} tax bands`}>
          <div className='grid gap-4 sm:grid-cols-2'>
            <BandTable title={`${TAX_YEAR} · Nigeria Tax Act`} bands={NTA_BANDS} accent />
            <BandTable title='Old · PITA' bands={PITA_BANDS} />
          </div>
        </Disclosure>
      </div>

      <p className='px-1 text-xs leading-relaxed text-ink-600'>
        Estimate only, not tax advice. Calculated under the Nigeria Tax Act 2025, in force from 1
        January {TAX_YEAR}. Covers employment and self-employment income only. Figures as at{' '}
        {FIGURES_AS_AT}.
      </p>
    </aside>
  );
}

function ComparisonBar({
  label,
  amount,
  max,
  fill,
  delay,
}: {
  label: string;
  amount: number;
  max: number;
  fill: string;
  delay: number;
}) {
  const pct = Math.max(2, Math.round((amount / max) * 100));
  return (
    <div className='mb-3'>
      <div className='mb-1.5 flex justify-between gap-3 text-[0.8125rem] text-ink-700'>
        <span>{label}</span>
        <Figure className='font-semibold text-ink-1000'>₦{formatNaira(amount)}</Figure>
      </div>
      <div className='h-2.5 overflow-hidden rounded-full bg-ink-100'>
        <div
          className={`h-full rounded-full transition-[width] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${fill}`}
          style={{ width: `${pct}%`, transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}

function BandTable({
  title,
  bands,
  accent,
}: {
  title: string;
  bands: ReturnType<typeof describeBrackets>;
  accent?: boolean;
}) {
  return (
    <div>
      <p className='mb-2 text-[0.6875rem] font-bold tracking-[0.08em] text-ink-600 uppercase'>{title}</p>
      <table className='w-full text-[0.8125rem]'>
        <tbody>
          {bands.map((b) => (
            <tr key={`${title}-${b.amount}`} className='border-b border-ink-100 last:border-b-0'>
              <th scope='row' className='py-1.5 text-left font-normal text-ink-700'>
                {b.amount}
              </th>
              <td className='py-1.5 text-right'>
                <Figure className={`font-semibold ${accent && b.zeroRated ? 'text-positive-700' : 'text-ink-1000'}`}>
                  {b.rate}
                </Figure>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
