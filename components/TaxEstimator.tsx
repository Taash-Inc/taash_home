'use client';

import {
  computeCreatorTax,
  computeSalaryTax,
  formatNaira,
  parseAmount,
  RELIEF_RULES,
  TAX_YEAR,
} from '@/lib/tax';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DeductionsDrawer } from './estimator/DeductionsDrawer';
import { Figure } from './estimator/Figure';
import { ChoiceCards, MoneyField, PillToggle, RateField, Step, SwitchField } from './estimator/Field';
import { ResultRail } from './estimator/ResultRail';

type UserType = 'salary' | 'creator';

/** Re-formats a currency string as the user types, keeping only digits. */
const money = (v: string) => {
  const digits = v.replace(/[^0-9]/g, '');
  return digits ? formatNaira(Number(digits)) : '';
};

/**
 * `standalone` is the /tax-calculator page: the heading becomes the page's H1 and the section
 * clears the fixed header. On the homepage it is a section with an H2 and a link to that page.
 */
export default function TaxEstimator({ standalone = false }: { standalone?: boolean }) {
  const [userType, setUserType] = useState<UserType>('salary');
  const [incomeType, setIncomeType] = useState<'annual' | 'monthly'>('monthly');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reliefsOpen, setReliefsOpen] = useState(false);

  const [basicSalary, setBasicSalary] = useState('');
  const [housingAllowance, setHousingAllowance] = useState('');
  const [transportAllowance, setTransportAllowance] = useState('');
  const [otherAllowances, setOtherAllowances] = useState('');

  const [pensionRate, setPensionRate] = useState(8);
  const [nhfEnabled, setNhfEnabled] = useState(true);
  const [nhisAmount, setNhisAmount] = useState('');
  const [rentDeduction, setRentDeduction] = useState('');

  const [grossIncome, setGrossIncome] = useState('');
  const [businessExpenses, setBusinessExpenses] = useState('');

  const multiplier = incomeType === 'monthly' ? 12 : 1;
  const isCreator = userType === 'creator';
  const annualRentPaid = parseAmount(rentDeduction);

  const salary = useMemo(
    () =>
      computeSalaryTax({
        basic: parseAmount(basicSalary) * multiplier,
        housing: parseAmount(housingAllowance) * multiplier,
        transport: parseAmount(transportAllowance) * multiplier,
        other: parseAmount(otherAllowances) * multiplier,
        pensionRatePercent: pensionRate,
        nhfEnabled,
        nhisAnnual: parseAmount(nhisAmount) * multiplier,
        annualRentPaid,
      }),
    [
      basicSalary,
      housingAllowance,
      transportAllowance,
      otherAllowances,
      pensionRate,
      nhfEnabled,
      nhisAmount,
      annualRentPaid,
      multiplier,
    ]
  );

  const creator = useMemo(
    () =>
      computeCreatorTax({
        grossIncome: parseAmount(grossIncome) * multiplier,
        businessExpenses: parseAmount(businessExpenses) * multiplier,
        annualRentPaid,
      }),
    [grossIncome, businessExpenses, annualRentPaid, multiplier]
  );

  const result = isCreator ? creator : salary;

  // Fills the same example figures the placeholders show, in the current mode.
  const tryExample = () => {
    if (isCreator) {
      setGrossIncome('850,000');
      setBusinessExpenses('190,000');
    } else {
      setBasicSalary('450,000');
      setHousingAllowance('180,000');
      setTransportAllowance('90,000');
      setOtherAllowances('60,000');
    }
    setIncomeType('monthly');
  };
  const hasInput = result.grossIncome > 0;

  const per = incomeType === 'monthly' ? 'a month' : 'a year';
  const reliefSummary = isCreator
    ? annualRentPaid > 0
      ? `Rent ₦${formatNaira(annualRentPaid)} a year`
      : 'Rent relief'
    : [`Pension ${pensionRate}%`, nhfEnabled ? 'Housing Fund on' : null, annualRentPaid > 0 ? 'Rent added' : null]
        .filter(Boolean)
        .join(' · ');

  return (
    <section
      id='tax-estimator'
      className={`relative bg-[#f8fafc] ${standalone ? 'pt-28 pb-20 lg:pt-36 lg:pb-28' : 'border-t border-ink-200 py-20 lg:py-28'}`}>
      <div className='mx-auto max-w-6xl px-4 sm:px-6'>
        <div className='mb-10 max-w-2xl'>
          <p className='mb-4 inline-flex items-center gap-2 rounded-full bg-[#fbe429] px-3.5 py-1.5 text-xs font-bold text-ink-1000'>
            Nigeria Tax Act 2025 · in force 1 Jan {TAX_YEAR}
          </p>
          {standalone ? (
            <>
              <h1 className='text-3xl font-bold tracking-tight text-balance text-ink-1000 md:text-5xl md:leading-[1.08]'>
                Nigeria tax calculator {TAX_YEAR}
              </h1>
              <p className='mt-3 text-lg text-ink-700'>
                Work out your personal income tax under the new rules, for a salary (PAYE) or for
                freelance and business income. Free, no sign-up, and it updates as you type.
              </p>
            </>
          ) : (
            <>
              <h2 className='text-3xl font-bold tracking-tight text-balance text-ink-1000 md:text-[2.5rem] md:leading-[1.1]'>
                How much tax will you pay in {TAX_YEAR}?
              </h2>
              <p className='mt-3 text-lg text-ink-700'>
                Answer two questions. Your estimate updates as you type, under the new rules.{' '}
                <Link href='/tax-calculator' className='font-semibold text-ink-1000 underline decoration-[#fbe429] decoration-2 underline-offset-4'>
                  Open the full Nigeria tax calculator
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Phones: the answer stays in view at the top while the form scrolls. */}
        {hasInput ? (
          <div className='sticky top-16 z-20 -mx-4 mb-4 flex items-center justify-between gap-4 bg-[#0a2140] px-4 py-3 text-white shadow-[0_10px_30px_-15px_rgb(9_23_48/0.6)] sm:-mx-6 sm:px-6 lg:hidden'>
            <div>
              <p className='text-xs text-white/65'>Estimated tax</p>
              <Figure className='text-2xl font-bold'>
                ₦{formatNaira(result.monthlyTax)}
                <span className='text-xs font-normal text-white/60'>/mo</span>
              </Figure>
            </div>
            <a
              href='#waitlist'
              className='inline-flex min-h-11 items-center rounded-full bg-[#fbe429] px-4 text-sm font-bold text-ink-1000'>
              Join waitlist
            </a>
          </div>
        ) : null}

        <div className='grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-8'>
          <div className='space-y-7 rounded-3xl bg-white p-5 ring-1 ring-ink-1000/[0.06] shadow-[0_18px_50px_-30px_rgb(15_23_42/0.3)] sm:p-7'>
            <Step n={1} title='How do you earn?'>
              <ChoiceCards
                label='How do you earn?'
                value={userType}
                onChange={setUserType}
                options={[
                  {
                    value: 'salary',
                    label: 'Salary',
                    hint: 'Paid by an employer (PAYE)',
                    icon: (
                      <svg width='18' height='18' viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.7' strokeLinejoin='round'>
                        <rect x='3' y='6' width='14' height='11' rx='2' />
                        <path d='M7 6V4.5A1.5 1.5 0 0 1 8.5 3h3A1.5 1.5 0 0 1 13 4.5V6M3 11h14' />
                      </svg>
                    ),
                  },
                  {
                    value: 'creator',
                    label: 'Freelance or business',
                    hint: 'Freelancers, creators, sole traders',
                    icon: (
                      <svg width='18' height='18' viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.7' strokeLinejoin='round'>
                        <rect x='3' y='4' width='14' height='10' rx='1.5' />
                        <path d='M1.5 16.5h17' strokeLinecap='round' />
                      </svg>
                    ),
                  },
                ]}
              />
            </Step>

            <Step
              n={2}
              title='What do you earn?'
              action={
                <PillToggle
                  label='Figures are'
                  value={incomeType}
                  onChange={setIncomeType}
                  options={[
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'annual', label: 'Yearly' },
                  ]}
                />
              }>
              <div className='grid gap-4 sm:grid-cols-2'>
                {isCreator ? (
                  <>
                    <MoneyField
                      label={`Income ${per}`}
                      hint='Everything you were paid, before costs'
                      value={grossIncome}
                      onChange={(v) => setGrossIncome(money(v))}
                      placeholder='850,000'
                    />
                    <MoneyField
                      label={`Business costs ${per}`}
                      hint='Equipment, data, transport for work, etc.'
                      value={businessExpenses}
                      onChange={(v) => setBusinessExpenses(money(v))}
                      placeholder='190,000'
                    />
                  </>
                ) : (
                  <>
                    <MoneyField
                      label={`Basic salary ${per}`}
                      hint='On your payslip'
                      value={basicSalary}
                      onChange={(v) => setBasicSalary(money(v))}
                      placeholder='450,000'
                    />
                    <MoneyField
                      label='Housing allowance'
                      value={housingAllowance}
                      onChange={(v) => setHousingAllowance(money(v))}
                      placeholder='180,000'
                    />
                    <MoneyField
                      label='Transport allowance'
                      value={transportAllowance}
                      onChange={(v) => setTransportAllowance(money(v))}
                      placeholder='90,000'
                    />
                    <MoneyField
                      label='Other allowances'
                      hint='Medical, bonus and so on'
                      value={otherAllowances}
                      onChange={(v) => setOtherAllowances(money(v))}
                      placeholder='60,000'
                    />
                  </>
                )}
              </div>
              {hasInput ? null : (
                <button
                  type='button'
                  onClick={tryExample}
                  className='mt-3 min-h-11 text-sm font-semibold text-ink-1000 underline decoration-[#fbe429] decoration-2 underline-offset-4'>
                  Not sure? Try example figures
                </button>
              )}
            </Step>

            <Step
              n={3}
              title='Lower your tax'
              action={<span className='text-xs font-medium text-ink-600'>Optional</span>}>
              <button
                type='button'
                onClick={() => setReliefsOpen((o) => !o)}
                aria-expanded={reliefsOpen}
                aria-controls='calculator-reliefs'
                className='flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl bg-ink-50 px-4 py-3 text-left ring-1 ring-ink-200 transition-colors hover:bg-ink-100'>
                <span>
                  <span className='block text-sm font-semibold text-ink-1000'>
                    {isCreator ? 'Add rent you pay' : 'Pension, housing fund, health insurance and rent'}
                  </span>
                  <span className='block text-xs text-ink-600'>{reliefSummary}</span>
                </span>
                <svg
                  width='16'
                  height='16'
                  viewBox='0 0 16 16'
                  fill='none'
                  aria-hidden='true'
                  className={`shrink-0 text-ink-600 transition-transform duration-200 ${reliefsOpen ? 'rotate-180' : ''}`}>
                  <path d='M4 6l4 4 4-4' stroke='currentColor' strokeWidth='1.75' strokeLinecap='round' strokeLinejoin='round' />
                </svg>
              </button>

              {reliefsOpen ? (
                <div id='calculator-reliefs' className='mt-4 space-y-5'>
                  {!isCreator ? (
                    <>
                      <RateField
                        label='Pension'
                        hint='Usually 8% of basic, housing and transport'
                        value={pensionRate}
                        max={20}
                        onChange={setPensionRate}
                        valueText={`${pensionRate} percent, ₦${formatNaira(salary.reliefs.pension)} a year`}
                      />
                      <SwitchField
                        label='National Housing Fund (NHF)'
                        hint={`2.5% of basic · ₦${formatNaira(salary.reliefs.nhf)} a year`}
                        checked={nhfEnabled}
                        onChange={setNhfEnabled}
                      />
                      <MoneyField
                        label={`Health insurance (NHIS) ${per}`}
                        value={nhisAmount}
                        onChange={(v) => setNhisAmount(money(v))}
                        placeholder='0'
                      />
                    </>
                  ) : null}

                  <MoneyField
                    label='Rent you pay a year'
                    hint={`${Math.round(RELIEF_RULES.rentReliefRate * 100)}% comes off your taxable income, up to ₦${formatNaira(RELIEF_RULES.rentReliefCap)}`}
                    value={rentDeduction}
                    onChange={(v) => setRentDeduction(money(v))}
                    placeholder='0'>
                    {annualRentPaid > RELIEF_RULES.rentAtWhichCapBinds ? (
                      <p className='mt-2 rounded-lg bg-[#fffbe0] px-3 py-2 text-xs text-ink-900 ring-1 ring-[#fbe429]'>
                        Capped at ₦{formatNaira(RELIEF_RULES.rentReliefCap)}: rent above ₦
                        {formatNaira(RELIEF_RULES.rentAtWhichCapBinds)} won&apos;t lower it further.
                      </p>
                    ) : null}
                  </MoneyField>

                  <button
                    type='button'
                    onClick={() => setDrawerOpen(true)}
                    className='min-h-11 text-sm font-semibold text-ink-1000 underline decoration-[#fbe429] decoration-2 underline-offset-4'>
                    What else counts?
                  </button>
                </div>
              ) : null}
            </Step>
          </div>

          <ResultRail
            result={result}
            isCreator={isCreator}
            hasInput={hasInput}
            pensionRate={pensionRate}
            nhfEnabled={nhfEnabled}
            annualRentPaid={annualRentPaid}
            onTryExample={tryExample}
          />
        </div>
      </div>

      <DeductionsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} isCreator={isCreator} />
    </section>
  );
}
