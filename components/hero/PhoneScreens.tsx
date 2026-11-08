import { formatNaira } from '@/lib/tax';
import {
  ANNUAL_RENT,
  DEDUCTIONS_AFTER,
  DEDUCTIONS_BEFORE,
  INCOME,
  RENT_RELIEF,
  RENT_SAVING,
  SCAN_LINES,
  SCAN_TOTAL,
  SET_ASIDE_AFTER,
  SET_ASIDE_BEFORE,
  SWIPED,
  TAX_AFTER,
  TAX_BEFORE,
  TAX_SAVED,
  WEEKLY,
  WEEKS_LEFT,
} from './demo-figures';
import s from './PhoneDemo.module.css';

/**
 * The screens of the hero phone demo, rebuilt from the real app recording (Nov 2026). Pure
 * markup: which screen shows, and what moves inside it, is driven by data attributes that
 * PhoneDemo sets on its root (see PhoneDemo.module.css).
 */
export const naira = (n: number) => `₦${formatNaira(n)}`;
const kobo = (n: number) =>
  `₦ ${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (tax: number) => `${((tax / INCOME) * 100).toFixed(1)}% of income`;

function StatusBar({ dark }: { dark?: boolean }) {
  return (
    <div className={s.statusBar} style={dark ? { color: '#0b1830' } : undefined}>
      <span>9:41</span>
      <span className={s.statusIcons}>
        <svg viewBox='0 0 17 11' fill='currentColor'>
          <rect x='0' y='7' width='3' height='4' rx='0.8' />
          <rect x='4.5' y='5' width='3' height='6' rx='0.8' />
          <rect x='9' y='2.5' width='3' height='8.5' rx='0.8' />
          <rect x='13.5' y='0' width='3' height='11' rx='0.8' />
        </svg>
        <svg viewBox='0 0 24 11' fill='none'>
          <rect x='0.5' y='0.5' width='20' height='10' rx='3' stroke='currentColor' strokeOpacity='0.45' />
          <rect x='2' y='2' width='14' height='7' rx='1.6' fill='currentColor' />
          <rect x='21.5' y='3.5' width='1.8' height='4' rx='0.9' fill='currentColor' fillOpacity='0.45' />
        </svg>
      </span>
    </div>
  );
}

export function Roll({ before, after }: { before: string; after: string }) {
  return (
    <span className={s.roll}>
      <span>{before}</span>
      <span>{after}</span>
    </span>
  );
}

export function Home() {
  return (
    <div className={s.home}>
      <StatusBar />
      <div className={s.toast}>
        <span className={s.toastIcon}>
          <svg viewBox='0 0 16 16' fill='none'>
            <path d='M3.5 8.5l3 3 6-7' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
          </svg>
        </span>
        <div>
          <strong>2 expenses marked deductible</strong>
          <span>Estimated tax down {naira(TAX_SAVED)}</span>
        </div>
      </div>

      <div className={s.homeTop}>
        <div className={s.greeting}>
          <span className={s.avatar}>AO</span>
          <span className={s.hello}>
            <span>Good morning,</span>
            <strong>Ada</strong>
          </span>
          <span className={s.iconBtn}>
            <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round'>
              <path d='M16 10a6 6 0 1 1-1.8-4.3M16 3v3.5h-3.5' />
            </svg>
          </span>
          <span className={s.iconBtn}>
            <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinejoin='round'>
              <path d='M5 8.5a5 5 0 0 1 10 0v3.5l1.5 2.5h-13L5 12zM8 17h4' />
            </svg>
            <span className={s.badge}>2</span>
          </span>
        </div>

        <div className={s.taxCard}>
          <div className={s.taxLabel}>
            Estimated Tax (NTA 2025)
            <span className={s.pill}>
              <Roll before={pct(TAX_BEFORE)} after={pct(TAX_AFTER)} />
            </span>
          </div>
          <div className={s.bigFigure}>
            <Roll before={naira(TAX_BEFORE)} after={naira(TAX_AFTER)} />
          </div>
          <div className={s.sub}>
            <Roll
              before={`${naira(Math.round(TAX_BEFORE / 12))}/month to set aside`}
              after={`${naira(Math.round(TAX_AFTER / 12))}/month to set aside`}
            />
          </div>
          <div className={s.stats}>
            <div>
              <div className={s.statLabel}>Income</div>
              <div className={s.statValue}>{naira(INCOME)}</div>
              <div className={s.statNote}>Expected</div>
            </div>
            <div>
              <div className={s.statLabel}>Deductions</div>
              <div className={s.statValue}>
                <Roll before={naira(DEDUCTIONS_BEFORE)} after={naira(DEDUCTIONS_AFTER)} />
              </div>
              <div className={s.statNote}>Tracked</div>
            </div>
          </div>
          <div className={s.divider} />
          <span className={s.ghostPill}>Try an income →</span>
        </div>
      </div>

      <div className={s.sheet}>
        <div className={s.actions}>
          <span className={s.action}>
            <span className={s.actionIcon}>
              <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round'>
                <path d='M10 4v12M4 10h12' />
              </svg>
            </span>
            Add Income
          </span>
          <span className={s.action}>
            <span className={s.actionIcon}>
              <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                <path d='M3 14l4.5-4.5 3 3L17 6M13 6h4v4' />
              </svg>
            </span>
            Add Expense
          </span>
          <span className={s.action}>
            <span className={`${s.actionIcon} ${s.tapScan}`}>
              <span className={s.touch} />
              <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinejoin='round'>
                <path d='M3 7.5A1.5 1.5 0 0 1 4.5 6h2l1.2-2h4.6l1.2 2h2A1.5 1.5 0 0 1 17 7.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14.5z' />
                <circle cx='10' cy='11' r='2.8' />
              </svg>
            </span>
            Scan Receipt
          </span>
        </div>

        <div className={s.review}>
          <span className={s.reviewIcon}>
            <svg viewBox='0 0 16 16' fill='none' stroke='currentColor' strokeWidth='1.5'>
              <circle cx='8' cy='8' r='6.25' />
              <path d='M8 7.2v4M8 4.8v.1' strokeLinecap='round' />
            </svg>
          </span>
          <div>
            <span className={s.chip}>To review</span>
            <div className={s.reviewTitle}>
              <Roll before='7 transactions to review' after='5 transactions to review' />
            </div>
            <div className={s.reviewRow}>
              <p>Swipe through them — you decide what counts.</p>
              <span className={s.reviewBtn}>
                Review now
                <span className={s.touch} />
              </span>
            </div>
          </div>
          <svg className={s.close} viewBox='0 0 14 14' fill='none' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round'>
            <path d='M3 3l8 8M11 3l-8 8' />
          </svg>
        </div>
        <p className={s.synced}>Bank last synced just now</p>
      </div>

      <TabBar />
    </div>
  );
}

function TabBar() {
  return (
    <div className={s.tabBar}>
      <span className={`${s.tab} ${s.tabActive}`}>
        <svg viewBox='0 0 20 20' fill='currentColor'>
          <path d='M3 9.2 10 3l7 6.2V17h-4.5v-4.5h-5V17H3z' />
        </svg>
        Home
      </span>
      <span className={s.tab}>
        <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.6'>
          <path d='M5 2.5h10v15l-2.5-1.5-2.5 1.5-2.5-1.5L5 17.5zM8 7h4M8 10h4' />
        </svg>
        Tax
      </span>
      <span className={`${s.tab} ${s.tapSave}`}>
        <span className={s.touch} />
        <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.6'>
          <path d='M3.5 10.5a6.5 5.5 0 0 1 13 0V14h-2l-1 2.5h-2V15h-3v1.5h-2l-1-2.5h-2z' />
        </svg>
        Savings
      </span>
      <span className={s.tab}>
        <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.6'>
          <rect x='4' y='3' width='12' height='14' rx='2' />
          <path d='M7 7.5h6M7 10.5h6M7 13.5h4' />
        </svg>
        History
        <span className={s.badge}>
          <Roll before='7' after='5' />
        </span>
      </span>
      <span className={`${s.tab} ${s.tapAi}`}>
        <span className={s.touch} />
        <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinejoin='round'>
          <path d='M10 3l1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6z' />
        </svg>
        AI
      </span>
    </div>
  );
}

export function Mark({ remaining }: { remaining: number }) {
  return (
    <div className={s.mark}>
      <StatusBar />
      <div className={s.markTop}>
        <div className={s.markNav}>
          <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <path d='M16 10H4m0 0l5-5m-5 5l5 5' />
          </svg>
          <span className={s.viewAll}>View all {remaining} ≡</span>
        </div>
        <p className={s.markTitle}>Mark Transactions</p>
        <p className={s.markHint}>
          Swipe right (✓): mark as tax deductible
          <br />
          Swipe left (✗): mark as not deductible
        </p>
      </div>

      <div className={s.markSheet}>
        <div className={s.stack}>
          <TxnCard
            className={s.card3}
            merchant='Bolt'
            amount={3_150}
            date='Thursday, 5 November 2026'
            icon='🚕'
            category='Transport'
            applies='Filed under Transport. Transport for work usually counts for a small business.'
          />
          <TxnCard
            className={s.card2}
            merchant='Computer Village, Ikeja'
            amount={SWIPED[1]}
            date='Friday, 6 November 2026'
            icon='💻'
            category='Work equipment'
            applies='Equipment you buy for your work usually counts as a business expense.'
          />
          <TxnCard
            className={s.card1}
            merchant='Uber'
            amount={SWIPED[0]}
            date='Saturday, 7 November 2026'
            icon='🚗'
            category='Transport'
            applies='Filed under Transport. Transport for work usually counts for a small business.'
          />
        </div>
        <div className={s.swipeButtons}>
          <span>
            <span className={s.yes}>
              <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round'>
                <path d='M5 10.5l3.2 3.2L15 6.5' />
              </svg>
            </span>
            Tax Deductible
          </span>
          <span>
            <span className={s.no}>
              <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round'>
                <path d='M6 6l8 8M14 6l-8 8' />
              </svg>
            </span>
            Not Deductible
          </span>
        </div>
      </div>
    </div>
  );
}

function TxnCard({
  className,
  merchant,
  amount,
  date,
  icon,
  category,
  applies,
}: {
  className: string;
  merchant: string;
  amount: number;
  date: string;
  icon: string;
  category: string;
  applies: string;
}) {
  return (
    <div className={`${s.card} ${className}`}>
      <span className={s.stamp}>DEDUCTIBLE ✓</span>
      <div className={s.row}>
        <div className={s.rowLabel}>Merchant</div>
        <div className={s.rowValue}>{merchant}</div>
      </div>
      <div className={s.row}>
        <div className={s.rowLabel}>Total Amount</div>
        <div className={s.rowValue}>{kobo(amount)}</div>
      </div>
      <div className={s.row}>
        <div className={s.rowLabel}>Date</div>
        <div className={s.rowValue}>{date}</div>
      </div>
      <div className={`${s.row} ${s.category}`}>
        <span className={s.catIcon}>{icon}</span>
        <div>
          <div className={s.rowLabel}>Category</div>
          <div className={s.rowValue}>{category}</div>
        </div>
      </div>
      <div className={s.applies}>
        <b>WHAT USUALLY APPLIES</b>
        <p>{applies}</p>
      </div>
      <div className={s.askAi}>✦ Ask AI if it&apos;s deductible</div>
      <p className={s.note}>Uses 1 of your AI checks this month</p>
    </div>
  );
}


const Tick = () => (
  <svg viewBox='0 0 16 16' fill='none'>
    <path d='M3.5 8.5l3 3 6-7' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' />
  </svg>
);

export function Scan() {
  return (
    <div className={s.scan}>
      <StatusBar />
      <div className={s.scanTop}>
        <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round'>
          <path d='M5 5l10 10M15 5L5 15' />
        </svg>
        Scan receipt
        <span style={{ width: 'calc(var(--u) * 18)' }} />
      </div>
      <div className={s.viewfinder}>
        <span className={s.corner} />
        <span className={s.corner} />
        <span className={s.corner} />
        <span className={s.corner} />
        <div className={s.paper}>
          <div className={s.paperHead}>JUMIA</div>
          <div className={s.paperSub}>Order receipt · 8 Nov 2026</div>
          {SCAN_LINES.map((line) => (
            <div key={line.item} className={s.paperLine}>
              <span>{line.item}</span>
              <span>{formatNaira(line.amount)}.00</span>
            </div>
          ))}
          <div className={s.paperRule} />
          <div className={`${s.paperLine} ${s.paperTotal}`}>
            <span>TOTAL</span>
            <span>{naira(SCAN_TOTAL)}.00</span>
          </div>
          <div className={s.paperSub} style={{ marginTop: 'calc(var(--u) * 18)' }}>
            Thank you for shopping
          </div>
        </div>
        <span className={s.scanBeam} />
      </div>
      <p className={s.scanHint}>Text is read on your phone</p>
      <div className={s.shutter} />
    </div>
  );
}

export function Receipt() {
  return (
    <div className={s.receipt}>
      <StatusBar />
      <div className={s.receiptTop}>
        <div className={s.markNav}>
          <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <path d='M16 10H4m0 0l5-5m-5 5l5 5' />
          </svg>
        </div>
        <p className={s.markTitle}>Review Receipt</p>
        <p className={s.markHint}>Check the details before saving</p>
      </div>
      <div className={s.receiptBody}>
        <span className={s.readChip}>
          <Tick /> Read from your receipt
        </span>
        <div className={s.fieldCard}>
          <div className={s.row}>
            <div className={s.rowLabel}>Merchant</div>
            <div className={s.rowValue}>Jumia</div>
          </div>
          <div className={s.row}>
            <div className={s.rowLabel}>Total Amount</div>
            <div className={s.rowValue}>{kobo(SCAN_TOTAL)}</div>
          </div>
          <div className={`${s.row} ${s.category}`}>
            <span className={s.catIcon}>💡</span>
            <div>
              <div className={s.rowLabel}>Category</div>
              <div className={s.rowValue}>Work equipment</div>
            </div>
          </div>
          <div className={s.row} style={{ borderBottom: 0 }}>
            <div className={s.rowLabel}>Date</div>
            <div className={s.rowValue}>Sunday, 8 November 2026</div>
          </div>
        </div>
        <span className={s.saveBtn}>
          Save receipt
          <span className={s.touch} />
        </span>
        <div className={s.ghostRow}>
          <span>Rescan</span>
          <span>Edit details</span>
        </div>
      </div>
      <div className={s.savedScrim}>
        <div className={s.savedCard}>
          <span className={s.savedIcon}>
            <Tick />
          </span>
          <p className={s.savedTitle}>Expense saved</p>
          <p className={s.savedSub}>Added to your tax records</p>
          <p className={s.savedAmount}>{kobo(SCAN_TOTAL)}</p>
          <p className={s.savedSub}>Work equipment · Jumia</p>
        </div>
      </div>
    </div>
  );
}

export function Ai() {
  return (
    <div className={s.ai}>
      <StatusBar dark />
      <div className={s.aiTop}>
        <span className={s.aiBadge}>AI</span>
        <div>
          <div className={s.aiName}>Taash AI</div>
          <div className={s.aiPrivate}>Private &amp; never shared</div>
        </div>
      </div>
      <div className={s.aiBody}>
        <p className={s.aiHello}>Hi Ada 👋</p>
        <p className={s.aiAsk}>What can I help you with today?</p>
        <div className={s.cell}>
          <div className={s.chips}>
            <span>What deductions am I missing?</span>
            <span>How do I file?</span>
            <span>Set a savings goal</span>
          </div>
          <div className={s.bubbleMe}>What deductions am I likely missing?</div>
        </div>
        <div className={s.cell}>
          <div className={s.typing}>
            <i />
            <i />
            <i />
          </div>
          <div className={s.bubbleAi}>
            You told me you pay {naira(ANNUAL_RENT)} rent a year, but you haven&apos;t claimed rent
            relief yet.
            <div className={s.reliefCard}>
              <b>Rent relief</b>
              <span>{naira(RENT_RELIEF)} off your taxable income</span>
              <span className={s.reliefSave}>Saves about {naira(RENT_SAVING)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className={s.aiInput}>
        Ask a follow-up…
        <i>→</i>
      </div>
      <p className={s.aiNote}>Not professional tax advice.</p>
    </div>
  );
}

const share = (n: number) => n / TAX_AFTER;
const ringOffset = (n: number) => `${(251.3 * (1 - share(n))).toFixed(1)}`;

export function Save() {
  const weeks = [
    { label: 'This week', dates: '9 – 15 Nov' },
    { label: 'Next week', dates: '16 – 22 Nov' },
  ];
  return (
    <div
      className={s.save}
      style={{ '--ring-before': ringOffset(SET_ASIDE_BEFORE), '--ring-after': ringOffset(SET_ASIDE_AFTER) } as React.CSSProperties}>
      <StatusBar />
      <div className={s.saveTop}>
        <p className={s.saveTitle}>Savings</p>
        <div className={s.ringCard}>
          <div className={s.ring}>
            <svg viewBox='0 0 100 100'>
              <circle className={s.ringTrack} cx='50' cy='50' r='40' />
              <circle className={s.ringFill} cx='50' cy='50' r='40' />
            </svg>
            <span className={s.ringPct}>
              <Roll
                before={`${Math.round(share(SET_ASIDE_BEFORE) * 100)}%`}
                after={`${Math.round(share(SET_ASIDE_AFTER) * 100)}%`}
              />
            </span>
          </div>
          <div>
            <div className={s.setLabel}>Tax set aside · 2026</div>
            <div className={s.setAmount}>
              <Roll before={naira(SET_ASIDE_BEFORE)} after={naira(SET_ASIDE_AFTER)} />
            </div>
            <div className={s.setOf}>of {naira(TAX_AFTER)} estimated</div>
          </div>
        </div>
        <p className={s.weekly}>
          Put aside <b>{naira(WEEKLY)} a week</b> to be ready by 31 March · {WEEKS_LEFT} weeks left
        </p>
      </div>
      <div className={s.payments}>
        <p className={s.payHead}>Payments</p>
        {weeks.map((week) => (
          <div key={week.label} className={s.payRow}>
            <span className={s.payDot}>
              <Tick />
            </span>
            <span className={s.payText}>
              <b>{week.label}</b>
              <span>{week.dates}</span>
            </span>
            <span className={s.payAmount}>{naira(WEEKLY)}</span>
          </div>
        ))}
        <span className={s.payBtn}>
          <span>Mark this week as paid</span>
          <span>✓ Paid · {naira(WEEKLY)} set aside</span>
          <span className={s.touch} />
        </span>
      </div>
    </div>
  );
}
