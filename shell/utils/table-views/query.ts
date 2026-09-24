/**
 * Table Views - reading the filter query.
 *
 * The query is one line of `field:value` terms, free text and the words that join them. Here it
 * is taken apart: into tokens, into the terms a table can apply, into the coloured runs the box
 * draws, and into the complaints worth making about it. Pure, so the box and the tests see the
 * same answers.
 */

import { LABEL_FIELD_PREFIX, findField } from '@shell/utils/table-views/fields';
import type {
  QueryProblem, QueryProblemKind, QuerySegment, QueryTerm, QueryToken, ViewClause, ViewField, ViewGroup, ViewQuery, ViewTerm
} from '@shell/types/table-views';

/**
 * The words that spell out how two terms combine.
 *
 * Accepted so that a query reads the way someone would write it - `state:active or state:error`
 * parses the same as `state:active state:error`. They carry no meaning of their own: what a
 * query does is decided by its fields (same field OR'd, different fields AND'd, see
 * {@link applyQuery}), and parsing skips the words, so a hand typed `and` between two terms of
 * the same field does not narrow it. Nothing writes them for the user.
 */
export const CONNECTIVES = ['and', 'or'];

/** Spelled out negation, the word form of the `-` and `!` prefixes */
export const NEGATORS = ['not'];

function isConnective(text: string): boolean {
  return CONNECTIVES.includes((text || '').toLowerCase());
}

export function isNegator(text: string): boolean {
  return NEGATORS.includes((text || '').toLowerCase());
}

function isOr(text: string): boolean {
  return (text || '').toLowerCase() === 'or';
}

/**
 * Split a query into tokens, keeping quoted values (`app:"my app"`) together and
 * recording where each token sits so the autocomplete can replace the one being typed.
 */
export function tokenize(query: string): QueryToken[] {
  const out: QueryToken[] = [];
  const str = query || '';
  let i = 0;

  while (i < str.length) {
    while (i < str.length && str[i] === ' ') {
      i++;
    }

    if (i >= str.length) {
      break;
    }

    const start = i;
    let quote: string | null = null;

    while (i < str.length) {
      const char = str[i];

      if (quote) {
        if (char === quote) {
          quote = null;
        }
      } else if (char === '"' || char === `'`) {
        quote = char;
      } else if (char === ' ') {
        break;
      }

      i++;
    }

    out.push({
      start,
      end:  i,
      text: str.substring(start, i)
    });
  }

  return out;
}

function unquote(value: string): string {
  if (value.length > 1 && (value[0] === '"' || value[0] === `'`) && value[value.length - 1] === value[0]) {
    return value.substring(1, value.length - 1);
  }

  return value;
}

export function quoteIfNeeded(value: string): string {
  return /[\s:]/.test(value) ? `"${ value }"` : value;
}

/**
 * Resolve the field named at the start of `text`, if any.
 *
 * A label field's own id contains a colon (`label:app`), so where an ordinary field ends at the
 * first colon a label one ends at the last.
 */
function fieldAt(text: string, fields: ViewField[]): ViewField | null {
  const idx = text.indexOf(':');

  if (idx <= 0) {
    return null;
  }

  const field = findField(fields, text.substring(0, idx));

  if (field) {
    return field;
  }

  if (text.toLowerCase().startsWith(LABEL_FIELD_PREFIX)) {
    return findField(fields, text.substring(0, text.lastIndexOf(':'))) || null;
  }

  return null;
}

/**
 * Read a query as a list of terms and connectives, resolved against this table's fields.
 *
 * A term is a single run of non-space characters, `state:active`. What separates the field from
 * its value on screen is the badge drawn around the value, not a character in the query - so a
 * space always ends the term, and `state: active` is the field with nothing in it followed by
 * the free text `active`.
 */
