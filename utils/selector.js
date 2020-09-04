import { isArray } from '@/utils/array';

const parseCache = {};

const OP_MAP = {
  '=':  'In',
  '==': 'In',
  '!=': 'NotIn',
  '<':  'Lt',
  '>':  'Gt',
};

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

  const parts = labelSelector.split(/\s*,\s*/).filter(x => !!x);

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

export function convert(matchLabelsObj) {
  const keys = Object.keys(matchLabelsObj || {});
  const out = [];

  for ( const key of keys ) {
    out.push({
      key,
      operator: 'In',
      values:   [matchLabelsObj[key]]
    });
  }

  return out;
}

export function matches(obj, selector) {
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

  const labels = obj?.metadata?.labels || {};

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
      if ( !value || (rule.values.length && !rule.values.includes(value)) ) {
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

export function matching(ary, selector) {
  return ary.filter(obj => matches(obj, selector));
}
