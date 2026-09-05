'use client';

import { FIGURES_AS_AT, TAX_YEAR, describeBrackets, formatNaira, NTA_2026_BRACKETS, PITA_PRE_2026_BRACKETS, type TaxResult } from '@/lib/tax';
import Link from 'next/link';
import { useState } from 'react';
import { Figure, RollingFigure } from './Figure';

const NTA_BANDS = describeBrackets(NTA_2026_BRACKETS);
const PITA_BANDS = describeBrackets(PITA_PRE_2026_BRACKETS);

function Line({ k, v, tone }: { k: string; v: string; tone?: 'positive' }) {
  return (
    <div className='flex items-baseline justify-between gap-3 py-1.5 text-sm'>
      <span className='text-ink-400'>{k}</span>
      <Figure className={`font-medium ${tone === 'positive' ? 'text-positive-400' : 'text-ink-100'}`}>
        {v}
      </Figure>
    </div>
  );
}

function Disclosure({
  label,
  children,
  defaultOpen = false,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className='border-t border-white/10'>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className='flex min-h-11 w-full items-center gap-2 py-3 text-left text-sm font-semibold text-ink-300 transition-colors hover:text-white'>
        <span aria-hidden='true' className={`text-ink-500 transition-transform ${open ? 'rotate-90' : ''}`}>
          ▸
        </span>
        {label}
      </button>
      {open ? <div className='pb-4'>{children}</div> : null}
    </div>
  );
}

