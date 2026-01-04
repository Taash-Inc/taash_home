'use client';

import { useMemo, useState } from 'react';

// OLD PITA Tax Brackets (before NTA 2025)
const PITA_OLD_BRACKETS = [
  { min: 0, max: 300000, rate: 0.07 }, // First ₦300,000 at 7%
  { min: 300000, max: 600000, rate: 0.11 }, // Next ₦300,000 at 11%
  { min: 600000, max: 1100000, rate: 0.15 }, // Next ₦500,000 at 15%
  { min: 1100000, max: 1600000, rate: 0.19 }, // Next ₦500,000 at 19%
  { min: 1600000, max: 3200000, rate: 0.21 }, // Next ₦1,600,000 at 21%
  { min: 3200000, max: Infinity, rate: 0.24 }, // Above ₦3,200,000 at 24%
];

// NEW NTA 2025 PAYE Tax Brackets
const NTA_2025_BRACKETS = [
  { min: 0, max: 800000, rate: 0 }, // First ₦800,000 at 0% (TAX FREE)
  { min: 800000, max: 3000000, rate: 0.15 }, // Next ₦2,200,000 at 15%
  { min: 3000000, max: 12000000, rate: 0.18 }, // Next ₦9,000,000 at 18%
  { min: 12000000, max: 25000000, rate: 0.21 }, // Next ₦13,000,000 at 21%
  { min: 25000000, max: 50000000, rate: 0.23 }, // Next ₦25,000,000 at 23%
  { min: 50000000, max: Infinity, rate: 0.25 }, // Above ₦50,000,000 at 25%
];

type TaxBracket = { min: number; max: number; rate: number };

function calculateTaxWithBrackets(income: number, brackets: TaxBracket[]): number {
  let tax = 0;
  let remainingIncome = income;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;

    const bracketSize = bracket.max - bracket.min;
    const taxableInBracket = Math.min(remainingIncome, bracketSize);
    tax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
  }

  return tax;
}

// Calculate tax using NEW NTA 2025 rates
function calculateTax(income: number): number {
  return calculateTaxWithBrackets(income, NTA_2025_BRACKETS);
}

