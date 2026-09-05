# Tax Content Correctness — 2026 Position

**Subject:** the hard-coded figures in `components/TaxEstimator.tsx:5-23` and `:94-233`, tested against the law as it applies in the 2026 year of assessment.
**Verified:** 4 September 2026. **No code was changed.**

## Primary source obtained

The **Nigeria Tax Act, 2025** as published in the *Federal Republic of Nigeria Official Gazette*, **No. 117, Vol. 112, 26 June 2025, Government Notice No. 26, Act No. 7** — downloaded from the Nigeria Revenue Service (the renamed FIRS) at
`https://www.nrs.gov.ng/uploads/NIGERIA_TAX_ACT_2025_ef6bb812a5.pdf` (62 MB, retrieved 4 Sep 2026).

The Gazette is a scan; OCR is legible for the rate schedule and the deduction list, and illegible in places. Where OCR failed I say so and fall back on named professional sources, marked accordingly.

**Fourth Schedule, page A542, referred from section 58(1) — quoted verbatim from the Gazette OCR:**

```
                              Fourth Schedule
                                                        Section 58 (1)
                     INDIVIDUALS' INCOME TAX RATES

  After the relief allowance and exemptions had been granted in accordance
  with section 30(1) of this Act, the taxable income ascertained shall be taxed
  at the following rates –

       (a) First N800,000 at 0%;
       (b) Next N2,200,000 at 15%;
       (c) Next N9,000,000 at 18%;
       (d) Next N13,000,000 at 21%;
       (e) Next N25,000,000 at 23%; and
       (f) Above N50,000,000 at 25%.
```

**Section 30(2)(a), eligible deductions — OCR partially degraded, structure legible:**

```
  (2) For the purposes of this section –
  (a) "eligible deductions" include payments made by the individual in a
      year of assessment in respect of –
      (i)   the individual's contributions under the National Housing Fund;
      (ii)  the individual's contributions under the National Health Insurance Scheme;
      (iii) the individual's contributions under the Pension Reform Act   [margin: Act No. 4, 2014]
      (iv)  interest on loans for developing an owner-occupied residential house;
      (v)   annual amount of any annuity or premium paid by the individual …
            his own life or the life of his spouse; and
      (vi)  […OCR illegible — the rent relief item…]
```

Sub-paragraph (vi) is the rent relief and did not survive OCR. Its terms are taken from professional sources below and are consistent across all four.

---

## 1. NTA 2025 bands — `TaxEstimator.tsx:16-23`

| # | In code | Verified value | Source | Date | Confidence |
|---|---|---|---|---|---|
| 1 | `0 – 800,000 @ 0%` | First ₦800,000 at 0% | NTA 2025 Fourth Sch. (a), Gazette A542 | 26 Jun 2025 | **High** |
| 2 | `800,000 – 3,000,000 @ 15%` | Next ₦2,200,000 at 15% | Fourth Sch. (b) | 26 Jun 2025 | **High** |
| 3 | `3,000,000 – 12,000,000 @ 18%` | Next ₦9,000,000 at 18% | Fourth Sch. (c) | 26 Jun 2025 | **High** |
| 4 | `12,000,000 – 25,000,000 @ 21%` | Next ₦13,000,000 at 21% | Fourth Sch. (d) | 26 Jun 2025 | **High** |
| 5 | `25,000,000 – 50,000,000 @ 23%` | Next ₦25,000,000 at 23% | Fourth Sch. (e) | 26 Jun 2025 | **High** |
| 6 | `50,000,000 – ∞ @ 25%` | Above ₦50,000,000 at 25% | Fourth Sch. (f) | 26 Jun 2025 | **High** |

**All six bands are correct.** Independently corroborated by PwC Worldwide Tax Summaries (last reviewed 29 May 2026) and KPMG GMS Flash Alert 2025-168 (15 Sep 2025), which give an identical table.

Commencement is **1 January 2026** (KPMG, EY, and every source consulted). The code is therefore applying the right schedule for the current year of assessment.

## 2. Old PITA bands and CRA — `TaxEstimator.tsx:6-13`, `:129-130`

Verified against **FCT-IRS, "Guide to Personal Income Tax Computation"** — a Nigerian tax authority publication (`https://fctirs.gov.ng/wp-content/uploads/Guideline-to-Personal-Income-Tax-Computation.pdf`, no publication date printed; describes the pre-2026 regime).

