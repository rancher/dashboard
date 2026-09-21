import {
  applyQuery, applyQueryExpression, decodeView, encodeView, fieldsFor, parseQuery,
  parseQueryExpression, queryToServerFilters, replaceToken, rowsToCsv, tokenAt, valuesInUse,
  coreFieldIdsFor, isCoreField, CORE_FIELD_IDS,
  serverPathFor,
  summaryToValues,
  termsToServerFilters
} from '@shell/utils/table-views';

const HEADERS = [
  {
    name: 'name', label: 'Name', value: 'metadata.name'
  },
  {
    name: 'namespace', label: 'Namespace', value: 'metadata.namespace'
  },
  {
    name: 'state', label: 'State', value: 'stateDisplay'
  },
  { name: 'spacer', label: ' ' },
];

const ROWS = [
  {
    stateDisplay: 'Running',
    metadata:     {
      name: 'nginx-a', namespace: 'default', labels: { app: 'nginx' }
    }
  },
  {
    stateDisplay: 'Error',
    metadata:     {
      name: 'nginx-b', namespace: 'default', labels: { app: 'nginx', tier: 'web' }
    }
  },
  {
    stateDisplay: 'Error',
    metadata:     {
      name: 'redis-a', namespace: 'cattle-system', labels: { app: 'redis' }
    }
  },
];

describe('fx: fieldsFor', () => {
  it('includes headers with a label and every label key in use', () => {
    const fields = fieldsFor(HEADERS, ROWS);
    const ids = fields.map((f) => f.id);

    expect(ids).toContain('name');
    expect(ids).toContain('state');
    expect(ids).toContain('label:app');
    expect(ids).toContain('label:tier');
    // Columns without a label aren't useful to filter on
    expect(ids).not.toContain('spacer');
  });
});

describe('fx: parseQuery', () => {
  const fields = fieldsFor(HEADERS, ROWS);

  it('parses field terms, free text and negation', () => {
    expect(parseQuery('state:Error -namespace:cattle nginx', fields)).toStrictEqual([
      {
        field: 'state', value: 'Error', negated: false
      },
      {
        field: 'namespace', value: 'cattle', negated: true
      },
      {
        field: null, value: 'nginx', negated: false
      },
    ]);
  });

  it('keeps quoted values together', () => {
    expect(parseQuery('name:"nginx a"', fields)).toStrictEqual([{
      field: 'name', value: 'nginx a', negated: false
    }]);
  });

  it('handles label fields, which contain a colon themselves', () => {
    expect(parseQuery('label:app:nginx', fields)).toStrictEqual([{
      field: 'label:app', value: 'nginx', negated: false
    }]);
  });

  it('treats an unknown field as free text', () => {
    expect(parseQuery('image:nginx', fields)).toStrictEqual([{
      field: null, value: 'image:nginx', negated: false
    }]);
  });
});

describe('fx: applyQuery', () => {
  const fields = fieldsFor(HEADERS, ROWS);
  const run = (query: string) => applyQuery(ROWS, parseQuery(query, fields), fields).map((r) => r.metadata.name);

  it('ands terms for different fields', () => {
    expect(run('state:Error namespace:default')).toStrictEqual(['nginx-b']);
  });

  it('ors repeated terms for the same field', () => {
    expect(run('namespace:default namespace:cattle-system')).toHaveLength(3);
  });

  it('excludes negated terms', () => {
    expect(run('state:Error -namespace:cattle-system')).toStrictEqual(['nginx-b']);
  });

  it('filters on labels', () => {
    expect(run('label:app:redis')).toStrictEqual(['redis-a']);
  });

  it('searches every field for free text', () => {
    expect(run('redis')).toStrictEqual(['redis-a']);
  });
});

describe('fx: valuesInUse', () => {
  it('returns the values present in the data, most used first', () => {
    const fields = fieldsFor(HEADERS, ROWS);
    const state = fields.find((f) => f.id === 'state')!;

    expect(valuesInUse(ROWS, state)).toStrictEqual([
      { value: 'Error', count: 2 },
      { value: 'Running', count: 1 },
    ]);
  });
});