export function scanQuery(query: string, fields: ViewField[]): QueryTerm[] {
  const raw = tokenize(query || '');
  const out: QueryTerm[] = [];
  // Set by a `not` standing on its own, and spent on the term that follows it
  let pendingNot = false;

  for (let i = 0; i < raw.length; i++) {
    const chunk = raw[i];
    let text = chunk.text;

    if (isConnective(text)) {
      out.push({
        ...chunk, kind: 'connective', negate: '', negated: false, field: null, fieldText: '', value: text, valueStart: chunk.start
      });
      continue;
    }

    if (isNegator(text)) {
      pendingNot = true;
      out.push({
        ...chunk, kind: 'connective', negate: '', negated: false, field: null, fieldText: '', value: text, valueStart: chunk.start
      });
      continue;
    }

    let negate = '';

    if (text.startsWith('-') || text.startsWith('!')) {
      negate = text.substring(0, 1);
      text = text.substring(1);
    }

    const negated = !!negate || pendingNot;

    pendingNot = false;

    const field = fieldAt(text, fields);

    if (!field) {
      out.push({
        ...chunk, kind: 'term', negate, negated, field: null, fieldText: '', value: unquote(text), valueStart: chunk.start + negate.length
      });
      continue;
    }

    const typed = text.substring(field.id.length + 1);

    out.push({
      start:      chunk.start,
      end:        chunk.end,
      text:       chunk.text,
      kind:       'term',
      negate,
      negated,
      field,
      fieldText:  text.substring(0, field.id.length),
      value:      unquote(typed),
      valueStart: chunk.start + negate.length + field.id.length + 1,
    });
  }

  return out;
}

/**
 * Break a query into coloured segments for the input to draw.
 *
 * The segments put back together are the query, character for character, whitespace included.
 *
 * `isKnownValue` decides whether a term's value is one the field actually has, which is what
 * separates a `value` segment from a `value-unknown` one. Left out, every value is taken at face
 * value - callers that have no way to check are no worse off than before.
 */
export function highlightQuery(
  query: string,
  fields: ViewField[],
  isKnownValue?: (fieldId: string, value: string) => boolean
): QuerySegment[] {
  const str = query || '';
  const out: QuerySegment[] = [];
  let at = 0;

  const plain = (end: number) => {
    if (end > at) {
      out.push({ text: str.substring(at, end), kind: 'plain' });
      at = end;
    }
  };

  scanQuery(str, fields).forEach((token) => {
    plain(token.start);

    if (token.kind === 'connective') {
      out.push({ text: token.text, kind: 'connective' });
      at = token.end;

      return;
    }

    if (!token.field) {
      out.push({ text: token.text, kind: 'text' });
      at = token.end;

      return;
    }

    // `-state:` — the negation reads as part of the field
    out.push({ text: str.substring(token.start, token.start + token.negate.length + token.fieldText.length + 1), kind: 'field' });
    at = token.start + token.negate.length + token.fieldText.length + 1;

    // whatever sits between the colon and the value, normally a single space
    plain(token.valueStart);

    if (token.end > at) {
      const known = !isKnownValue || isKnownValue(token.field.id, token.value);

      out.push({ text: str.substring(at, token.end), kind: known ? 'value' : 'value-unknown' });
      at = token.end;
    }
  });

  plain(str.length);

  return out;
}

/**
 * Parse `state:error -namespace:kube-system nginx` into terms.
 *
 * `field:value` only becomes a field term when the field actually exists on this table,
 * otherwise it stays free text (so searching for an image tag still works).
 */
export function parseQuery(query: string, fields: ViewField[]): ViewTerm[] {
  return scanQuery(query, fields)
    // The connectives are there to be read; the fields are what decide how terms combine
    .filter((token) => token.kind === 'term' && !!token.value)
    .map((token) => ({
      field:   token.field ? token.field.id : null,
      value:   token.value,
      negated: token.negated,
    }));
}

/** `and` and `or` join two things. `not` does not, which is why it is allowed to lead. */
function isJoiner(text: string): boolean {
  return CONNECTIVES.includes((text || '').toLowerCase());
}

/** Does this run of text open a quote it never closes? Both marks, as the tokenizer reads both. */
function hasUnbalancedQuote(text: string): boolean {
  let quote: string | null = null;

  for (const char of text || '') {
    if (quote) {
      if (char === quote) {
        quote = null;
      }
    } else if (char === '"' || char === `'`) {
      quote = char;
    }
  }

  return !!quote;
}

/**
 * What is wrong with a query, if anything.
 *
 * Only things that are wrong however the query is read. A value nothing currently matches is not
 * one of them - terms match on containing the text, so half a value is a perfectly good term, and
 * "no rows" already says what there is to say. Nor is an unknown word before a colon: `nginx:1.21`
 * and a mistyped field are the same thing to a parser, and one of them is a reasonable search.
 *
 * Nothing here stops a query running. The table filters by as much of it as it can and this says
 * what it could not use.
 */