| In code | FCT-IRS guide | Match |
|---|---|---|
| First ₦300,000 @ 7% | "First N300,000 @ 7%" | ✅ |
| Next ₦300,000 @ 11% | "Next N300,000 @ 11%" | ✅ |
| Next ₦500,000 @ 15% | "Next N500,000 @ 15%" | ✅ |
| Next ₦500,000 @ 19% | "Next N500,000 @ 19%" | ✅ |
| Next ₦1,600,000 @ 21% | "Next N1,600,000 @ 21%" | ✅ |
| Above ₦3,200,000 @ 24% | "Over N3,200,000 @ 24%" | ✅ |
| `max(gross×1%, 200000) + gross×0.2` | "A Tax relief of N200,000.00 or 1% of the Consolidated Salary, whichever is higher, plus 20% of the Consolidated Salary" | ✅ |

**All correct.**

> **Correction to `00-audit.md` §6.3.** I flagged there that CRA should arguably be computed on gross *less* pension/NHF/NHIS. The FCT-IRS guide computes CRA directly on the Consolidated Salary (gross emolument), which is what the code does. The point is genuinely contested among practitioners because of the s.33(2) "gross income" definition inserted by Finance Act 2020, but the tax authority's own published worked example supports the code. **Withdrawing that finding.** Confidence: Medium (contested, authority guidance favours the code).

## 3. Reliefs — the discrepancies

| Item | In code | Verified position | Source | Date | Confidence | Verdict |
|---|---|---|---|---|---|---|
| Rent relief | `min(rent × 0.20, 500,000)` — `:115` | 20% of annual rent, capped ₦500,000 | NTA s.30(2)(a)(vi); PwC "lower of NGN 500,000 or 20% of annual rent paid"; KPMG; EY; Mondaq | PwC rev. 29 May 2026 | **High** | ✅ correct |
| NHF | `basic × 0.025` — `:108` | 2.5% of basic salary, employees earning ≥₦3,000/month | NTA s.30(2)(a)(i); Mondaq §30(2)(a)(i) | 3 Mar 2026 | Medium | ✅ correct — but see §3.1 |
| NHIS | free-text amount, deducted in full — `:111` | Contributions deductible; no statutory cap in NTA | NTA s.30(2)(a)(ii); PwC | 29 May 2026 | **High** | ✅ correct |
| CRA abolished | not applied in NTA path | CRA eliminated, replaced by rent relief | PwC: "removal of the consolidated relief allowance"; KPMG; EY | 29 May 2026 | **High** | ✅ correct |
| **Pension base** | **`gross × 0.08`** — `:105` | **8% of basic + housing + transport** | NTA s.30(2)(a)(iii) defers to Pension Reform Act 2014; PRA 2014 s.4(1) = 8% of "monthly emoluments", defined as not less than basic + housing + transport; **FCT-IRS guide: "National Pension Scheme (8% of Basic, Housing and Transport)"** | PRA 2014; PwC Nigeria Tax Bites Jul 2014 | **High** | ❌ **WRONG** |
| Pension cap | `Math.min(rate, 8%)` — `:105` | 8% is a statutory *minimum*; an employee may contribute more voluntarily and deduct it | PRA 2014 s.4(1) ("minimum of 8%") | 2014 | Medium | ⚠️ see §3.2 |
| Minimum-wage exemption | **not implemented** | "Employees who earn not more than the national minimum wage (NGN 70,000) are no longer liable to tax or deduction of monthly PAYE" | PwC Worldwide Tax Summaries | rev. 29 May 2026 | **High** | ❌ **MISSING** |
| Minimum tax (NTA) | not applied | Correct — "The old minimum tax rule (1% of total income) is no longer referenced under the Nigeria Tax Act" | PwC | rev. 29 May 2026 | **High** | ✅ correct |
| Minimum tax (old PITA) | not applied | Old regime had 1% minimum tax: "Where the Chargeable Income obtained is lower than 1% of the consolidated or gross emolument then 1% of the consolidated salary shall be the Tax Payable Per Annum" | FCT-IRS guide | — | **High** | ⚠️ omitted, immaterial (§3.3) |

### 3.1 NHF base is contested

The code uses 2.5% of **basic**. Mondaq (3 Mar 2026) states 2.5% of basic salary. The FCT-IRS guide says *"Mandatory contribution of 2.5% of monthly income of Nigerians earning N3000 and above per annum"* — i.e. of **monthly income**, not basic. NHF Act s.4 uses "monthly income".

**`UNVERIFIED` which base is correct in practice.** What would settle it: the National Housing Fund Act 1992 s.4 read with any FMBN circular on the contribution base. Nigerian payroll practice overwhelmingly uses basic, which is what the code does, so this is low-risk — but it should not be asserted without checking. Confidence: Medium.

### 3.2 The pension slider caps at the statutory *minimum*

