/**
 * A monetary figure. Monospaced with tabular figures so digits align across columns —
 * the comparison in this section is unreadable otherwise, because two numbers meant to be
 * compared sit in different columns (00-audit.md §3, tell 7).
 */
export function Figure({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`font-mono tabular-nums tracking-tight ${className}`}>{children}</span>;
}

/**
 * The headline result. Each digit is a column of 0–9 that slides to its value, so the
 * number reads as being computed rather than swapped. Tabular figures guarantee a stable
 * width, so nothing reflows while it moves.
 *
 * There is no mount animation — the motion that carries meaning is the transition between
 * values as the user types. Under prefers-reduced-motion the global rule in globals.css
 * collapses the transition to ~0ms, so each column simply lands on its digit. No
 * information is lost.
 *
 * Hidden from assistive tech: a stack of 0–9 per digit is meaningless read aloud. The rail
 * announces the value through a single polite live region instead.
 */
export function RollingFigure({ value, className = '' }: { value: string; className?: string }) {
  return (
    <span className={`font-mono tabular-nums tracking-tight ${className}`} aria-hidden='true'>
      {[...value].map((ch, i) =>
        /\d/.test(ch) ? (
          <DigitColumn key={i} digit={Number(ch)} index={i} />
        ) : (
          <span key={i}>{ch}</span>
        )
      )}
    </span>
  );
}

function DigitColumn({ digit, index }: { digit: number; index: number }) {
  return (
    <span className='inline-block h-[1em] overflow-hidden align-bottom leading-none'>
      <span
        className='block transition-transform duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)]'
        style={{
          transform: `translateY(-${digit}em)`,
          transitionDelay: `${Math.min(index * 45, 270)}ms`,
        }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className='block h-[1em] leading-none'>
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}
