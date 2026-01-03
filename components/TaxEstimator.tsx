'use client';

import { useMemo, useState } from 'react';

// NTAA 2025 PAYE Tax Brackets (applies to taxable income after reliefs)
const NTAA_2025_BRACKETS = [
  { min: 0, max: 300000, rate: 0.07 }, // First ₦300,000 at 7%
  { min: 300000, max: 600000, rate: 0.11 }, // Next ₦300,000 at 11%
  { min: 600000, max: 1100000, rate: 0.15 }, // Next ₦500,000 at 15%
  { min: 1100000, max: 1600000, rate: 0.19 }, // Next ₦500,000 at 19%
  { min: 1600000, max: 3200000, rate: 0.21 }, // Next ₦1,600,000 at 21%
  { min: 3200000, max: Infinity, rate: 0.24 }, // Above ₦3,200,000 at 24%
];

function calculateTax(income: number): number {
  let tax = 0;
  let remainingIncome = income;

  for (const bracket of NTAA_2025_BRACKETS) {
    if (remainingIncome <= 0) break;

    const bracketSize = bracket.max - bracket.min;
    const taxableInBracket = Math.min(remainingIncome, bracketSize);
    tax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
  }

  return tax;
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

    // Step 2: Calculate Reliefs (NTA 2025 - Basic Relief removed)
    // Pension (max 8% of gross)
    const pension = Math.min(grossIncome * (pensionRate / 100), grossIncome * 0.08);

    // NHF (2.5% of basic salary)
    const nhf = nhfEnabled ? basic * 0.025 : 0;

    // NHIS
    const nhis = parseAmount(nhisAmount) * multiplier;

    // Rent Deduction - NTA 2025: 20% of annual rent paid, capped at ₦500,000
    // Note: Rent is always entered as annual amount in Nigeria
    const annualRentPaid = parseAmount(rentDeduction);
    const rentRelief = Math.min(annualRentPaid * 0.2, 500000);

    // Total Reliefs (NTA 2025 - No Basic Relief, No Consolidated Relief)
    const totalReliefs = pension + nhf + nhis + rentRelief;

    // Step 3: Taxable Income
    const taxableIncome = Math.max(0, grossIncome - totalReliefs);

    // Step 4 & 5: Calculate Tax
    const annualTax = calculateTax(taxableIncome);
    const monthlyTax = annualTax / 12;

    // Step 6: Other outputs
    const effectiveRate = grossIncome > 0 ? (annualTax / grossIncome) * 100 : 0;
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

    // For creators: Simple calculation - gross minus business expenses
    // NTA 2025: No Basic Relief or Consolidated Relief
    const totalDeductions = expenses;

    // Taxable Income
    const taxableIncome = Math.max(0, gross - totalDeductions);

    // Calculate Tax
    const annualTax = calculateTax(taxableIncome);
    const monthlyTax = annualTax / 12;

    // Other outputs
    const effectiveRate = gross > 0 ? (annualTax / gross) * 100 : 0;
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
            NTAA 2025 Rates
          </div>
          <h2 className='text-3xl md:text-4xl font-bold text-primary-dark mb-4'>
            PAYE Tax Calculator
          </h2>
          <p className='text-lg text-text-gray max-w-2xl mx-auto'>
            Calculate your PAYE tax under the Nigeria Tax Administration Act 2025. Get accurate
            estimates with all applicable reliefs and deductions.
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
                    -₦{formatCurrency(
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
                            <span className='text-text-gray'>Rent Relief (20% of ₦{formatCurrency(salaryCalculations.annualRentPaid)})</span>
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

              {/* Main Tax Results */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {/* Annual Tax */}
                <div className='bg-white rounded-2xl p-5 shadow-sm'>
                  <div className='flex items-center gap-2 mb-3'>
                    <div className='w-8 h-8 rounded-full bg-primary-blue/10 flex items-center justify-center'>
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'
                        className='text-primary-blue'>
                        <path
                          d='M9 14L4 9M4 9L9 4M4 9H15C16.0609 9 17.0783 9.42143 17.8284 10.1716C18.5786 10.9217 19 11.9391 19 13V20'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    </div>
                    <span className='text-sm text-text-gray'>Annual Tax Payable</span>
                  </div>
                  <p className='text-2xl md:text-3xl font-bold text-primary-dark'>
                    ₦{formatCurrency(calc.annualTax)}
                  </p>
                  <p className='text-sm text-text-gray mt-1'>NTAA 2025 rates</p>
                </div>

                {/* Monthly Tax */}
                <div className='bg-white rounded-2xl p-5 shadow-sm'>
                  <div className='flex items-center gap-2 mb-3'>
                    <div className='w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center'>
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'
                        className='text-yellow-600'>
                        <path
                          d='M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    </div>
                    <span className='text-sm text-text-gray'>Monthly PAYE</span>
                  </div>
                  <p className='text-2xl md:text-3xl font-bold text-primary-dark'>
                    ₦{formatCurrency(calc.monthlyTax)}
                  </p>
                  <p className='text-sm text-text-gray mt-1'>Deducted from salary</p>
                </div>

                {/* Take Home */}
                <div className='bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 border border-green-200'>
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
                    <span className='text-sm text-green-700 font-medium'>Annual Take-Home</span>
                  </div>
                  <p className='text-2xl md:text-3xl font-bold text-green-700'>
                    ₦{formatCurrency(calc.takeHome)}
                  </p>
                  <p className='text-sm text-green-600 mt-1'>
                    ₦{formatCurrency(calc.takeHome / 12)}/month
                  </p>
                </div>
              </div>
            </div>

            {/* Tax Brackets Display */}
            <div className='p-6 md:p-8 border-t border-gray-100'>
              <h3 className='text-lg font-bold text-primary-dark mb-4'>
                NTAA 2025 PAYE Tax Brackets
              </h3>
              <p className='text-sm text-text-gray mb-4'>
                Tax is calculated on your <strong>taxable income</strong> (gross income minus
                reliefs and deductions)
              </p>
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3'>
                {[
                  { band: 'Band 1', amount: '₦300k', rate: '7%' },
                  { band: 'Band 2', amount: '+₦300k', rate: '11%' },
                  { band: 'Band 3', amount: '+₦500k', rate: '15%' },
                  { band: 'Band 4', amount: '+₦500k', rate: '19%' },
                  { band: 'Band 5', amount: '+₦1.6M', rate: '21%' },
                  { band: 'Band 6', amount: '>₦3.2M', rate: '24%' },
                ].map((item, i) => (
                  <div key={i} className='bg-gray-50 rounded-xl p-3 text-center'>
                    <p className='text-xs text-text-gray mb-1'>{item.band}</p>
                    <p className='text-sm font-medium text-primary-dark'>{item.amount}</p>
                    <p className='text-lg font-bold text-primary-blue'>{item.rate}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className='px-6 md:px-8 pb-6 md:pb-8'>
              <p className='text-xs text-text-gray text-center'>
                <strong>Disclaimer:</strong> This calculator provides estimates based on NTAA 2025
                PAYE rates. Actual tax liability may vary based on individual circumstances. Consult
                a tax professional for personalized advice.
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