describe('fx: rowsToCsv', () => {
  it('writes a header row and quotes cells that need it', () => {
    const fields = fieldsFor(HEADERS, ROWS);
    const columns = [
      { label: 'Name', field: fields.find((f) => f.id === 'name')! },
      { label: 'App', field: fields.find((f) => f.id === 'label:app')! },
    ];

    expect(rowsToCsv(ROWS.slice(0, 1), columns)).toBe('Name,App\nnginx-a,nginx');
  });
});

describe('fx: encodeView', () => {
  it('round trips a view through a url safe string', () => {
    const view = {
      name: 'Need attention', query: 'state: error', columns: ['name'], columnOrder: ['name', 'state'], labelColumns: ['app'], groupBy: 'namespace'
    };

    expect(decodeView(encodeView(view))).toStrictEqual(view);
  });
});

describe('core columns', () => {
  it('marks the columns the table depends on as core', () => {
    expect(CORE_FIELD_IDS).toStrictEqual(['state', 'name']);
  });

  it.each([
    ['state', true],
    ['name', true],
    ['age', false],
    ['namespace', false],
    ['label:app', false],
    ['', false],
    [undefined, false],
  ])('isCoreField(%s) is %s', (id, expected) => {
    expect(isCoreField(id as string)).toStrictEqual(expected);
  });
});

describe('serverPathFor', () => {
  it('uses a label key for label fields', () => {
    expect(serverPathFor({
      id: 'label:app', label: 'app', isLabel: true, labelKey: 'app'
    })).toStrictEqual('metadata.labels[app]');
  });

  it('prefers the header search path', () => {
    expect(serverPathFor({
      id: 'name', label: 'Name', isLabel: false, header: { search: 'metadata.name', sort: 'nameSort' }
    })).toStrictEqual('metadata.name');
  });

  it('drops a direction suffix when falling back to sort', () => {
    expect(serverPathFor({
      id: 'age', label: 'Age', isLabel: false, header: { sort: 'metadata.creationTimestamp:desc' }
    })).toStrictEqual('metadata.creationTimestamp');
  });

  it('has no path for a field whose header offers none', () => {
    expect(serverPathFor({
      id: 'restarts', label: 'Restarts', isLabel: false, header: { name: 'restarts' }
    })).toBeNull();
  });
});

describe('summaryToValues', () => {
  const response = {
    summary: [{
      property: 'metadata.namespace',
      counts:   {
        'cattle-system': { total: 5 }, default: { total: 12 }, '': { total: 3 }
      }
    }]
  };

  it('lists the values most used first', () => {
    expect(summaryToValues(response)).toStrictEqual([
      { value: 'default', count: 12 },
      { value: 'cattle-system', count: 5 },
    ]);
  });

  it('caps how many are returned', () => {
    expect(summaryToValues(response, 1)).toStrictEqual([{ value: 'default', count: 12 }]);
  });

  it.each([
    ['no summary', {}],
    ['empty summary', { summary: [] }],
    ['nothing at all', undefined],
  ])('returns nothing for %s', (_name, input) => {
    expect(summaryToValues(input as any)).toStrictEqual([]);
  });
});