`TaxEstimator.tsx:512` sets the slider `max='8'` and `:105` clamps at 8% of gross. PRA 2014 s.4(1) sets 8% as a **minimum**; employees may contribute more, and s.30(2)(a)(iii) deducts "contributions under the Pension Reform Act" without a stated ceiling. Voluntary additional contributions are a common Nigerian tax-planning route — and one Taash would presumably want to surface.

So the clamp at `:105` is doubly wrong: it is dead code (the slider cannot exceed 8), and the ceiling it encodes is a floor in the statute. Confidence: Medium — whether *voluntary* contributions above 8% are deductible without limit is the part I would want a tax adviser to confirm.

### 3.3 The old-PITA minimum tax is omitted, and it doesn't matter

The 1% minimum tax binds only where chargeable income falls below 1% of gross. With CRA at 20% + ₦200,000, that happens below roughly **₦294,000/year** — well under the national minimum wage. Omitting it changes nothing for any realistic user. Recording it for completeness, not as a defect worth fixing.

---

## 4. The pension-base error, quantified

Using the exact filled state captured in `screenshots/est-d-2-salary-filled.png` (₦450,000 basic + ₦180,000 housing + ₦90,000 transport + ₦60,000 other, monthly; NHIS ₦12,000/month; rent ₦2,400,000):

| | Pension | Total reliefs | Taxable | Annual tax | Monthly PAYE |
|---|---:|---:|---:|---:|---:|
| **As coded** (8% of gross) | ₦748,800 | ₦1,507,800 | ₦7,852,200 | ₦1,203,396 | ₦100,283 |
| **Per statute** (8% of B+H+T) | ₦691,200 | ₦1,450,200 | ₦7,909,800 | ₦1,213,764 | ₦101,147 |

**The page understates annual tax by ₦10,368 (₦864/month) for this profile.**

The "As coded" row reproduces the on-screen figures exactly, which confirms the transcription is faithful. The error scales with whatever the user puts in **"Other Allowances (Medical, Bonus, etc.)"** (`:475-495`) — that field is included in the pension base and should not be. A user with a large bonus line will be told they owe materially less than they do.

**Direction of error: understates tax.** That is the worse direction for a product whose promise is "know what you owe".

## 5. The minimum-wage exemption is missing

A worker on exactly the ₦70,000/month national minimum wage, entering ₦70,000 as basic with no pension, NHF or rent declared, is shown **₦6,000/year of tax**. The statutory position is that they are not liable to PAYE at all.

The default `nhfEnabled = true` (`:77`) masks this in the common path (NHF relief pulls taxable income back under ₦800,000), so it surfaces only for users who switch NHF off. It is still a wrong answer given to exactly the demographic the reform was written to protect.

---

## 6. Should the site still lead with an NTA-vs-PITA comparison?

**No. The framing is eight months stale and, above ~₦20M/year, actively misleading.**

Four reasons:

1. **PITA is not a live alternative.** NTA 2025 commenced 1 January 2026. A user in September 2026 has no choice between regimes — the comparison answers a question nobody has. It made sense as a change announcement in late 2025.

2. **The savings claim inverts at the top of the range.** From the sweep in `00-audit.md` §6.2, the crossover is ≈ **₦19.9M/year gross**. Above it, NTA 2025 costs more. This is not my inference alone: KPMG notes the reforms "could also result in higher taxes for higher-income earners," and one industry source computes PAYE on ₦50,000,000 as roughly **₦1.09M higher** under NTA — which matches this repo's own arithmetic at ₦48M (−₦1,011,800) almost exactly.

3. **The UI keeps the "new is better" styling when it isn't.** Verified at ₦36M gross (`screenshots/est-d-6-highincome-banner-hidden.png`): the savings banner is gone, yet `:865` still strikes a red line through the *cheaper* old figure and `:899` keeps the green "better" card for the *more expensive* new one.

4. **The section header oversells.** `:275-277` reads "See how much you save with the new ₦800,000 tax-free threshold" — asserting a saving before any input exists, and for a fifth of the plausible salary range it is false.

**Recommended framing for the directions:** the estimator's primary job becomes *"what you owe in 2026"*, computed under NTA 2025 as the current and only regime. The comparison survives as a **secondary, opt-in** panel — "How this compares to the old PITA rules" — that is honest in both directions and says plainly when the user pays more. The labels "NEW", "OLD", "you save" become "2026 (Nigeria Tax Act)" and "Pre-2026 (PITA)", with a signed difference rather than a one-way saving. Nothing is deleted; it is demoted and made truthful.

Two copy strings should change with it (`00-audit.md` marks all copy as surviving by default; these two are factual claims, not style):
- `:269` eyebrow "NTA 2025 vs PITA Comparison" → the current-regime framing
- `:275-277` subhead — drop the pre-asserted saving

## 7. Disclaimer

**The page needs one, and the current one is not sufficient.**

