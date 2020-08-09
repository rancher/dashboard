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

    match = rule.match(/^(.*)\s+((not)?in)\s+@(\d+)*$/i);

    if ( match ) {
      out.push({
        key:      match[1].trim(),
        operator: match[2].toLowerCase().trim() === 'notin' ? 'NotIn' : 'In',
        values:   parens[match[4].trim()],
      });

      continue;
    }

    match = rule.match(/^([^!]*)\s*(\!?)\s*=\s*(.*)$/);
    if ( match ) {
      out.push({
        key:      match[1].trim(),
        operator: match[2] === '!' ? 'NotIn' : 'In',
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

  return out;
}

export function matches(obj, selector) {
  // @TODO implement me
  return false;
}