describe('fx: termsToServerFilters', () => {
  const FIELDS = [
    {
      id: 'name', label: 'Name', isLabel: false, header: { search: 'metadata.name' }
    },
    {
      id: 'namespace', label: 'Namespace', isLabel: false, header: { search: 'metadata.namespace' }
    },
    {
      id: 'label:app', label: 'app', isLabel: true, labelKey: 'app'
    },
    {
      id: 'label:component', label: 'component', isLabel: true, labelKey: 'component'
    },
  ] as any[];

  const opts = { isAllowed: () => true };
  const pathsOf = (filter: any) => filter.fields.map((f: any) => f.field);

  it('should search every ordinary column for a free text term', () => {
    const { filters, unsupported } = termsToServerFilters([{
      field: null, value: 'nginx', negated: false
    }] as any, FIELDS, opts);

    expect(unsupported).toStrictEqual([]);
    expect(filters).toHaveLength(1);
    expect(pathsOf(filters[0])).toStrictEqual(['metadata.name', 'metadata.namespace']);
  });

  it('should keep label columns out of a free text search', () => {
    // Each metadata.labels[key] term costs the pagination API a join, and OR'ing a handful of
    // them together hangs it - see the comment in termsToServerFilters
    const { filters } = termsToServerFilters([{
      field: null, value: 'nginx', negated: false
    }] as any, FIELDS, opts);

    expect(pathsOf(filters[0]).some((p: string) => p.includes('labels'))).toBe(false);
  });

  it('should still search a label when the term names one', () => {
    const { filters, unsupported } = termsToServerFilters([{
      field: 'label:app', value: 'nginx', negated: false
    }] as any, FIELDS, opts);

    expect(unsupported).toStrictEqual([]);
    expect(filters).toHaveLength(1);
    expect(pathsOf(filters[0])).toStrictEqual(['metadata.labels[app]']);
  });

  it('should report a free text term as unsupported when no column can be searched', () => {
    const terms = [{
      field: null, value: 'nginx', negated: false
    }] as any;
    const { filters, unsupported } = termsToServerFilters(terms, [FIELDS[2]], opts);

    expect(filters).toStrictEqual([]);
    expect(unsupported).toStrictEqual(terms);
  });
});

describe('fx: parseQueryExpression', () => {
  const fields = fieldsFor(HEADERS, ROWS);
  const shape = (query: string) => parseQueryExpression(query, fields)
    .clauses.map((clause) => clause.groups.map((group) => group.map((term) => `${ term.negated ? '!' : '' }${ term.field }:${ term.value }`)));

  it('should read a query with no joining words as one group', () => {
    expect(shape('state:Error name:nginx')).toStrictEqual([[['state:Error', 'name:nginx']]]);
  });

  it('should start a new group at each "and"', () => {
    expect(shape('state:Error and name:nginx')).toStrictEqual([[['state:Error'], ['name:nginx']]]);
  });

  it('should start a new clause at each "or"', () => {
    expect(shape('state:Error or name:nginx')).toStrictEqual([[['state:Error']], [['name:nginx']]]);
  });

  it('should bind "and" tighter than "or"', () => {
    expect(shape('name:a or name:b and state:Error')).toStrictEqual([
      [['name:a']],
      [['name:b'], ['state:Error']],
    ]);
  });

  it('should leave "not" attached to its term rather than dividing groups', () => {
    expect(shape('not state:Error name:nginx')).toStrictEqual([[['!state:Error', 'name:nginx']]]);
  });

  it('should ignore a joining word with nothing after it', () => {
    expect(shape('state:Error and')).toStrictEqual([[['state:Error']]]);
    expect(shape('state:Error or')).toStrictEqual([[['state:Error']]]);
    expect(shape('or state:Error')).toStrictEqual([[['state:Error']]]);
  });
});

describe('fx: applyQueryExpression', () => {
  const fields = fieldsFor(HEADERS, ROWS);
  const names = (query: string) => applyQueryExpression(ROWS, parseQueryExpression(query, fields), fields).map((r) => r.metadata.name);

  it('should keep treating terms written side by side the way it always has', () => {
    // Same field, either matches
    expect(names('state:Running state:Error')).toStrictEqual(['nginx-a', 'nginx-b', 'redis-a']);
    // Different fields, both must match
    expect(names('state:Error name:nginx')).toStrictEqual(['nginx-b']);
  });

  it('should require both sides of an "and"', () => {
    expect(names('state:Running and state:Error')).toStrictEqual([]);
    expect(names('state:Error and name:nginx')).toStrictEqual(['nginx-b']);
  });

  it('should accept either side of an "or"', () => {
    expect(names('name:redis or state:Running')).toStrictEqual(['nginx-a', 'redis-a']);
    expect(names('name:redis or name:nothing')).toStrictEqual(['redis-a']);
  });

  it('should read "a or b and c" as "a or (b and c)"', () => {
    expect(names('name:redis or name:nginx and state:Running')).toStrictEqual(['nginx-a', 'redis-a']);
  });

  it('should negate only the term the "not" belongs to', () => {
    expect(names('not state:Error')).toStrictEqual(['nginx-a']);
    expect(names('not state:Error or name:redis')).toStrictEqual(['nginx-a', 'redis-a']);
  });
});

