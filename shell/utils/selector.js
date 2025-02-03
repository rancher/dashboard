import { isArray, addObject, findBy } from '@shell/utils/array';
import { get } from '@shell/utils/object';

const parseCache = {};

const OP_MAP = {
  '=':  'In',
  '==': 'In',
  '!=': 'NotIn',
  '<':  'Lt',
  '>':  'Gt',
};

// Parse a labelSelector string
export function parse(labelSelector) {
  // matchLabels:
  // comma-separated list, all rules ANDed together
  // spaces may be encoded as +
  //
  // Equals:      foo = bar
  // Not Equals:  bar != baz
  // Key Exists:  optional.prefix/just-some-key
  // Key Doesn't: !optional.prefix/just-some-key
  // In Set:      environment in (production,qa)
  // Not in Set:  environment notin (production,qa)

  // Convert into matchExpressions, which newer resources support
  // and express the same things
  //
  // Object of:
  // key: optional.prefix/some-key
  // operator: In, NotIn, Exists, or DoesNotExist
  // values:  [array, of, values, even, if, only, one]

  labelSelector = labelSelector.replace(/\+/g, ' ');

  if ( parseCache[labelSelector] ) {
    return parseCache[labelSelector];
  }

  let match;
  const out = [];
  const parens = [];

  // Substitute out all the parenthetical lists because they might have commas in them
  match = labelSelector.match(/\([^)]+\)/g);
  if ( match && match.length ) {
    for ( const str of match ) {
      const val = str.replace(/^\s*\(\s*/, '').replace(/\s*\)\s*$/, '').split(/\s*,\s*/);

      parens.push(val);
      labelSelector = labelSelector.replace(str, ` @${ parens.length - 1 } `);
    }
  }

  const parts = labelSelector.split(/\s*,\s*/).filter((x) => !!x);

  for ( let rule of parts ) {
    rule = rule.trim();

    match = rule.match(/^(.*?)\s+((not\s*)?in)\s+@(\d+)*$/i);

    if ( match ) {
      out.push({
        key:      match[1].trim(),
        operator: match[2].toLowerCase().replace(/\s/g, '') === 'notin' ? 'NotIn' : 'In',
        values:   parens[match[4].trim()],
      });

      continue;
    }

    match = rule.match(/^([^!=]*)\s*(\!=|=|==|>|<)\s*([^!=]*)$/);
    if ( match ) {
      out.push({
        key:      match[1].trim(),
        operator: OP_MAP[match[2]],
        values:   [match[3].trim()],
      });

      continue;
    }

    if ( rule.startsWith('!') ) {
      out.push({
        key:      rule.substr(1).trim(),
        operator: 'DoesNotExist'
      });

      continue;
    }

    out.push({
      key:      rule.trim(),
      operator: 'Exists'
    });
  }

  parseCache[labelSelector] = out;

  return out;
}

// Convert a Selector object to matchExpressions
export function convertSelectorObj(obj) {
  return convert(obj.matchLabels || {}, obj.matchExpressions || []);
}

// Convert matchLabels to matchExpressions
// Optionally combining with an existing set of matchExpressions
export function convert(matchLabelsObj, matchExpressions) {
  const keys = Object.keys(matchLabelsObj || {});
  const out = matchExpressions || [];

  for ( const key of keys ) {
    const value = matchLabelsObj[key];
    const existing = findBy(out, { key, operator: 'In' });

    if ( existing ) {
      addObject(existing.values, value);
    } else {
      out.push({
        key,
        operator: 'In',
        values:   isArray(value) ? value : [value],
      });
    }
  }

  return out;
}

// Convert matchExpressions to matchLabels when possible,
// returning the simplest combination of them.
export function simplify(matchExpressionsInput) {
  const matchLabels = {};
  const matchExpressions = [];

  // Look for keys with more than one "In" expression and disqualify them from simplifying
  const impossible = [];
  const seen = {};

  for ( const expr of matchExpressionsInput ) {
    if ( expr.operator !== 'In' ) {
      continue;
    }

    if ( seen[expr.key] ) {
      addObject(impossible, expr.key);
    } else {
      seen[expr.key] = true;
    }
  }

  for ( const expr of matchExpressionsInput ) {
    if ( expr.operator === 'In' && expr.values.length === 1 && !impossible.includes(expr.key) ) {
      matchLabels[expr.key] = expr.values[0];
    } else {
      matchExpressions.push(Object.assign({}, expr));
    }
  }

  return { matchLabels, matchExpressions };
}

export function matches(obj, selector, labelKey = 'metadata.labels') {
  let rules = [];

  if ( typeof selector === 'string' ) {
    // labelSelector string
    rules = parse(selector);
  } else if ( isArray(selector) ) {
    // Already matchExpression
    rules = selector;
  } else if ( typeof selector === 'object' && selector ) {
    // matchLabels object
    rules = convert(selector);
  } else {
    return false;
  }

  const labels = get(obj, labelKey) || {};

  for ( const rule of rules ) {
    const value = labels[rule.key];
    const asInt = parseInt(value, 10);
    const exists = typeof labels[rule.key] !== 'undefined';

    switch ( rule.operator ) {
    case 'Exists':
      if ( !exists ) {
        return false;
      }
      break;
    case 'DoesNotExist':
      if ( exists ) {
        return false;
      }
      break;
    case 'In':
      // we need to cater empty strings because when creating a label with value = null it's translated into a empty string value ''
      if ( !rule.values.length || !rule.values.includes(value) ) {
        return false;
      }
      break;
    case 'NotIn':
      if ( rule.values.includes(value) ) {
        return false;
      }
      break;
    case 'Lt':
      if ( isNaN(asInt) || asInt >= Math.min.apply(null, rule.values) ) {
        return false;
      }
      break;
    case 'Gt':
      if ( isNaN(asInt) || asInt <= Math.max.apply(null, rule.values) ) {
        return false;
      }
      break;
    }
  }

  return true;
}

export function matching(ary, selector, labelKey) {
  return ary.filter((obj) => matches(obj, selector, labelKey));
}
