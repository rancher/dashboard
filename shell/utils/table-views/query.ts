
import { LABEL_FIELD_PREFIX, findField } from '@shell/utils/table-views/fields';
import type {
  TableViewQueryProblem, TableViewQueryProblemKind, TableViewQuerySegment, TableViewQueryTerm, TableViewQueryToken, TableViewClause, TableViewField, TableViewGroup, TableViewQuery, TableViewTerm
} from '@shell/types/table-views';

/**
 * Accepted so a query reads naturally, but skipped when parsing: how terms combine is decided by
 * their fields
 */
export const CONNECTIVES = ['and', 'or'];

export const NEGATORS = ['not'];

/** `and` or `or`. `not` is a connective token too, but joins nothing, so it may lead */
function isJoiner(text: string): boolean {
  return !!text && CONNECTIVES.includes(text.toLowerCase());
}

export function isNegator(text: string): boolean {
  return !!text && NEGATORS.includes(text.toLowerCase());
}

function isOr(text: string): boolean {
  return !!text && text.toLowerCase() === 'or';
}

/** Split a query into tokens, keeping quoted values together and recording where each sits */
export function tokenize(query: string): TableViewQueryToken[] {
  const out: TableViewQueryToken[] = [];
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

/** A label field's id contains a colon (`label:app`), so it ends at the last colon rather than the first */
function fieldAt(text: string, fields: TableViewField[]): TableViewField | null {
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
 * A query as terms and connectives. A space always ends a term, so `state: active` is an empty
 * field then free text
 */
export function scanQuery(query: string, fields: TableViewField[]): TableViewQueryTerm[] {
  const raw = tokenize(query || '');
  const out: TableViewQueryTerm[] = [];
  let pendingNot = false;

  for (let i = 0; i < raw.length; i++) {
    const chunk = raw[i];
    let text = chunk.text;

    if (isJoiner(text)) {
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
 * A query as coloured segments that join back into it exactly. Without `isKnownValue` every value
 * counts as known
 */
export function highlightQuery(
  query: string,
  fields: TableViewField[],
  isKnownValue?: (fieldId: string, value: string) => boolean
): TableViewQuerySegment[] {
  const str = query || '';
  const out: TableViewQuerySegment[] = [];
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

    out.push({ text: str.substring(token.start, token.start + token.negate.length + token.fieldText.length + 1), kind: 'field' });
    at = token.start + token.negate.length + token.fieldText.length + 1;

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
 * Parse a query into terms. `field:value` is only a field term when the field exists, so
 * `nginx:1.21` stays free text
 */
export function parseQuery(query: string, fields: TableViewField[]): TableViewTerm[] {
  return scanQuery(query, fields)
    .filter((token) => token.kind === 'term' && !!token.value)
    .map((token) => ({
      field:   token.field ? token.field.id : null,
      value:   token.value,
      negated: token.negated,
    }));
}

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
 * What is wrong with a query however it is read. Unknown values and fields are not problems: both
 * can be reasonable searches
 */
export function validateQuery(query: string, fields: TableViewField[]): TableViewQueryProblem[] {
  const tokens = scanQuery(query || '', fields);
  const problems: TableViewQueryProblem[] = [];

  if (!tokens.length) {
    return problems;
  }

  const add = (kind: TableViewQueryProblemKind, token: TableViewQueryToken, label?: string) => {
    problems.push({
      kind, start: token.start, end: token.end, text: token.text, label
    });
  };

  const hasTerms = tokens.some((token) => token.kind === 'term' && !!token.value);
  const firstConnective = tokens.find((token) => token.kind === 'connective');

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

/** A query as clauses joined by `or`, each a set of groups joined by `and` */
export function parseQueryExpression(query: string, fields: TableViewField[]): TableViewQuery {
  const clauses: TableViewClause[] = [];
  let groups: TableViewGroup[] = [];
  let group: TableViewGroup = [];

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
      // `not` belongs to the next term, which scanQuery has already marked
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

export function replaceToken(query: string, token: TableViewQueryToken | null, replacement: string, caret?: number): string {
  if (token) {
    return `${ query.substring(0, token.start) }${ replacement }${ query.substring(token.end) }`;
  }

  // With nothing under the caret, insert at the caret rather than at the end
  if (typeof caret === 'number') {
    const at = Math.max(0, Math.min(caret, query.length));
    const before = query.substring(0, at);
    const prefix = !before || before.endsWith(' ') ? before : `${ before } `;

    return `${ prefix }${ replacement }${ query.substring(at) }`;
  }

  const prefix = query && !query.endsWith(' ') ? `${ query } ` : query || '';

  return `${ prefix }${ replacement }`;
}

/** The term the caret is in. Without `fields`, raw chunks */
export function tokenAt(query: string, caret: number, fields: TableViewField[]): TableViewQueryTerm | null;
export function tokenAt(query: string, caret: number): TableViewQueryToken | null;
export function tokenAt(query: string, caret: number, fields?: TableViewField[]): TableViewQueryToken | null {
  const tokens = fields ? scanQuery(query, fields).filter((token) => token.kind === 'term') : tokenize(query);

  return tokens.find((token) => caret >= token.start && caret <= token.end) || null;
}