describe('fx: queryToServerFilters', () => {
  const fields = fieldsFor(HEADERS, ROWS);
  const isAllowed = () => true;
  const build = (query: string) => queryToServerFilters(parseQueryExpression(query, fields), fields, { isAllowed });

  it('should give one param per group when the clauses are AND\'d', () => {
    const { filters } = build('state:Error and name:nginx');

    expect(filters).toHaveLength(2);
    expect(filters[0].fields).toHaveLength(1);
    expect(filters[1].fields).toHaveLength(1);
  });

  it('should OR the fields of a single param when the clauses are OR\'d', () => {
    const { filters } = build('state:Error or name:nginx');

    // The api ORs the fields within one param, so an `or` of two simple sides is one param
    expect(filters).toHaveLength(1);
    expect(filters[0].fields).toHaveLength(2);
  });

  it('should turn "(a and b) or c" inside out into "(a or c) and (b or c)"', () => {
    const { filters } = build('state:Error and name:nginx or namespace:default');

    expect(filters).toHaveLength(2);
    expect(filters[0].fields).toHaveLength(2);
    expect(filters[1].fields).toHaveLength(2);
  });

  it('should filter nothing when one side of an "or" cannot be asked for', () => {
    // Nothing is filterable, so the side that could be asked for must not narrow the list alone
    const { filters, unsupported } = queryToServerFilters(
      parseQueryExpression('state:Error or name:nginx', fields),
      fields,
      { isAllowed: (path: string) => path === 'stateDisplay' }
    );

    expect(filters).toHaveLength(0);
    expect(unsupported.map((t) => t.value)).toStrictEqual(['Error', 'nginx']);
  });
});

describe('fx: replaceToken', () => {
  const fields = fieldsFor(HEADERS, ROWS);
  const at = (query: string, caret: number) => tokenAt(query, caret, fields);

  it('should write over the term the caret is in', () => {
    const query = 'state:Err name:nginx';

    expect(replaceToken(query, at(query, 9), 'state:Error ', 9)).toBe('state:Error  name:nginx');
  });

  it('should splice into the gap the caret is standing in, not the end of the query', () => {
    const query = 'state:Error  name:nginx';
    const caret = 12;

    expect(at(query, caret)).toBeNull();
    expect(replaceToken(query, null, 'and ', caret)).toBe('state:Error and  name:nginx');
  });

  it('should keep a joining word off the term in front of it', () => {
    // The caret follows `or`, which is not a term, so nothing is under it - and pasting straight
    // in would read as `ornot`
    const query = 'state:Error or name:nginx';
    // Just past the `r` of `or`
    const caret = 14;

    expect(replaceToken(query, null, 'not ', caret)).toBe('state:Error or not  name:nginx');
  });

  it('should still append when no caret is given', () => {
    expect(replaceToken('state:Error', null, 'name:')).toBe('state:Error name:');
  });
});

describe('fx: coreFieldIdsFor', () => {
  it('should hold on to state and name where they lead the table', () => {
    expect(coreFieldIdsFor(['state', 'name', 'namespace', 'age'])).toStrictEqual(['state', 'name']);
  });

  it('should hold on to only what leads, not what appears later', () => {
    // An events list leads with its state and carries a name much further along
    expect(coreFieldIdsFor(['state', 'lastseen', 'type', 'name'])).toStrictEqual(['state']);
  });

  it('should hold on to the first column when nothing familiar leads', () => {
    // The events on a detail page lead with when they were last seen
    expect(coreFieldIdsFor(['lastseen', 'type', 'reason', 'name', 'state'])).toStrictEqual(['lastseen']);
  });

  it('should hold on to nothing when there are no columns', () => {
    expect(coreFieldIdsFor([])).toStrictEqual([]);
    expect(coreFieldIdsFor()).toStrictEqual([]);
  });
});