// Calculate tax using OLD PITA rates (for comparison)
function calculateOldTax(income: number): number {
  return calculateTaxWithBrackets(income, PITA_OLD_BRACKETS);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type UserType = 'salary' | 'creator';

export default function TaxEstimator() {
  // User type toggle
  const [userType, setUserType] = useState<UserType>('salary');
  const [incomeType, setIncomeType] = useState<'annual' | 'monthly'>('monthly');
  const [showDeductionsModal, setShowDeductionsModal] = useState(false);
  const [showReliefsBreakdown, setShowReliefsBreakdown] = useState(false);

  // Salary Earner inputs
  const [basicSalary, setBasicSalary] = useState<string>('');
  const [housingAllowance, setHousingAllowance] = useState<string>('');
  const [transportAllowance, setTransportAllowance] = useState<string>('');
  const [otherAllowances, setOtherAllowances] = useState<string>('');

  // Deductions (salary earners)
  const [pensionRate, setPensionRate] = useState<number>(8); // Default 8%
  const [nhfEnabled, setNhfEnabled] = useState<boolean>(true);
  const [nhisAmount, setNhisAmount] = useState<string>('');
  const [rentDeduction, setRentDeduction] = useState<string>('');

  // Creator/Self-employed inputs
  const [grossIncome, setGrossIncome] = useState<string>('');
  const [businessExpenses, setBusinessExpenses] = useState<string>('');

  // Helper to parse currency input
  const parseAmount = (value: string): number => {
    return parseFloat(value.replace(/,/g, '')) || 0;
  };

  // Calculate annual values based on income type
  const multiplier = incomeType === 'monthly' ? 12 : 1;

  // SALARY EARNER CALCULATIONS
  const salaryCalculations = useMemo(() => {
    const basic = parseAmount(basicSalary) * multiplier;
    const housing = parseAmount(housingAllowance) * multiplier;
    const transport = parseAmount(transportAllowance) * multiplier;
    const other = parseAmount(otherAllowances) * multiplier;

    // Step 1: Gross Annual Income
    const grossIncome = basic + housing + transport + other;

    // ===== NTA 2025 (NEW) CALCULATION =====
    // Pension (max 8% of gross) - unchanged
    const pension = Math.min(grossIncome * (pensionRate / 100), grossIncome * 0.08);

    // NHF (2.5% of basic salary) - unchanged
    const nhf = nhfEnabled ? basic * 0.025 : 0;

    // NHIS - unchanged
    const nhis = parseAmount(nhisAmount) * multiplier;

    // Rent Relief - NTA 2025: 20% of annual rent paid, capped at ₦500,000
    const annualRentPaid = parseAmount(rentDeduction);
    const rentRelief = Math.min(annualRentPaid * 0.2, 500000);

    // Total Reliefs (NTA 2025 - No Basic Relief, No Consolidated Relief)
    const totalReliefs = pension + nhf + nhis + rentRelief;

    // Taxable Income (NTA 2025)
    const taxableIncome = Math.max(0, grossIncome - totalReliefs);

    // Calculate Tax using NEW NTA 2025 rates
    const annualTax = calculateTax(taxableIncome);
    const monthlyTax = annualTax / 12;

    // ===== OLD PITA CALCULATION (for comparison) =====
    // Old Basic Relief: MAX(1% of gross, ₦200,000) + 20% of gross
    const oldBasicRelief = Math.max(grossIncome * 0.01, 200000);
    const oldConsolidatedRelief = grossIncome * 0.2;
    const oldTotalReliefs = oldBasicRelief + oldConsolidatedRelief + pension + nhf + nhis;
    const oldTaxableIncome = Math.max(0, grossIncome - oldTotalReliefs);
    const oldAnnualTax = calculateOldTax(oldTaxableIncome);
    const oldMonthlyTax = oldAnnualTax / 12;

    // Calculate savings
    const taxSavings = oldAnnualTax - annualTax;
    const taxSavingsPercent = oldAnnualTax > 0 ? (taxSavings / oldAnnualTax) * 100 : 0;

    // Other outputs
    const effectiveRate = grossIncome > 0 ? (annualTax / grossIncome) * 100 : 0;
    const oldEffectiveRate = grossIncome > 0 ? (oldAnnualTax / grossIncome) * 100 : 0;
    const takeHome = grossIncome - annualTax;

    return {
      grossIncome,
      pension,
      nhf,
      nhis,
      rentRelief,
      annualRentPaid,
      totalReliefs,
      taxableIncome,
      annualTax,
      monthlyTax,
      effectiveRate,
      takeHome,
      basic,
      // Old PITA comparison
      oldTotalReliefs,
      oldTaxableIncome,
      oldAnnualTax,
      oldMonthlyTax,
      oldEffectiveRate,
      taxSavings,
      taxSavingsPercent,
    };
  }, [
    basicSalary,
    housingAllowance,
    transportAllowance,
    otherAllowances,
    pensionRate,
    nhfEnabled,
    nhisAmount,
    rentDeduction,
    multiplier,
  ]);

  // CREATOR/SELF-EMPLOYED CALCULATIONS
  const creatorCalculations = useMemo(() => {
    const gross = parseAmount(grossIncome) * multiplier;
    const expenses = parseAmount(businessExpenses) * multiplier;

    // ===== NTA 2025 (NEW) CALCULATION =====
    // For creators: Simple calculation - gross minus business expenses
    // NTA 2025: No Basic Relief or Consolidated Relief for self-employed
    const totalDeductions = expenses;

    // Taxable Income (NTA 2025)
    const taxableIncome = Math.max(0, gross - totalDeductions);

    // Calculate Tax using NEW NTA 2025 rates
    const annualTax = calculateTax(taxableIncome);
    const monthlyTax = annualTax / 12;

    // ===== OLD PITA CALCULATION (for comparison) =====
    // Old: Basic Relief + 20% Consolidated Relief applied
    const oldBasicRelief = Math.max(gross * 0.01, 200000);
    const oldConsolidatedRelief = gross * 0.2;
    const oldTotalDeductions = expenses + oldBasicRelief + oldConsolidatedRelief;
    const oldTaxableIncome = Math.max(0, gross - oldTotalDeductions);
    const oldAnnualTax = calculateOldTax(oldTaxableIncome);
    const oldMonthlyTax = oldAnnualTax / 12;

    // Calculate savings
    const taxSavings = oldAnnualTax - annualTax;
    const taxSavingsPercent = oldAnnualTax > 0 ? (taxSavings / oldAnnualTax) * 100 : 0;

    // Other outputs
    const effectiveRate = gross > 0 ? (annualTax / gross) * 100 : 0;
    const oldEffectiveRate = gross > 0 ? (oldAnnualTax / gross) * 100 : 0;
    const takeHome = gross - expenses - annualTax;

    return {
      grossIncome: gross,
      businessExpenses: expenses,
      totalDeductions,
      taxableIncome,
      annualTax,
      monthlyTax,
      effectiveRate,
      takeHome,
      // Old PITA comparison
      oldTotalDeductions,
      oldTaxableIncome,
      oldAnnualTax,
      oldMonthlyTax,
      oldEffectiveRate,
      taxSavings,
      taxSavingsPercent,
    };
  }, [grossIncome, businessExpenses, multiplier]);

  // Get current calculations based on user type
  const calc = userType === 'salary' ? salaryCalculations : creatorCalculations;

  // Input handlers
  const handleCurrencyInput =
    (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[^0-9]/g, '');
      if (value) {
        setter(formatCurrency(parseInt(value)));
      } else {
        setter('');
      }
    };

  return (
    <section id='tax-estimator' className='py-20 bg-gradient-to-b from-white to-[#f8fafc]'>
      <div className='max-w-7xl mx-auto px-6'>
        {/* Header */}
        <div className='text-center mb-12'>
          <div className='inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4'>
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            NTA 2025 vs PITA Comparison
          </div>
          <h2 className='text-3xl md:text-4xl font-bold text-primary-dark mb-4'>
            PAYE Tax Calculator
          </h2>
          <p className='text-lg text-text-gray max-w-2xl mx-auto'>
            Compare your tax under the new Nigeria Tax Act 2025 with the old PITA rates. See how
            much you save with the new ₦800,000 tax-free threshold.
          </p>
        </div>

        {/* Calculator Card */}
        <div className='max-w-4xl mx-auto'>
          <div className='bg-white rounded-3xl shadow-xl overflow-hidden relative'>
            {/* Info Button */}
            <button
              onClick={() => setShowDeductionsModal(true)}
              className='absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-primary-blue/10 hover:bg-primary-blue/20 flex items-center justify-center transition-colors group'
              aria-label='Learn about deductions'>
              <svg
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                className='text-primary-blue'>
                <path
                  d='M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </button>

            {/* User Type Toggle */}
            <div className='p-6 md:p-8 border-b border-gray-100'>
              <div className='flex flex-col items-center gap-4'>
                <label className='text-sm font-medium text-text-gray'>I am a...</label>
                <div className='flex bg-gray-100 rounded-xl p-1 w-full max-w-md'>
                  <button
                    onClick={() => setUserType('salary')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      userType === 'salary'
                        ? 'bg-white text-primary-dark shadow-sm'
                        : 'text-text-gray hover:text-primary-dark'
                    }`}>
                    <svg
                      width='18'
                      height='18'
                      viewBox='0 0 24 24'
                      fill='none'
                      className={userType === 'salary' ? 'text-primary-blue' : ''}>
                      <path
                        d='M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                      <path
                        d='M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                    Salary Earner
                  </button>
                  <button
                    onClick={() => setUserType('creator')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      userType === 'creator'
                        ? 'bg-white text-primary-dark shadow-sm'
                        : 'text-text-gray hover:text-primary-dark'
                    }`}>
                    <svg
                      width='18'
                      height='18'
                      viewBox='0 0 24 24'
                      fill='none'
                      className={userType === 'creator' ? 'text-primary-blue' : ''}>
                      <path
                        d='M12 2L2 7L12 12L22 7L12 2Z'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                      <path
                        d='M2 17L12 22L22 17'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                      <path
                        d='M2 12L12 17L22 12'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                    Creator / Self-Employed
                  </button>
                </div>

                {/* Monthly/Annual Toggle */}
                <div className='flex bg-gray-100 rounded-xl p-1'>
                  <button
                    onClick={() => setIncomeType('monthly')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      incomeType === 'monthly'
                        ? 'bg-white text-primary-dark shadow-sm'
                        : 'text-text-gray hover:text-primary-dark'
                    }`}>
                    Monthly
                  </button>
                  <button
                    onClick={() => setIncomeType('annual')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      incomeType === 'annual'
                        ? 'bg-white text-primary-dark shadow-sm'
                        : 'text-text-gray hover:text-primary-dark'
                    }`}>
                    Annual
                  </button>
                </div>
              </div>
            </div>

            {/* Input Section - Salary Earner */}
            {userType === 'salary' && (
              <div className='p-6 md:p-8 border-b border-gray-100'>
                {/* Income Inputs */}
                <div className='mb-6'>
                  <h3 className='text-lg font-bold text-primary-dark mb-4'>Income</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {/* Basic Salary */}
                    <div>
                      <label
                        htmlFor='basicSalary'
                        className='block text-sm font-medium text-text-gray mb-2'>
                        Basic Salary ({incomeType === 'monthly' ? 'Monthly' : 'Annual'})
                      </label>
                      <div className='relative'>
                        <span className='absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-primary-dark'>
                          ₦
                        </span>
                        <input
                          type='text'
                          id='basicSalary'
                          value={basicSalary}
                          onChange={handleCurrencyInput(setBasicSalary)}
                          placeholder='200,000'
                          className='w-full pl-10 pr-4 py-3 text-lg font-bold text-primary-dark border-2 border-gray-200 rounded-xl focus:border-primary-blue focus:ring-0 focus:outline-none transition-colors'
                        />
                      </div>
                    </div>

                    {/* Housing Allowance */}
                    <div>
                      <label
                        htmlFor='housingAllowance'
                        className='block text-sm font-medium text-text-gray mb-2'>
                        Housing Allowance
                      </label>
                      <div className='relative'>
                        <span className='absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-text-gray'>
                          ₦
                        </span>
                        <input
                          type='text'
                          id='housingAllowance'
                          value={housingAllowance}
                          onChange={handleCurrencyInput(setHousingAllowance)}
                          placeholder='100,000'
                          className='w-full pl-10 pr-4 py-3 text-lg font-bold text-primary-dark border-2 border-gray-200 rounded-xl focus:border-primary-blue focus:ring-0 focus:outline-none transition-colors'
                        />
                      </div>
                    </div>

                    {/* Transport Allowance */}
                    <div>
                      <label
                        htmlFor='transportAllowance'
                        className='block text-sm font-medium text-text-gray mb-2'>
                        Transport Allowance
                      </label>
                      <div className='relative'>
                        <span className='absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-text-gray'>
                          ₦
                        </span>
                        <input
                          type='text'
                          id='transportAllowance'
                          value={transportAllowance}
                          onChange={handleCurrencyInput(setTransportAllowance)}
                          placeholder='50,000'
                          className='w-full pl-10 pr-4 py-3 text-lg font-bold text-primary-dark border-2 border-gray-200 rounded-xl focus:border-primary-blue focus:ring-0 focus:outline-none transition-colors'
                        />
                      </div>
                    </div>

                    {/* Other Allowances */}
                    <div>
                      <label
                        htmlFor='otherAllowances'
                        className='block text-sm font-medium text-text-gray mb-2'>
                        Other Allowances (Medical, Bonus, etc.)
                      </label>
                      <div className='relative'>
                        <span className='absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-text-gray'>
                          ₦
                        </span>
                        <input
                          type='text'
                          id='otherAllowances'
                          value={otherAllowances}
                          onChange={handleCurrencyInput(setOtherAllowances)}
                          placeholder='50,000'
                          className='w-full pl-10 pr-4 py-3 text-lg font-bold text-primary-dark border-2 border-gray-200 rounded-xl focus:border-primary-blue focus:ring-0 focus:outline-none transition-colors'
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className='pt-6 border-t border-gray-100'>
                  <h3 className='text-lg font-bold text-primary-dark mb-4'>Deductions</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {/* Pension */}
                    <div>
                      <label className='block text-sm font-medium text-text-gray mb-2'>
                        Pension Contribution (% of Gross)
                      </label>
                      <div className='flex items-center gap-2'>
                        <input
                          type='range'
                          min='0'
                          max='8'
                          step='1'
                          value={pensionRate}
                          onChange={(e) => setPensionRate(parseInt(e.target.value))}
                          className='flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-blue'
                        />
                        <span className='w-12 text-center font-bold text-primary-dark'>
                          {pensionRate}%
                        </span>
                      </div>
                      <p className='text-xs text-text-gray mt-1'>Max 8% of gross income</p>
                    </div>

                    {/* NHF */}
                    <div>
                      <label className='block text-sm font-medium text-text-gray mb-2'>
                        National Housing Fund (NHF)
                      </label>
                      <div className='flex items-center gap-3'>
                        <button
                          onClick={() => setNhfEnabled(!nhfEnabled)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            nhfEnabled ? 'bg-primary-blue' : 'bg-gray-300'
                          }`}>
                          <span
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                              nhfEnabled ? 'left-7' : 'left-1'
                            }`}
                          />
                        </button>
                        <span className='text-sm text-text-gray'>
                          {nhfEnabled
                            ? `2.5% of Basic (₦${formatCurrency(salaryCalculations.nhf)}/yr)`
                            : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    {/* NHIS */}
                    <div>
                      <label
                        htmlFor='nhis'
                        className='block text-sm font-medium text-text-gray mb-2'>
                        NHIS ({incomeType === 'monthly' ? 'Monthly' : 'Annual'})
                      </label>
                      <div className='relative'>
                        <span className='absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-text-gray'>
                          ₦
                        </span>
                        <input
                          type='text'
                          id='nhis'
                          value={nhisAmount}
                          onChange={handleCurrencyInput(setNhisAmount)}
                          placeholder='0'
                          className='w-full pl-10 pr-4 py-3 text-lg font-bold text-primary-dark border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 focus:outline-none transition-colors bg-green-50/30'
                        />
                      </div>
                    </div>

                    {/* Rent Deduction */}
                    <div>
                      <label
                        htmlFor='rent'
                        className='block text-sm font-medium text-text-gray mb-2'>
                        Annual Rent Paid
                      </label>
                      <div className='relative'>
                        <span className='absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-text-gray'>
                          ₦
                        </span>
                        <input
                          type='text'
                          id='rent'
                          value={rentDeduction}
                          onChange={handleCurrencyInput(setRentDeduction)}
                          placeholder='0'
                          className='w-full pl-10 pr-4 py-3 text-lg font-bold text-primary-dark border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 focus:outline-none transition-colors bg-green-50/30'
                        />
                      </div>
                      <p className='text-xs text-text-gray mt-1'>
                        Relief = 20% of rent, max ₦500,000
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Input Section - Creator/Self-Employed */}
            {userType === 'creator' && (
              <div className='p-6 md:p-8 border-b border-gray-100'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* Gross Income */}
                  <div>
                    <label
                      htmlFor='creatorIncome'
                      className='block text-sm font-medium text-text-gray mb-2'>
                      Gross Income ({incomeType === 'monthly' ? 'Monthly' : 'Annual'})
                    </label>
                    <div className='relative'>
                      <span className='absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-primary-dark'>
                        ₦
                      </span>
                      <input
                        type='text'
                        id='creatorIncome'
                        value={grossIncome}
                        onChange={handleCurrencyInput(setGrossIncome)}
                        placeholder='0'
                        className='w-full pl-10 pr-4 py-4 text-2xl font-bold text-primary-dark border-2 border-gray-200 rounded-xl focus:border-primary-blue focus:ring-0 focus:outline-none transition-colors'
                      />
                    </div>
                  </div>

                  {/* Business Expenses */}
                  <div>
                    <div className='flex items-center gap-2 mb-2'>
                      <label
                        htmlFor='creatorExpenses'
                        className='text-sm font-medium text-text-gray'>
                        Business Expenses ({incomeType === 'monthly' ? 'Monthly' : 'Annual'})
                      </label>
                      <button
                        onClick={() => setShowDeductionsModal(true)}
                        className='text-primary-blue hover:text-primary-blue/80 transition-colors'
                        aria-label='What are deductible expenses?'>
                        <svg width='14' height='14' viewBox='0 0 24 24' fill='none'>
                          <path
                            d='M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                      </button>
                    </div>
                    <div className='relative'>
                      <span className='absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-text-gray'>
                        ₦
                      </span>
                      <input
                        type='text'
                        id='creatorExpenses'
                        value={businessExpenses}
                        onChange={handleCurrencyInput(setBusinessExpenses)}
                        placeholder='0'
                        className='w-full pl-10 pr-4 py-4 text-2xl font-bold text-primary-dark border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0 focus:outline-none transition-colors bg-green-50/30'
                      />
                    </div>
                    <p className='text-xs text-text-gray mt-1'>
                      Equipment, internet, marketing, etc.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Results Section */}
            <div className='p-6 md:p-8 bg-[#f8fafc]'>
              {/* Summary Cards */}
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                {/* Gross Income */}
                <div className='bg-white rounded-2xl p-4 shadow-sm'>
                  <p className='text-xs text-text-gray mb-1'>Gross Income</p>
                  <p className='text-xl font-bold text-primary-dark'>
                    ₦{formatCurrency(calc.grossIncome)}
                  </p>
                  <p className='text-xs text-text-gray'>/year</p>
                </div>

                {/* Total Reliefs */}
                <div className='bg-white rounded-2xl p-4 shadow-sm'>
                  <div className='flex items-center justify-between'>
                    <p className='text-xs text-text-gray mb-1'>Total Reliefs</p>
                    <button
                      onClick={() => setShowReliefsBreakdown(!showReliefsBreakdown)}
                      className='text-primary-blue text-xs hover:underline'>
                      {showReliefsBreakdown ? 'Hide' : 'View'}
                    </button>
                  </div>
                  <p className='text-xl font-bold text-green-600'>
                    -₦
                    {formatCurrency(
                      userType === 'salary'
                        ? salaryCalculations.totalReliefs
                        : creatorCalculations.totalDeductions
                    )}
                  </p>
                  <p className='text-xs text-text-gray'>/year</p>
                </div>

                {/* Taxable Income */}
                <div className='bg-white rounded-2xl p-4 shadow-sm border-2 border-primary-blue/20'>
                  <p className='text-xs text-text-gray mb-1'>Taxable Income</p>
                  <p className='text-xl font-bold text-primary-dark'>
                    ₦{formatCurrency(calc.taxableIncome)}
                  </p>
                  <p className='text-xs text-text-gray'>/year</p>
                </div>

                {/* Effective Rate */}
                <div className='bg-white rounded-2xl p-4 shadow-sm'>
                  <p className='text-xs text-text-gray mb-1'>Effective Rate</p>
                  <p className='text-xl font-bold text-primary-dark'>
                    {calc.effectiveRate.toFixed(1)}%
                  </p>
                  <p className='text-xs text-text-gray'>of gross income</p>
                </div>
              </div>

              {/* Reliefs Breakdown */}
              {showReliefsBreakdown && (
                <div className='bg-white rounded-2xl p-4 mb-6 shadow-sm'>
                  <h4 className='font-bold text-primary-dark mb-3'>Reliefs Breakdown (Annual)</h4>
                  <div className='space-y-2'>
                    {userType === 'salary' && (
                      <>
                        <div className='flex justify-between text-sm'>
                          <span className='text-text-gray'>Pension ({pensionRate}%)</span>
                          <span className='font-medium'>
                            ₦{formatCurrency(salaryCalculations.pension)}
                          </span>
                        </div>
                        {nhfEnabled && (
                          <div className='flex justify-between text-sm'>
                            <span className='text-text-gray'>NHF (2.5% of Basic)</span>
                            <span className='font-medium'>
                              ₦{formatCurrency(salaryCalculations.nhf)}
                            </span>
                          </div>
                        )}
                        {salaryCalculations.nhis > 0 && (
                          <div className='flex justify-between text-sm'>
                            <span className='text-text-gray'>NHIS</span>
                            <span className='font-medium'>
                              ₦{formatCurrency(salaryCalculations.nhis)}
                            </span>
                          </div>
                        )}
                        {salaryCalculations.rentRelief > 0 && (
                          <div className='flex justify-between text-sm'>
                            <span className='text-text-gray'>
                              Rent Relief (20% of ₦
                              {formatCurrency(salaryCalculations.annualRentPaid)})
                            </span>
                            <span className='font-medium'>
                              ₦{formatCurrency(salaryCalculations.rentRelief)}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    {userType === 'creator' && creatorCalculations.businessExpenses > 0 && (
                      <div className='flex justify-between text-sm'>
                        <span className='text-text-gray'>Business Expenses</span>
                        <span className='font-medium'>
                          ₦{formatCurrency(creatorCalculations.businessExpenses)}
                        </span>
                      </div>
                    )}
                    <div className='flex justify-between text-sm pt-2 border-t border-gray-100'>
                      <span className='font-bold text-primary-dark'>Total Deductions</span>
                      <span className='font-bold text-green-600'>
                        ₦
                        {formatCurrency(
                          userType === 'salary'
                            ? salaryCalculations.totalReliefs
                            : creatorCalculations.totalDeductions
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Tax Results - COMPARISON VIEW */}
              <div className='space-y-6'>
                {/* Tax Savings Banner */}
                {(userType === 'salary'
                  ? salaryCalculations.taxSavings
                  : creatorCalculations.taxSavings) > 0 && (
                  <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 text-white'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 rounded-full bg-white/20 flex items-center justify-center'>
                        <svg
                          width='20'
                          height='20'
                          viewBox='0 0 24 24'
                          fill='none'
                          className='text-white'>
                          <path
                            d='M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                      </div>
                      <div>
                        <p className='text-sm text-white/80'>You save under NTA 2025</p>
                        <p className='text-2xl font-bold'>
                          ₦
                          {formatCurrency(
                            userType === 'salary'
                              ? salaryCalculations.taxSavings
                              : creatorCalculations.taxSavings
                          )}
                          /year
                        </p>
                      </div>
                      <div className='ml-auto text-right'>
                        <p className='text-3xl font-bold'>
                          {(userType === 'salary'
                            ? salaryCalculations.taxSavingsPercent
                            : creatorCalculations.taxSavingsPercent
                          ).toFixed(0)}
                          %
                        </p>
                        <p className='text-xs text-white/80'>less tax</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comparison Cards */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* OLD PITA Rates */}
                  <div className='bg-gray-100 rounded-2xl p-5 border-2 border-gray-200'>
                    <div className='flex items-center gap-2 mb-4'>
                      <span className='px-2 py-1 bg-gray-300 text-gray-700 text-xs font-bold rounded'>
                        OLD
                      </span>
                      <span className='text-sm font-medium text-gray-600'>PITA Rates</span>
                    </div>
                    <div className='space-y-3'>
                      <div>
                        <p className='text-xs text-gray-500'>Annual Tax</p>
                        <p className='text-2xl font-bold text-gray-600 line-through decoration-red-400 decoration-2'>
                          ₦
                          {formatCurrency(
                            userType === 'salary'
                              ? salaryCalculations.oldAnnualTax
                              : creatorCalculations.oldAnnualTax
                          )}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs text-gray-500'>Monthly PAYE</p>
                        <p className='text-lg font-bold text-gray-600'>
                          ₦
                          {formatCurrency(
                            userType === 'salary'
                              ? salaryCalculations.oldMonthlyTax
                              : creatorCalculations.oldMonthlyTax
                          )}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs text-gray-500'>Effective Rate</p>
                        <p className='text-lg font-bold text-gray-600'>
                          {(userType === 'salary'
                            ? salaryCalculations.oldEffectiveRate
                            : creatorCalculations.oldEffectiveRate
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* NEW NTA 2025 Rates */}
                  <div className='bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 border-2 border-green-300'>
                    <div className='flex items-center gap-2 mb-4'>
                      <span className='px-2 py-1 bg-green-500 text-white text-xs font-bold rounded'>
                        NEW
                      </span>
                      <span className='text-sm font-medium text-green-700'>NTA 2025 Rates</span>
                    </div>
                    <div className='space-y-3'>
                      <div>
                        <p className='text-xs text-green-600'>Annual Tax</p>
                        <p className='text-2xl font-bold text-green-700'>
                          ₦{formatCurrency(calc.annualTax)}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs text-green-600'>Monthly PAYE</p>
                        <p className='text-lg font-bold text-green-700'>
                          ₦{formatCurrency(calc.monthlyTax)}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs text-green-600'>Effective Rate</p>
                        <p className='text-lg font-bold text-green-700'>
                          {calc.effectiveRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Take Home Summary */}
                <div className='bg-white rounded-2xl p-5 shadow-sm border'>
                  <div className='flex items-center gap-2 mb-3'>
                    <div className='w-8 h-8 rounded-full bg-green-500 flex items-center justify-center'>
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'
                        className='text-white'>
                        <path
                          d='M12 2V6M12 18V22M6 12H2M22 12H18M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M19.07 19.07L16.24 16.24M7.76 7.76L4.93 4.93'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    </div>
                    <span className='text-sm text-text-gray font-medium'>
                      Annual Take-Home (NTA 2025)
                    </span>
                  </div>
                  <p className='text-3xl font-bold text-green-600'>
                    ₦{formatCurrency(calc.takeHome)}
                  </p>
                  <p className='text-sm text-text-gray mt-1'>
                    ₦{formatCurrency(calc.takeHome / 12)}/month after tax
                  </p>
                </div>
              </div>
            </div>

            {/* Tax Brackets Comparison */}
            <div className='p-6 md:p-8 border-t border-gray-100'>
              <h3 className='text-lg font-bold text-primary-dark mb-4'>Tax Brackets Comparison</h3>
              <p className='text-sm text-text-gray mb-6'>
                See how the tax bands have changed from the old PITA rates to the new NTA 2025 rates
              </p>

              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Old PITA Brackets */}
                <div>
                  <div className='flex items-center gap-2 mb-3'>
                    <span className='px-2 py-1 bg-gray-300 text-gray-700 text-xs font-bold rounded'>
                      OLD
                    </span>
                    <span className='text-sm font-medium text-gray-600'>PITA Rates</span>
                  </div>
                  <div className='space-y-2'>
                    {[
                      { amount: 'First ₦300,000', rate: '7%' },
                      { amount: 'Next ₦300,000', rate: '11%' },
                      { amount: 'Next ₦500,000', rate: '15%' },
                      { amount: 'Next ₦500,000', rate: '19%' },
                      { amount: 'Next ₦1,600,000', rate: '21%' },
                      { amount: 'Above ₦3,200,000', rate: '24%' },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className='flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2'>
                        <span className='text-sm text-gray-600'>{item.amount}</span>
                        <span className='text-sm font-bold text-gray-700'>{item.rate}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* New NTA 2025 Brackets */}
                <div>
                  <div className='flex items-center gap-2 mb-3'>
                    <span className='px-2 py-1 bg-green-500 text-white text-xs font-bold rounded'>
                      NEW
                    </span>
                    <span className='text-sm font-medium text-green-700'>NTA 2025 Rates</span>
                  </div>
                  <div className='space-y-2'>
                    {[
                      { amount: 'First ₦800,000', rate: '0%', highlight: true },
                      { amount: 'Next ₦2,200,000', rate: '15%' },
                      { amount: 'Next ₦9,000,000', rate: '18%' },
                      { amount: 'Next ₦13,000,000', rate: '21%' },
                      { amount: 'Next ₦25,000,000', rate: '23%' },
                      { amount: 'Above ₦50,000,000', rate: '25%' },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={`flex justify-between items-center rounded-lg px-3 py-2 ${
                          item.highlight ? 'bg-green-100 border border-green-300' : 'bg-green-50'
                        }`}>
                        <span className='text-sm text-green-700'>{item.amount}</span>
                        <span
                          className={`text-sm font-bold ${
                            item.highlight ? 'text-green-600' : 'text-green-700'
                          }`}>
                          {item.rate} {item.highlight && '🎉'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className='px-6 md:px-8 pb-6 md:pb-8'>
              <p className='text-xs text-text-gray text-center'>
                <strong>Disclaimer:</strong> This calculator compares estimates based on NTA 2025
                and old PITA PAYE rates. The first ₦800,000 of taxable income is now tax-free under
                NTA 2025. Actual tax liability may vary. Consult a tax professional for personalized
                advice.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Deductions Info Modal */}
      {showDeductionsModal && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'
          onClick={() => setShowDeductionsModal(false)}>
          <div
            className='bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto'
            onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className='sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between'>
              <h3 className='text-xl font-bold text-primary-dark'>
                {userType === 'salary'
                  ? 'Understanding Your Reliefs'
                  : 'Deductions for Creators & Self-Employed'}
              </h3>
              <button
                onClick={() => setShowDeductionsModal(false)}
                className='w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors'>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
                  <path
                    d='M18 6L6 18M6 6L18 18'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className='px-6 py-5 space-y-6'>
              {userType === 'salary' ? (
                <>
                  {/* Salary Earner Reliefs - NTA 2025 */}
                  <div>
                    <div className='flex items-center gap-2 mb-3'>
                      <div className='w-6 h-6 rounded-full bg-green-100 flex items-center justify-center'>
                        <svg
                          width='12'
                          height='12'
                          viewBox='0 0 24 24'
                          fill='none'
                          className='text-green-600'>
                          <path
                            d='M5 13L9 17L19 7'
                            stroke='currentColor'
                            strokeWidth='3'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                      </div>
                      <h4 className='font-bold text-green-700'>Allowed Deductions (NTA 2025)</h4>
                    </div>
                    <ul className='space-y-2'>
                      {[
                        {
                          title: 'Pension Contribution',
                          desc: 'Up to 8% of gross income (employee portion)',
                        },
                        { title: 'National Housing Fund (NHF)', desc: '2.5% of basic salary' },
                        { title: 'NHIS', desc: 'Health insurance contributions' },
                        {
                          title: 'Rent Relief',
                          desc: '20% of annual rent paid, capped at ₦500,000',
                        },
                      ].map((item, i) => (
                        <li key={i} className='flex items-start gap-3 p-3 bg-green-50 rounded-lg'>
                          <span className='text-green-500'>✓</span>
                          <div>
                            <p className='font-medium text-primary-dark text-sm'>{item.title}</p>
                            <p className='text-xs text-text-gray'>{item.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  {/* Creator Deductions */}
                  <div>
                    <div className='flex items-center gap-2 mb-3'>
                      <div className='w-6 h-6 rounded-full bg-green-100 flex items-center justify-center'>
                        <svg
                          width='12'
                          height='12'
                          viewBox='0 0 24 24'
                          fill='none'
                          className='text-green-600'>
                          <path
                            d='M5 13L9 17L19 7'
                            stroke='currentColor'
                            strokeWidth='3'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                      </div>
                      <h4 className='font-bold text-green-700'>Deductible Business Expenses</h4>
                    </div>
                    <p className='text-sm text-text-gray mb-3'>
                      As a creator or self-employed person, you can deduct legitimate business
                      expenses:
                    </p>
                    <ul className='space-y-2'>
                      {[
                        {
                          icon: '💻',
                          title: 'Equipment & Software',
                          desc: 'Laptops, phones, software subscriptions',
                        },
                        {
                          icon: '🌐',
                          title: 'Internet & Phone',
                          desc: 'Business portion of bills',
                        },
                        { icon: '🏠', title: 'Home Office', desc: 'Dedicated workspace expenses' },
                        {
                          icon: '📚',
                          title: 'Training & Education',
                          desc: 'Courses, certifications, books',
                        },
                        {
                          icon: '📢',
                          title: 'Marketing',
                          desc: 'Ads, website hosting, business cards',
                        },
                        {
                          icon: '🚗',
                          title: 'Travel & Transport',
                          desc: 'Business-related travel costs',
                        },
                      ].map((item, i) => (
                        <li key={i} className='flex items-start gap-3 p-3 bg-green-50 rounded-lg'>
                          <span className='text-lg'>{item.icon}</span>
                          <div>
                            <p className='font-medium text-primary-dark text-sm'>{item.title}</p>
                            <p className='text-xs text-text-gray'>{item.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Pro Tip */}
              <div className='bg-primary-blue/5 border border-primary-blue/20 rounded-xl p-4'>
                <div className='flex gap-3'>
                  <div className='text-2xl'>💡</div>
                  <div>
                    <p className='font-bold text-primary-dark text-sm mb-1'>Pro Tip</p>
                    <p className='text-sm text-text-gray'>
                      Keep records of all your expenses throughout the year. Taash helps you track
                      expenses automatically and categorize them for tax deductions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className='sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4'>
              <button
                onClick={() => setShowDeductionsModal(false)}
                className='w-full py-3 bg-primary-dark text-white rounded-xl font-medium hover:bg-primary-dark/90 transition-colors'>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
