'use client';

import { RELIEF_RULES, TAX_YEAR, formatNaira } from '@/lib/tax';
import { Drawer } from './Drawer';

const SALARY_RELIEFS = [
  {
    title: 'Pension contribution',
    desc: `Your ${Math.round(RELIEF_RULES.pensionMinimumRate * 100)}% contribution, calculated on basic salary plus housing and transport allowances — not on gross pay.`,
  },
  { title: 'National Housing Fund (NHF)', desc: '2.5% of basic salary.' },
  { title: 'NHIS', desc: 'Health insurance contributions you pay.' },
  {
    title: 'Rent relief',
    desc: `${Math.round(RELIEF_RULES.rentReliefRate * 100)}% of the annual rent you pay, capped at ₦${formatNaira(RELIEF_RULES.rentReliefCap)}. You have to declare the rent — it is not applied automatically.`,
  },
];

const CREATOR_DEDUCTIONS = [
  { title: 'Equipment & software', desc: 'Laptops, phones, software subscriptions.' },
  { title: 'Internet & phone', desc: 'The business portion of your bills.' },
  { title: 'Home office', desc: 'Costs of a dedicated workspace.' },
  { title: 'Training & education', desc: 'Courses, certifications, books.' },
  { title: 'Marketing', desc: 'Ads, website hosting, business cards.' },
  { title: 'Travel & transport', desc: 'Business-related travel costs.' },
  {
    title: 'Rent relief',
    desc: `${Math.round(RELIEF_RULES.rentReliefRate * 100)}% of annual rent paid, capped at ₦${formatNaira(RELIEF_RULES.rentReliefCap)}. This is not employment-specific — it applies to you too.`,
  },
];

export function DeductionsDrawer({
  open,
  onClose,
  isCreator,
}: {
  open: boolean;
  onClose: () => void;
  isCreator: boolean;
}) {
  const items = isCreator ? CREATOR_DEDUCTIONS : SALARY_RELIEFS;
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isCreator ? 'Deductions for creators and the self-employed' : 'Understanding your reliefs'}>
      <p className='mb-4 text-sm text-ink-300'>
        {isCreator
          ? 'You can deduct legitimate business expenses from your gross income before tax is worked out.'
          : `Under the Nigeria Tax Act 2025 these come off your income before tax is worked out. The old Consolidated Relief Allowance no longer applies from ${TAX_YEAR}.`}
      </p>
      <ul className='space-y-2'>
        {items.map((item) => (
          <li key={item.title} className='rounded-lg bg-white/[0.04] p-3.5'>
            <p className='text-sm font-semibold text-white'>{item.title}</p>
            <p className='mt-0.5 text-xs leading-relaxed text-ink-400'>{item.desc}</p>
          </li>
        ))}
      </ul>
      <div className='mt-5 rounded-xl border border-brand-500/25 bg-brand-500/[0.08] p-4'>
        <p className='text-sm font-bold text-white'>Keep your records</p>
        <p className='mt-1 text-sm text-ink-300'>
          Reliefs have to be claimed with documentation. Taash tracks your income and expenses
          through the year so the records are there when you need them.
        </p>
      </div>
    </Drawer>
  );
}