export function validateQuery(query: string, fields: ViewField[]): QueryProblem[] {
  const tokens = scanQuery(query || '', fields);
  const problems: QueryProblem[] = [];

  if (!tokens.length) {
    return problems;
  }

  const add = (kind: QueryProblemKind, token: QueryToken, label?: string) => {
    problems.push({
      kind, start: token.start, end: token.end, text: token.text, label
    });
  };

  const hasTerms = tokens.some((token) => token.kind === 'term' && !!token.value);
  const firstConnective = tokens.find((token) => token.kind === 'connective');

  // Operators and nothing to apply them to. Said once - every other rule would fire here too.
  if (!hasTerms && firstConnective) {
    add('noTerms', firstConnective);

    return problems;
  }

  tokens.forEach((token, i) => {
    if (token.kind === 'connective') {
      if (i === 0 && isJoiner(token.text)) {
        add('leadingJoiner', token);
      }

      if (i === tokens.length - 1) {
        add('trailingOperator', token);
      }

      // `and not` and `or not` read fine; it is a joining word after an operator that does not
      if (isJoiner(token.text) && tokens[i - 1]?.kind === 'connective') {
        add('consecutiveOperators', token);
      }

      return;
    }

    if (hasUnbalancedQuote(token.text)) {
      add('unbalancedQuote', token);

      return;
    }

    if (!token.value) {
      if (token.field) {
        add('emptyValue', token, token.field.label || token.field.id);
      } else if (token.negate) {
        add('danglingNegation', token);
      }
    }
  });

  return problems;
}

/**
 * Read a query as what it actually asks for: clauses joined by `or`, each a set of groups
 * joined by `and`.
 *
 * A query with no joining words in it comes back as a single group, which is what every query
 * was treated as before - so nothing already saved changes meaning.
 */
export function parseQueryExpression(query: string, fields: ViewField[]): ViewQuery {
  const clauses: ViewClause[] = [];
  let groups: ViewGroup[] = [];
  let group: ViewGroup = [];

  const endGroup = () => {
    if (group.length) {
      groups.push(group);
      group = [];
    }
  };

  const endClause = () => {
    endGroup();

    if (groups.length) {
      clauses.push({ groups });
      groups = [];
    }
  };

  scanQuery(query || '', fields).forEach((token) => {
    if (token.kind === 'connective') {
      // `not` belongs to the term after it, which scanQuery has already marked - it joins
      // nothing, so it never divides one group from the next
      if (isNegator(token.text)) {
        return;
      }

      if (isOr(token.text)) {
        endClause();
      } else {
        endGroup();
      }

      return;
    }

    // A term still being typed has nothing to match on yet
    if (!token.value) {
      return;
    }

    group.push({
      field:   token.field ? token.field.id : null,
      value:   token.value,
      negated: token.negated,
    });
  });

  endClause();

  return { clauses };
}

/**
 * Replace the token the caret is sitting in with `replacement`
 */
export function replaceToken(query: string, token: QueryToken | null, replacement: string, caret?: number): string {
  if (token) {
    return `${ query.substring(0, token.start) }${ replacement }${ query.substring(token.end) }`;
  }

  // Nothing under the caret means it is sitting in the space between two terms, and what is
  // picked belongs there - not at the end of a query the user may be standing in the middle of.
  if (typeof caret === 'number') {
    const at = Math.max(0, Math.min(caret, query.length));
    const before = query.substring(0, at);
    const prefix = !before || before.endsWith(' ') ? before : `${ before } `;

    return `${ prefix }${ replacement }${ query.substring(at) }`;
  }

  const prefix = query && !query.endsWith(' ') ? `${ query } ` : query || '';

  return `${ prefix }${ replacement }`;
}

/**
 * The term the caret is sitting in, so the autocomplete can replace the whole of it.
 *
 * Without `fields` this falls back to raw chunks, which is enough for callers that only need to
 * know where a word starts and ends.
 */
export function tokenAt(query: string, caret: number, fields?: ViewField[]): QueryToken | null {
  const tokens = fields ? scanQuery(query, fields).filter((token) => token.kind === 'term') : tokenize(query);

  return tokens.find((token) => caret >= token.start && caret <= token.end) || null;
}
