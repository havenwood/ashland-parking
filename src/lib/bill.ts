export type Block = { type: 'p'; text: string } | { type: 'ol'; items: string[] };
export type Subsection = { letter: string; heading: string; blocks: Block[] };
export type Section = { number: number; heading?: string; blocks: Block[]; subsections: Subsection[] };

/**
 * Parses the ordinance body: `## SECTION n.` (with an optional heading) starts a section,
 * `### A. Heading.` a subsection of new code text, blank lines separate paragraphs,
 * and `1. ` lines form a list.
 */
export function parseBill(markdown: string): Section[] {
  const sections: Section[] = [];
  let blocks: Block[] | undefined;
  for (const chunk of markdown.trim().split(/\n\s*\n/)) {
    let lines = chunk.trim().split('\n').map((line) => line.trim());
    const section = lines[0].match(/^## SECTION (\d+)\.(?:\s+(.+))?$/);
    const subsection = lines[0].match(/^### ([A-Z])\.\s+(.+)$/);
    if (section) {
      sections.push({ number: Number(section[1]), heading: section[2], blocks: [], subsections: [] });
      blocks = sections.at(-1)!.blocks;
      lines = lines.slice(1);
    } else if (subsection) {
      const parent = sections.at(-1);
      if (!parent) throw new Error(`Subsection ${subsection[1]} appears before any section.`);
      parent.subsections.push({ letter: subsection[1], heading: subsection[2], blocks: [] });
      blocks = parent.subsections.at(-1)!.blocks;
      lines = lines.slice(1);
    }
    if (!lines.length) continue;
    if (!blocks) throw new Error('Text appears before the first section.');
    blocks.push(/^\d+\.\s/.test(lines[0])
      ? { type: 'ol', items: lines.map((line) => line.replace(/^\d+\.\s+/, '')) }
      : { type: 'p', text: lines.join(' ') });
  }
  return sections;
}

/** Defined terms and their definitions, from paragraphs and items shaped `“Term” means …`. */
export function definitions(sections: Section[]): Map<string, string> {
  const found = new Map<string, string>();
  const texts = sections.flatMap((section) => section.subsections).flatMap((sub) => sub.blocks)
    .flatMap((block) => (block.type === 'p' ? [block.text] : block.items));
  for (const text of texts) {
    const match = text.match(/^“([^”]+)” means (.+)$/);
    if (match) found.set(match[1], text);
  }
  return found;
}

/** Escapes text for HTML. */
export const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Lowercase, hyphenated id for a defined term, e.g. "Timed Space" → "timed-space". */
export const termId = (term: string) => term.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Escapes text and wraps the first use of each defined term not yet in `used` with `wrap`.
 * The definition itself (the quoted term) is never wrapped.
 */
export function linkTerms(text: string, terms: string[], used: Set<string>, wrap: (term: string, match: string) => string): string {
  const pending = terms.filter((term) => !used.has(term)).sort((a, b) => b.length - a.length);
  if (!pending.length) return escape(text);
  const pattern = new RegExp(`(?<!“)\\b(${pending.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})s?\\b(?!”)`, 'g');
  let html = '';
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const term = match[1];
    if (used.has(term)) continue;
    used.add(term);
    html += escape(text.slice(last, match.index)) + wrap(term, escape(match[0]));
    last = match.index! + match[0].length;
  }
  return html + escape(text.slice(last));
}

/**
 * Wraps the first `phrase` in already-escaped `html` in a <mark>: a reader's highlighter on
 * the clause that matters. Throws if the phrase is gone, so a copy edit can't drop a mark quietly.
 */
export function highlight(html: string, phrase: string, where: string): string {
  const target = escape(phrase);
  const at = html.indexOf(target);
  if (!phrase || at < 0) throw new Error(`Highlight “${phrase}” isn’t in ${where}. Update it to match the text.`);
  return `${html.slice(0, at)}<mark>${target}</mark>${html.slice(at + target.length)}`;
}
