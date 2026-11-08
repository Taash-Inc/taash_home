import {
  describeBrackets,
  formatNaira,
  NATIONAL_MINIMUM_WAGE_MONTHLY,
  NTA_2026_BRACKETS,
  RELIEF_RULES,
  TAX_YEAR,
} from '@/lib/tax';

/**
 * The homepage FAQ. One source for both the visible section and the FAQPage structured data:
 * Google requires FAQ markup to match what is on the page, and the old markup did not (it also
 * claimed support for Ghana, Kenya and South Africa, which Taash does not have yet).
 *
 * Tax answers are generated from lib/tax, so they change when the bands do.
 */
const bands = describeBrackets(NTA_2026_BRACKETS)
  .map((b) => `${b.amount.charAt(0).toLowerCase()}${b.amount.slice(1)} at ${b.rate}`)
  .join(', ');

export const FAQ = [
  {
    q: 'What is Taash?',
    a: 'Taash is a tax and finance app for Nigeria. It turns your income and spending into tax-ready records, shows what you owe under the Nigeria Tax Act 2025 as you go, and tells you how much to set aside. It is launching soon on iOS and Android; join the waitlist for early access.',
  },
  {
    q: 'Who is Taash for?',
    a: 'Freelancers, content creators, salary earners and small business owners in Nigeria who want to stay tax-ready without spreadsheets or an accountant for every question.',
  },
  {
    q: `How much tax will I pay in Nigeria in ${TAX_YEAR}?`,
    a: `Under the Nigeria Tax Act 2025, in force from 1 January ${TAX_YEAR}, personal income is taxed in bands: ${bands}. Use the free calculator on this page to see your own figure.`,
  },
  {
    q: 'Do freelancers and creators pay tax in Nigeria?',
    a: 'Yes. Self-employed income is taxed in the same bands as salaries. The costs of earning it, such as equipment, data and transport for work, are deducted first, so keeping records of them lowers your tax.',
  },
  {
    q: 'What is rent relief?',
    a: `If you pay rent, ${Math.round(RELIEF_RULES.rentReliefRate * 100)}% of the rent you pay in a year comes off your taxable income, up to ₦${formatNaira(RELIEF_RULES.rentReliefCap)}.`,
  },
  {
    q: 'Is Taash available outside Nigeria?',
    a: 'Not yet. Taash is launching in Nigeria first, with more African countries to follow. Join the waitlist and we will let you know when it reaches yours.',
  },
  {
    q: 'Is my money safe with Taash?',
    a: 'Taash can never move your money. Bank access through Mono is read-only and is used only to keep your records and tax estimate up to date, and you can unlink your bank at any time.',
  },
  {
    q: 'How much does Taash cost?',
    a: 'Joining the waitlist is free. Early members get a lifetime discount and priority support when Taash launches.',
  },
] as const;

/** The /tax-calculator page's questions, shown on the page and in its FAQPage markup. */
export const CALCULATOR_FAQ = [
  {
    q: 'Is this tax calculator free?',
    a: `Yes. It is free with no sign-up, and it works out personal income tax under the Nigeria Tax Act 2025, which applies from 1 January ${TAX_YEAR}.`,
  },
  {
    q: 'Does it work for freelancers and creators?',
    a: 'Yes. Choose "Freelance or business", then enter what you earn and what it costs you to earn it. Business costs come off before the tax bands are applied.',
  },
  {
    q: 'Is the first ₦800,000 tax-free?',
    a: 'Yes. The first ₦800,000 of taxable income, which is your income after reliefs and deductions, is taxed at 0%. Tax starts at 15% on the next ₦2,200,000.',
  },
  {
    q: 'Which reliefs does the calculator include?',
    a: 'Pension contributions (at least 8% of basic, housing and transport), the National Housing Fund (2.5% of basic), National Health Insurance contributions, and rent relief. For freelance and business income it also deducts your business costs.',
  },
  {
    q: 'How is rent relief worked out?',
    a: `${Math.round(RELIEF_RULES.rentReliefRate * 100)}% of the rent you pay in a year comes off your taxable income, up to ₦${formatNaira(RELIEF_RULES.rentReliefCap)}. Rent above ₦${formatNaira(RELIEF_RULES.rentAtWhichCapBinds)} a year doesn't increase it further.`,
  },
  {
    q: 'Do I pay tax on the minimum wage?',
    a: `No. If your salary is at or below the national minimum wage of ₦${formatNaira(NATIONAL_MINIMUM_WAGE_MONTHLY)} a month, no PAYE is due.`,
  },
  {
    q: 'Is this tax advice?',
    a: 'No. It is an estimate for employment and self-employment income only. For your own situation, check with a tax professional or the Nigeria Revenue Service.',
  },
] as const;

export type FaqItem = { q: string; a: string };