Existing text (`:1035-1039`) is 12px `--text-gray` centred at the very bottom of a 2,304px section — measured at 4.76:1 on white, and positioned where almost nobody reaches. It also frames itself around the comparison rather than the estimate.

It should say four things, and does say two:

| Required | Present? |
|---|---|
| Not tax advice; consult a professional | ✅ `:1038-1039` |
| Estimates only, actual liability may vary | ✅ `:1038` |
| **The basis and date — "computed under the Nigeria Tax Act 2025, in force from 1 January 2026; figures as at \<date\>"** | ❌ missing |
| **That the estimate excludes non-PAYE items (capital gains, rental income, foreign income, state levies) and assumes the user is Nigerian-resident** | ❌ missing |

**Placement.** One line immediately under the headline result — where the number is, at ≥12px and ≥4.5:1 — plus the fuller statement retained at the foot of the section. A disclaimer the user never scrolls to is not a disclaimer.

Recommended short form:

> Estimate only, not tax advice. Calculated under the Nigeria Tax Act 2025 (in force 1 January 2026). Covers employment and self-employment income only. Figures as at *\<date\>*.

Carry a `TAX_YEAR` / `FIGURES_AS_AT` constant so the date is data, not prose — see `04-upgrade-plan.md`.

---

## 8. Summary of required changes (report only — no code touched)

| Priority | Change | Where |
|---|---|---|
| **P1** | Pension base → basic + housing + transport, not gross | `:105` |
| **P1** | Retire the "you save" framing as the primary story; make the comparison secondary and signed | `:250-277`, `:802-927` |
| **P1** | Stop styling the new regime as better when it is worse (strikethrough + green card) | `:865`, `:899` |
| **P2** | Implement the national-minimum-wage exemption | `:94-167` |
| **P2** | Fix "Annual Take-Home" to net off pension/NHF/NHIS, or relabel it | `:143`, `:213` |
| **P2** | Add basis + as-at date to the disclaimer and lift it next to the result | `:1033-1041` |
| **P3** | Allow pension above 8% (statutory minimum, not a cap); remove the dead clamp | `:105`, `:512` |
| **P3** | Add rent relief to the creator path — it is not employment-specific | `:181-233` |
| **P3** | Single source of truth for brackets (logic `:5-23` and display `:979-1012` are duplicated) | both |
| — | NHF base (basic vs monthly income) | `UNVERIFIED` — settle against NHF Act s.4 before touching |

---

## Sources

- [Nigeria Tax Act, 2025 — Official Gazette No. 117, Vol. 112, 26 June 2025, Act No. 7](https://www.nrs.gov.ng/uploads/NIGERIA_TAX_ACT_2025_ef6bb812a5.pdf) — Nigeria Revenue Service. Fourth Schedule (p. A542), s.30(2)(a) (p. A417). Retrieved 4 Sep 2026.
- [PwC Worldwide Tax Summaries — Nigeria, Individual: Taxes on personal income](https://taxsummaries.pwc.com/nigeria/individual/taxes-on-personal-income) — last reviewed **29 May 2026**.
- [PwC Worldwide Tax Summaries — Nigeria, Individual: Deductions](https://taxsummaries.pwc.com/nigeria/individual/deductions) — last reviewed **29 May 2026**.
- [KPMG GMS Flash Alert 2025-168 — Nigeria: Reforms of the Personal Income Tax Regime](https://kpmg.com/xx/en/our-insights/gms-flash-alert/flash-alert-2025-168.html) — published **15 September 2025**.
- [EY Tax Alert — Nigeria Tax Act 2025 has been signed, highlights](https://www.ey.com/en_gl/technical/tax-alerts/nigeria-tax-act-2025-has-been-signed-highlights) — published **30 June 2025**.
- [FCT-IRS — Guide to Personal Income Tax Computation](https://fctirs.gov.ng/wp-content/uploads/Guideline-to-Personal-Income-Tax-Computation.pdf) — Federal Capital Territory Internal Revenue Service; pre-2026 PITA regime, CRA formula, 8%-of-B+H+T pension base, 1% minimum tax. No publication date printed.
- [Mondaq — Comprehensive Guide: Personal Income Tax Deductions Under The Nigeria Tax Act 2025](https://www.mondaq.com/nigeria/tax-authorities/1751764/comprehensive-guide-personal-income-tax-deductions-under-the-nigeria-tax-act-2025) — published **3 March 2026**. Section references for s.30(2)(a)(i)–(vi).
- [PwC Nigeria — Pension Reform Act 2014: the good, the bad and the ugly](https://www.pwc.com/ng/en/assets/pdf/tax-bites-july-2014.pdf) — July 2014. PRA s.4(1), "monthly emoluments" definition.
