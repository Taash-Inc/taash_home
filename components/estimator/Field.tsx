'use client';

import { useId } from 'react';

/** Currency input. `inputMode="numeric"` so phones open the number pad — the previous
 *  implementation had none anywhere, so every money field opened an alphabetic keyboard. */
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
    <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-white/[0.07] py-3 last:border-b-0'>
      <label htmlFor={id} className='text-[0.9375rem] text-ink-300'>
        {label}
        {hint ? <span className='mt-0.5 block text-xs text-ink-500'>{hint}</span> : null}
      </label>
      <div className='ml-auto'>
        <div className='flex min-w-[9.5rem] items-center gap-1.5 rounded-lg border border-white/[0.18] bg-black/25 px-3 transition focus-within:border-brand-500 focus-within:ring-[3px] focus-within:ring-brand-500/25'>
          <span aria-hidden='true' className='text-ink-500'>
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
            className='min-h-11 w-full min-w-0 bg-transparent py-2.5 text-right font-mono text-[0.9375rem] font-medium tabular-nums text-white placeholder:text-ink-600 focus:outline-none'
          />
        </div>
        {children}
      </div>
    </div>
  );
}

/** A real switch. The previous NHF control was a nameless, stateless <button> — screen
 *  readers announced only "button" (00-audit.md §4.2). */
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
    <div className='flex items-center justify-between gap-4 border-b border-white/[0.07] py-3 last:border-b-0'>
      <span id={id} className='text-[0.9375rem] text-ink-300'>
        {label}
        {hint ? <span className='mt-0.5 block text-xs text-ink-500'>{hint}</span> : null}
      </span>
      <button
        type='button'
        role='switch'
        aria-checked={checked}
        aria-labelledby={id}
        onClick={() => onChange(!checked)}
        className={`relative h-11 w-16 shrink-0 rounded-full p-[0.3125rem] transition-colors ${
          checked ? 'bg-brand-600' : 'bg-white/15'
        }`}>
        <span
          className={`block h-[1.375rem] w-[1.375rem] rounded-full bg-white transition-transform ${
            checked ? 'translate-x-[1.25rem]' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

/** Percentage slider with a real label and a spoken value. The pension slider previously
 *  had no id, no `for`, and no aria-valuetext — announced as "slider, 8" with no context. */
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
    <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-white/[0.07] py-3 last:border-b-0'>
      <label htmlFor={id} className='text-[0.9375rem] text-ink-300'>
        {label}
        {hint ? <span className='mt-0.5 block text-xs text-ink-500'>{hint}</span> : null}
      </label>
      <div className='ml-auto flex min-w-[9.5rem] items-center gap-3'>
        <input
          id={id}
          type='range'
          min={0}
          max={max}
          step={1}
          value={value}
          aria-valuetext={valueText}
          onChange={(e) => onChange(Number(e.target.value))}
          className='h-11 flex-1 accent-brand-500'
        />
        <span className='w-10 text-right font-mono text-sm font-semibold tabular-nums text-white'>
          {value}%
        </span>
      </div>
    </div>
  );
}

export function GroupLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className='mt-7 mb-1 flex items-center justify-between text-[0.6875rem] font-bold tracking-[0.12em] text-ink-500 uppercase'>
      <span>{children}</span>
      {action}
    </div>
  );
}
