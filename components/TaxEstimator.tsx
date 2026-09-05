'use client';

import {
  computeCreatorTax,
  computeSalaryTax,
  formatNaira,
  parseAmount,
  RELIEF_RULES,
  TAX_YEAR,
} from '@/lib/tax';
import { useMemo, useState } from 'react';
import { DeductionsDrawer } from './estimator/DeductionsDrawer';
import { Figure } from './estimator/Figure';
import { GroupLabel, MoneyField, RateField, SwitchField } from './estimator/Field';
import { ResultRail } from './estimator/ResultRail';

type UserType = 'salary' | 'creator';

/** Re-formats a currency string as the user types, keeping only digits. */
const money = (v: string) => {
  const digits = v.replace(/[^0-9]/g, '');
  return digits ? formatNaira(Number(digits)) : '';
};

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role='group' aria-label={label} className='mb-3 flex overflow-hidden rounded-lg border border-white/15'>
      {options.map((o) => (
        <button
          key={o.value}
          type='button'
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-11 flex-1 px-3 py-3 text-sm font-semibold transition-colors ${
            value === o.value ? 'bg-brand-600 text-white' : 'text-ink-400 hover:text-white'
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function TaxEstimator() {
  const [userType, setUserType] = useState<UserType>('salary');
  const [incomeType, setIncomeType] = useState<'annual' | 'monthly'>('monthly');
  const [drawerOpen, setDrawerOpen] = useState(false);

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
  const hasInput = result.grossIncome > 0;

  return (
    <section
      id='tax-estimator'
      className='relative isolate bg-ink-1000 py-20 text-ink-50 lg:py-28'>
      {/* Ambient depth. Purely decorative, and behind everything. */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0'
        style={{
          background:
            'radial-gradient(900px 420px at 78% 0%, rgb(59 130 246 / 0.16), transparent 62%), radial-gradient(700px 380px at 8% 100%, rgb(74 127 167 / 0.14), transparent 60%)',
        }}
      />
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 opacity-50'
        style={{
          backgroundImage:
            'linear-gradient(rgb(255 255 255 / 0.032) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.032) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(180deg, #000, transparent 55%)',
          WebkitMaskImage: 'linear-gradient(180deg, #000, transparent 55%)',
        }}
      />

      <div className='relative z-[1] mx-auto max-w-7xl px-6'>
        <div className='mb-10 max-w-2xl'>
          <p className='mb-4 inline-flex items-center gap-2 rounded-md border border-mark-400/30 bg-mark-600/15 px-3 py-1.5 text-xs font-bold tracking-[0.06em] text-mark-400 uppercase'>
            Nigeria Tax Act 2025 · in force 1 Jan {TAX_YEAR}
          </p>
          <h2 className='text-[clamp(1.75rem,3.2vw,2rem)] font-bold tracking-tight text-white'>
            PAYE Tax Calculator
          </h2>
          <p className='mt-3 text-lg text-ink-300'>
            Enter what you earn. We&apos;ll show what you owe under the {TAX_YEAR} rules as you
            type.
          </p>
        </div>

        {/* Mobile: the answer stays in view at the TOP. A bottom bar is unreliable under
            iOS Safari's collapsing toolbar. */}
        {hasInput ? (
          <div className='sticky top-16 z-20 -mx-6 mb-4 flex items-center justify-between gap-4 border-y border-white/10 bg-ink-1000/95 px-6 py-3 backdrop-blur lg:hidden'>
            <div>
              <p className='text-[0.6875rem] font-bold tracking-[0.12em] text-ink-400 uppercase'>
                You owe
              </p>
              <Figure className='text-2xl font-bold text-white'>
                ₦{formatNaira(result.monthlyTax)}
                <span className='text-xs font-normal text-ink-400'>/mo</span>
              </Figure>
            </div>
            <a
              href='#waitlist'
              className='min-h-11 rounded-lg bg-brand-600 px-4 py-2.5 text-sm leading-6 font-semibold text-white'>
              Join waitlist
            </a>
          </div>
        ) : null}

        <div className='grid gap-6 lg:grid-cols-[58fr_42fr] lg:items-start lg:gap-7'>
          <div className='rounded-2xl border border-white/[0.09] bg-white/[0.035] p-6'>
            <Segmented
              label='I am a'
              value={userType}
              onChange={setUserType}
              options={[
                { value: 'salary', label: 'Salary earner' },
                { value: 'creator', label: 'Creator / Self-employed' },
              ]}
            />
            <Segmented
              label='Figures are'
              value={incomeType}
              onChange={setIncomeType}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'annual', label: 'Annual' },
              ]}
            />

            <GroupLabel>Income</GroupLabel>
            {isCreator ? (
              <>
                <MoneyField
                  label={`Gross income (${incomeType === 'monthly' ? 'monthly' : 'annual'})`}
                  value={grossIncome}
                  onChange={(v) => setGrossIncome(money(v))}
                  placeholder='850,000'
                />
                <MoneyField
                  label={`Business expenses (${incomeType === 'monthly' ? 'monthly' : 'annual'})`}
                  hint='Equipment, internet, marketing, etc.'
                  value={businessExpenses}
                  onChange={(v) => setBusinessExpenses(money(v))}
                  placeholder='190,000'
                />
              </>
            ) : (
              <>
                <MoneyField
                  label={`Basic salary (${incomeType === 'monthly' ? 'monthly' : 'annual'})`}
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
                  hint='Medical, bonus, etc. Not part of the pensionable base.'
                  value={otherAllowances}
                  onChange={(v) => setOtherAllowances(money(v))}
                  placeholder='60,000'
                />
              </>
            )}

            <GroupLabel
              action={
                <button
                  type='button'
                  onClick={() => setDrawerOpen(true)}
                  className='-my-2 min-h-11 px-2 text-xs font-semibold tracking-normal text-brand-400 normal-case hover:text-brand-300'>
                  What counts?
                </button>
              }>
              {isCreator ? 'Deductions' : 'Reliefs'}
            </GroupLabel>

            {!isCreator ? (
              <>
                <RateField
                  label='Pension'
                  hint='8% of basic + housing + transport'
                  value={pensionRate}
                  max={20}
                  onChange={setPensionRate}
                  valueText={`${pensionRate} percent, ₦${formatNaira(salary.reliefs.pension)} a year`}
                />
                <SwitchField
                  label='National Housing Fund'
                  hint={`2.5% of basic · ₦${formatNaira(salary.reliefs.nhf)}/yr`}
                  checked={nhfEnabled}
                  onChange={setNhfEnabled}
                />
                <MoneyField
                  label={`NHIS (${incomeType === 'monthly' ? 'monthly' : 'annual'})`}
                  value={nhisAmount}
                  onChange={(v) => setNhisAmount(money(v))}
                  placeholder='0'
                />
              </>
            ) : null}

            <MoneyField
              label='Annual rent paid'
              hint={`Relief = ${Math.round(RELIEF_RULES.rentReliefRate * 100)}% of rent, max ₦${formatNaira(RELIEF_RULES.rentReliefCap)}`}
              value={rentDeduction}
              onChange={(v) => setRentDeduction(money(v))}
              placeholder='0'>
              {annualRentPaid > RELIEF_RULES.rentAtWhichCapBinds ? (
                <p className='mt-2 rounded-md border border-signal-500/25 bg-signal-500/10 px-2.5 py-1.5 text-xs text-signal-100'>
                  Capped at ₦{formatNaira(RELIEF_RULES.rentReliefCap)} — rent above ₦
                  {formatNaira(RELIEF_RULES.rentAtWhichCapBinds)} won&apos;t increase it.
                </p>
              ) : null}
            </MoneyField>
          </div>

          <ResultRail
            result={result}
            isCreator={isCreator}
            hasInput={hasInput}
            pensionRate={pensionRate}
            nhfEnabled={nhfEnabled}
            annualRentPaid={annualRentPaid}
          />
        </div>
      </div>

      <DeductionsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} isCreator={isCreator} />
    </section>
  );
}
