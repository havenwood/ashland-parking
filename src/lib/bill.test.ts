import assert from 'node:assert/strict';
import { test } from 'node:test';
import { definitions, highlight, linkTerms, parseBill, termId } from './bill.ts';

const source = `
## SECTION 1.
The recitals are incorporated.

## SECTION 2. New Section.
Section 11.26.105 is added to read:

### A. Definitions.
1. “Timed Space” means a space with a posted limit.
2. “Pass” means a permit issued under this section.

### B. Effect.
A Pass doubles the limit of a Timed Space. A second Timed Space
is no different.
`;

test('parses sections, subsections, paragraphs and lists', () => {
  const [one, two] = parseBill(source);
  assert.equal(one.heading, undefined);
  assert.equal(two.heading, 'New Section.');
  assert.deepEqual(one.blocks, [{ type: 'p', text: 'The recitals are incorporated.' }]);
  assert.equal(two.subsections.length, 2);
  assert.equal(two.subsections[0].blocks[0].type, 'ol');
  assert.equal(two.subsections[1].blocks[0].type, 'p');
  assert.match((two.subsections[1].blocks[0] as { text: string }).text, /Space is no different/);
});

test('finds defined terms', () => {
  assert.deepEqual([...definitions(parseBill(source)).keys()], ['Timed Space', 'Pass']);
});

test('links only the first use of each term, and never the definition itself', () => {
  const wrap = (term: string, match: string) => `[${termId(term)}:${match}]`;
  const used = new Set<string>();
  assert.equal(linkTerms('A Pass doubles a Timed Space; Timed Spaces vary.', ['Timed Space', 'Pass'], used, wrap),
    'A [pass:Pass] doubles a [timed-space:Timed Space]; Timed Spaces vary.');
  assert.equal(linkTerms('“Pass” means <this>.', ['Pass'], new Set(), wrap), '“Pass” means &lt;this&gt;.');
});

test('rejects text before the first section', () => {
  assert.throws(() => parseBill('Stray text.\n\n## SECTION 1. Heading.'));
});

test('highlights the first match of a phrase, escaped, and refuses a missing one', () => {
  assert.equal(highlight('Free &amp; fair, free &amp; fair.', 'free & fair', 'a note'), 'Free &amp; fair, <mark>free &amp; fair</mark>.');
  assert.throws(() => highlight('One car at a time.', 'Two cars', 'note C'), /note C/);
});
