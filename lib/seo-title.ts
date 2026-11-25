/** Characters Google shows of a title, roughly, before cutting it off with "…". */
const VISIBLE = 60;
/** The layout's title template appends " | Taash". */
const SUFFIX = ' | Taash'.length;

/**
 * The <title> for a blog post. Post titles come from Sanity and are often a headline plus a
 * subtitle ("How to Register Your TIN in Nigeria. Step-by-Step Guide for Freelancers"), which
 * runs to 70-100 characters with the brand and gets cut off in results. A title that fits is
 * kept; a long one uses its headline, or is cut at a word. The page and social previews keep
 * the full title.
 */
export function searchTitle(title: string): string {
  const clean = title.replace(/\s+/g, ' ').trim();
  const room = VISIBLE - SUFFIX;
  if (clean.length <= room) return clean;
  const headline = clean.split(/[.:?!]\s/)[0];
  if (headline.length >= 15 && headline.length <= room) return headline;
  const cut = clean.slice(0, room + 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:–-]+$/, '');
}
