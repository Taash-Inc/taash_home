'use client';

import { useId } from 'react';

/*
 * Calculator controls, on a light card. Navy (#0b1830) and the app's yellow (#fbe429) are the
 * only accents, as in the Taash app; the electric blue they used before appeared nowhere else.
 */

/** Currency input. `inputMode="numeric"` so phones open the number pad. Label above the field,
 *  full width: side-by-side labels squeezed both on phones. */
export function MoneyField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  children,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className='block text-sm font-semibold text-ink-1000'>
        {label}
        {hint ? <span className='mt-0.5 block text-xs font-normal text-ink-600'>{hint}</span> : null}
      </label>
      <div className='mt-1.5 flex items-center gap-2 rounded-xl border border-ink-300 bg-white px-3.5 transition focus-within:border-ink-1000 focus-within:ring-[3px] focus-within:ring-[#fbe429]/70'>
        <span aria-hidden='true' className='font-semibold text-ink-500'>
          ₦
        </span>
        <input
          id={id}
          type='text'
          inputMode='numeric'
          autoComplete='off'
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className='min-h-12 w-full min-w-0 bg-transparent py-2.5 text-base font-semibold text-ink-1000 tabular-nums placeholder:font-normal placeholder:text-ink-500 focus:outline-none'
        />
      </div>
      {children}
    </div>
  );
}

/** A real switch, with its label and state exposed to screen readers. */
export function SwitchField({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className='flex items-center justify-between gap-4'>
      <span id={id} className='text-sm font-semibold text-ink-1000'>
        {label}
        {hint ? <span className='mt-0.5 block text-xs font-normal text-ink-600'>{hint}</span> : null}
      </span>
      <button
        type='button'
        role='switch'
        aria-checked={checked}
        aria-labelledby={id}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-[3.25rem] shrink-0 rounded-full p-1 transition-colors before:absolute before:-inset-y-1.5 before:inset-x-0 ${
          checked ? 'bg-ink-1000' : 'bg-ink-300'
        }`}>
        <span
          className={`block size-6 rounded-full transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            checked ? 'translate-x-5 bg-[#fbe429]' : 'translate-x-0 bg-white'
          }`}
        />
      </button>
    </div>
  );
}

/** Percentage slider with a real label and a spoken value. */
export function RateField({
  label,
  hint,
  value,
  max,
  onChange,
  valueText,
}: {
  label: string;
  hint?: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
  valueText: string;
}) {
  const id = useId();
  return (
    <div>
      <div className='flex items-baseline justify-between gap-4'>
        <label htmlFor={id} className='text-sm font-semibold text-ink-1000'>
          {label}
          {hint ? <span className='mt-0.5 block text-xs font-normal text-ink-600'>{hint}</span> : null}
        </label>
        <span className='text-sm font-bold text-ink-1000 tabular-nums'>{value}%</span>
      </div>
      <input
        id={id}
        type='range'
        min={0}
        max={max}
        step={1}
        value={value}
        aria-valuetext={valueText}
        onChange={(e) => onChange(Number(e.target.value))}
        className='mt-1 h-11 w-full accent-[#0b1830]'
      />
    </div>
  );
}

/** A numbered step: the calculator reads as three questions, in order. */
export function Step({
  n,
  title,
  action,
  children,
}: {
  n: number;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div role='group' aria-labelledby={id} className='border-t border-ink-200 pt-6 first:border-t-0 first:pt-0'>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <h3 id={id} className='flex items-center gap-2.5 text-base font-bold text-ink-1000'>
          <span aria-hidden='true' className='grid size-7 place-items-center rounded-full bg-ink-1000 text-xs font-bold text-[#fbe429]'>
            {n}
          </span>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

/** Two-way choice as a pill toggle, e.g. Monthly / Annual. */
export function PillToggle<T extends string>({
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
    <div role='group' aria-label={label} className='flex rounded-full bg-ink-100 p-1'>
      {options.map((o) => (
        <button
          key={o.value}
          type='button'
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-9 rounded-full px-3.5 text-xs font-semibold transition-colors ${
            value === o.value ? 'bg-ink-1000 text-white' : 'text-ink-700 hover:text-ink-1000'
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Large choice cards for the first question. */
export function ChoiceCards<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; hint: string; icon: React.ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role='group' aria-label={label} className='grid gap-2.5 sm:grid-cols-2'>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type='button'
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`flex items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition-[border-color,background-color,transform] duration-200 active:scale-[0.99] ${
              on ? 'border-ink-1000 bg-[#fffbe0]' : 'border-ink-200 bg-white hover:border-ink-400'
            }`}>
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-xl ${on ? 'bg-ink-1000 text-[#fbe429]' : 'bg-ink-100 text-ink-700'}`}>
              {o.icon}
            </span>
            <span className='min-w-0 flex-1'>
              <span className='block font-semibold text-ink-1000'>{o.label}</span>
              <span className='mt-0.5 block text-xs text-ink-600'>{o.hint}</span>
            </span>
            <span
              aria-hidden='true'
              className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-ink-1000 bg-ink-1000 text-[#fbe429]' : 'border-ink-300'}`}>
              {on ? (
                <svg width='10' height='10' viewBox='0 0 16 16' fill='none'>
                  <path d='M3.5 8.5l3 3 6-7' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' />
                </svg>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