export function ResultRail({
  result,
  isCreator,
  hasInput,
  pensionRate,
  nhfEnabled,
  annualRentPaid,
}: {
  result: TaxResult;
  isCreator: boolean;
  hasInput: boolean;
  pensionRate: number;
  nhfEnabled: boolean;
  annualRentPaid: number;
}) {
  const { comparison } = result;
  const cheaper = comparison.difference > 0;
  const same = comparison.difference === 0;

  return (
    <aside
      aria-label='Your estimate'
      className='rounded-2xl border border-white/[0.12] bg-gradient-to-b from-white/[0.075] to-white/[0.03] p-6 lg:sticky lg:top-24'>
      <p className='text-[0.6875rem] font-bold tracking-[0.12em] text-ink-400 uppercase'>
        You owe · {TAX_YEAR}
      </p>

      <p className='mt-2.5 flex items-baseline text-[clamp(2.5rem,6.4vw,3.5rem)] leading-none font-bold text-white'>
        <span aria-hidden='true' className='mr-[3px] font-mono font-medium text-ink-300'>
          ₦
        </span>
        {hasInput ? (
          <RollingFigure value={formatNaira(result.monthlyTax)} />
        ) : (
          <Figure className='text-ink-500'>—</Figure>
        )}
      </p>

      {/* The only place the figure is announced. Debounced upstream so it does not fire on
          every keystroke. */}
      <p className='sr-only' aria-live='polite' aria-atomic='true'>
        {hasInput
          ? `You owe ₦${formatNaira(result.monthlyTax)} per month, ₦${formatNaira(result.annualTax)} per year.`
          : 'Enter your income to see what you owe.'}
      </p>

      <p className='mt-1.5 text-[0.9375rem] text-ink-300'>
        {hasInput ? (
          <>
            a month · <Figure>₦{formatNaira(result.annualTax)}</Figure> a year
          </>
        ) : (
          `Enter what you earn to see what you owe in ${TAX_YEAR}.`
        )}
      </p>

      {result.exemptUnderMinimumWage ? (
        <p className='mt-3 rounded-lg border border-positive-400/25 bg-positive-400/10 px-3 py-2 text-xs text-positive-400'>
          At or below the national minimum wage, so no PAYE is due.
        </p>
      ) : null}

      <div className='my-5 h-px bg-white/10' />

      <Line k='Gross income' v={`₦${formatNaira(result.grossIncome)}`} />
      <Line k={isCreator ? 'Deductions' : 'Total reliefs'} v={`−₦${formatNaira(result.reliefs.total)}`} tone='positive' />
      <Line k='Taxable income' v={`₦${formatNaira(result.taxableIncome)}`} />
      <Line k='Effective rate' v={`${result.effectiveRate.toFixed(1)}%`} />

      <div className='my-5 h-px bg-white/10' />

      <div className='flex items-baseline justify-between gap-3'>
        <span className='text-sm text-ink-400'>You keep</span>
        <Figure className='text-xl font-bold text-positive-400'>
          ₦{formatNaira(result.takeHomeMonthly)}
          <span className='text-xs font-normal text-ink-500'>/mo</span>
        </Figure>
      </div>

      <p className='my-4 text-xs leading-relaxed text-ink-500'>
        Estimate only, not tax advice. Calculated under the Nigeria Tax Act 2025, in force from
        1 January {TAX_YEAR}. Covers employment and self-employment income only. Figures as at{' '}
        {FIGURES_AS_AT}.
      </p>

      <Disclosure label={isCreator ? 'Deductions breakdown' : 'Reliefs breakdown'}>
        <div className='space-y-1'>
          {isCreator ? (
            <Line k='Business expenses' v={`₦${formatNaira(result.reliefs.businessExpenses)}`} />
          ) : (
            <>
              <Line k={`Pension (${pensionRate}% of basic + housing + transport)`} v={`₦${formatNaira(result.reliefs.pension)}`} />
              {nhfEnabled ? <Line k='NHF (2.5% of basic)' v={`₦${formatNaira(result.reliefs.nhf)}`} /> : null}
              {result.reliefs.nhis > 0 ? <Line k='NHIS' v={`₦${formatNaira(result.reliefs.nhis)}`} /> : null}
            </>
          )}
          {result.reliefs.rentRelief > 0 ? (
            <Line k={`Rent relief (20% of ₦${formatNaira(annualRentPaid)})`} v={`₦${formatNaira(result.reliefs.rentRelief)}`} />
          ) : null}
          <div className='mt-2 flex items-baseline justify-between gap-3 border-t border-white/10 pt-2 text-sm'>
            <span className='font-bold text-white'>Total</span>
            <Figure className='font-bold text-positive-400'>₦{formatNaira(result.reliefs.total)}</Figure>
          </div>
        </div>
      </Disclosure>

      <Disclosure label={`How this compares to the pre-${TAX_YEAR} PITA rules`} defaultOpen>
        <div className='rounded-xl bg-black/25 p-3.5'>
          <ComparisonBar
            label={`${TAX_YEAR} · Nigeria Tax Act`}
            amount={result.annualTax}
            max={Math.max(result.annualTax, comparison.priorRegimeAnnualTax, 1)}
            fill='bg-gradient-to-r from-brand-600 to-brand-400'
            delay={100}
          />
          <ComparisonBar
            label={`Pre-${TAX_YEAR} · PITA rules`}
            amount={comparison.priorRegimeAnnualTax}
            max={Math.max(result.annualTax, comparison.priorRegimeAnnualTax, 1)}
            fill='bg-ink-600'
            delay={240}
          />
          <p
            className={`pt-0.5 text-center text-sm font-semibold ${
              same ? 'text-ink-400' : cheaper ? 'text-positive-400' : 'text-negative-500'
            }`}>
            {!hasInput
              ? 'Enter your income to compare.'
              : same
                ? `No difference under the ${TAX_YEAR} rules`
                : `₦${formatNaira(Math.abs(comparison.difference))} ${cheaper ? 'less' : 'more'} under the ${TAX_YEAR} rules`}
          </p>
          <p className='mt-2 text-center text-xs text-ink-500'>
            The pre-{TAX_YEAR} rules no longer apply. Shown for context only.
          </p>
        </div>
      </Disclosure>

      <Disclosure label={`The ${TAX_YEAR} tax bands`} defaultOpen={!hasInput}>
        <div className='grid gap-4 sm:grid-cols-2'>
          <BandTable title={`${TAX_YEAR} · Nigeria Tax Act`} bands={NTA_BANDS} accent />
          <BandTable title={`Pre-${TAX_YEAR} · PITA`} bands={PITA_BANDS} />
        </div>
      </Disclosure>

      <div className='h-4' />
      <Link
        href='#waitlist'
        className='block min-h-11 rounded-lg bg-brand-600 px-4 py-3.5 text-center text-[0.9375rem] font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:bg-brand-700 hover:shadow-[0_10px_26px_-10px_rgb(59_130_246/0.7)]'>
        Taash tracks this all year — join the waitlist
      </Link>
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
    <div className='mb-3 last:mb-1'>
      <div className='mb-1.5 flex justify-between gap-3 text-[0.8125rem] text-ink-400'>
        <span>{label}</span>
        <Figure className='font-semibold text-white'>₦{formatNaira(amount)}</Figure>
      </div>
      <div className='h-2.5 overflow-hidden rounded-[3px] bg-white/[0.09]'>
        <div
          className={`h-full origin-left rounded-[3px] transition-[width] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${fill}`}
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
      <p className='mb-2 text-[0.6875rem] font-bold tracking-[0.08em] text-ink-500 uppercase'>{title}</p>
      <table className='w-full text-[0.8125rem]'>
        <tbody>
          {bands.map((b, i) => (
            <tr key={`${b.amount}-${i}`} className='border-b border-white/[0.06] last:border-b-0'>
              <th scope='row' className='py-1.5 text-left font-normal text-ink-400'>
                {b.amount}
              </th>
              <td className='py-1.5 text-right'>
                <Figure
                  className={`font-semibold ${
                    accent && b.zeroRated ? 'text-positive-400' : 'text-ink-200'
                  }`}>
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
