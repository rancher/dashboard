import {
  applyQuery, applyQueryExpression, fieldsFor, parseQuery,
  parseQueryExpression, queryToServerFilters, replaceToken, rowsToCsv, tokenAt, validateQuery, valuesInUse,
  coreFieldIdsFor, CORE_FIELD_IDS,
  moveInOrder,
  serverPathFor,
  summaryToValues,
  dateBuckets,
  dateText,
  stringifyValue,
  termsToServerFilters
} from '@shell/utils/table-views';
import type { TableViewField } from '@shell/types/table-views';
import type { PaginationParamFilter } from '@shell/types/store/pagination.types';

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

/**
 * The same columns as a server side paginated list defines them.
 *
 * Note `state`: the list above draws it from `stateDisplay` ("Running"), while the api filters
 * `metadata.state.name` ("running"). Only these definitions can be asked of the api, which is
 * why a field carries both and `serverPathFor` reads this one.
 */
const PAGINATION_HEADERS = [
  {
    name: 'name', label: 'Name', value: 'metadata.name', search: 'metadata.name'
  },
  {
    name: 'namespace', label: 'Namespace', value: 'metadata.namespace', search: 'metadata.namespace'
  },
  {
    name: 'state', label: 'State', value: 'stateDisplay', search: 'metadata.state.name'
  },
  { name: 'spacer', label: ' ' },
];

interface Row {
  stateDisplay: string;
  metadata: { name: string, namespace: string, labels: Record<string, string> };
}

const ROWS: Row[] = [
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

describe('core columns', () => {
  it('marks the columns the table depends on as core', () => {
    expect(CORE_FIELD_IDS).toStrictEqual(['state', 'name']);
  });
});

describe('moveInOrder', () => {
  it('lifts an entry out and puts it back where it was dropped', () => {
    expect(moveInOrder(['a', 'b', 'c', 'd'], 0, 2)).toStrictEqual(['b', 'c', 'a', 'd']);
    expect(moveInOrder(['a', 'b', 'c', 'd'], 3, 1)).toStrictEqual(['a', 'd', 'b', 'c']);
  });

  it('keeps every entry, and leaves the original alone', () => {
    const order = ['a', 'b', 'c'];

    expect(moveInOrder(order, 2, 0)).toHaveLength(3);
    expect(order).toStrictEqual(['a', 'b', 'c']);
  });

  it('does nothing when there is nowhere to move to', () => {
    expect(moveInOrder(['a', 'b'], 1, 1)).toStrictEqual(['a', 'b']);
    expect(moveInOrder(['a', 'b'], -1, 0)).toStrictEqual(['a', 'b']);
    expect(moveInOrder(['a', 'b'], 0, -1)).toStrictEqual(['a', 'b']);
    expect(moveInOrder(['a', 'b'], 5, 0)).toStrictEqual(['a', 'b']);
  });
});

describe('serverPathFor', () => {
  it('uses a label key for label fields', () => {
    expect(serverPathFor({
      id: 'label:app', label: 'app', isLabel: true, labelKey: 'app'
    })).toStrictEqual('metadata.labels[app]');
  });

  it('uses the search path the pagination api definition names', () => {
    expect(serverPathFor({
      id:               'name',
      label:            'Name',
      isLabel:          false,
      header:           { value: 'nameDisplay', sort: 'nameSort' },
      paginationHeader: { search: 'metadata.name', sort: 'metadata.name' },
    })).toStrictEqual('metadata.name');
  });

  it('has no path when the list is not paginated', () => {
    // No pagination definition is the list saying it cannot be filtered server side at all
    expect(serverPathFor({
      id: 'name', label: 'Name', isLabel: false, header: { search: 'metadata.name' }
    })).toBeNull();
  });

  it('ignores the display definition even when it names a search', () => {
    // The two can disagree, and only the pagination one is what the api answers to
    expect(serverPathFor({
      id:               'state',
      label:            'State',
      isLabel:          false,
      header:           { search: 'stateDisplay' },
      paginationHeader: { value: 'stateDisplay' },
    })).toBeNull();
  });

  it('filters a column that is not searched, when a term names it, on the path it sorts by', () => {
    expect(serverPathFor({
      id:               'age',
      label:            'Age',
      isLabel:          false,
      paginationHeader: {
        value: 'metadata.creationTimestamp', sort: 'metadata.creationTimestamp:desc', search: false
      },
    })).toBe('metadata.creationTimestamp');
  });

  it('filters a column that names no search on the path it sorts by, which the api has indexed', () => {
    expect(serverPathFor({
      id: 'cpu', label: 'CPU', isLabel: false, paginationHeader: { sort: ['status.allocatable.cpuRaw', 'metadata.name'] }
    })).toStrictEqual('status.allocatable.cpuRaw');

    expect(serverPathFor({
      id: 'age', label: 'Age', isLabel: false, paginationHeader: { sort: 'metadata.creationTimestamp:desc' }
    })).toStrictEqual('metadata.creationTimestamp');
  });

  it('keeps only the paths a search list actually names', () => {
    expect(serverPathFor({
      id: 'name', label: 'Name', isLabel: false, paginationHeader: { search: ['', 'spec.displayName'] }
    })).toStrictEqual(['spec.displayName']);

    expect(serverPathFor({
      id: 'cpu', label: 'CPU', isLabel: false, paginationHeader: { search: [''] }
    })).toBeNull();

    expect(serverPathFor({
      id: 'cpu', label: 'CPU', isLabel: false, paginationHeader: { search: [''], sort: 'status.allocatable.cpuRaw' }
    })).toStrictEqual('status.allocatable.cpuRaw');
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
    expect(summaryToValues(input)).toStrictEqual([]);
  });
});

describe('fx: termsToServerFilters', () => {
  const FIELDS: TableViewField[] = [
    {
      id: 'name', label: 'Name', isLabel: false, paginationHeader: { search: 'metadata.name' }
    },
    {
      id: 'namespace', label: 'Namespace', isLabel: false, paginationHeader: { search: 'metadata.namespace' }
    },
    {
      id: 'label:app', label: 'app', isLabel: true, labelKey: 'app'
    },
    {
      id: 'label:component', label: 'component', isLabel: true, labelKey: 'component'
    },
  ];

  const pathsOf = (filter: PaginationParamFilter) => filter.fields.map((f) => f.field);

  it('should read a field named twice as either value, each a partial match - as `or` does', () => {
    const { filters } = termsToServerFilters([
      {
        field: 'namespace', value: 'kube', negated: false
      },
      {
        field: 'namespace', value: 'default', negated: false
      },
    ], FIELDS);

    expect(filters).toHaveLength(1);
    expect(filters[0].fields.map((f) => `${ f.field }~${ f.value }:${ f.equality }`)).toStrictEqual([
      'metadata.namespace~kube:~', 'metadata.namespace~default:~'
    ]);
  });

  it('should keep out every value of a field negated twice, each a partial match', () => {
    const { filters } = termsToServerFilters([
      {
        field: 'namespace', value: 'kube', negated: true
      },
      {
        field: 'namespace', value: 'default', negated: true
      },
    ], FIELDS);

    expect(filters.map((f) => f.fields.map((x) => `${ x.value }:${ x.equality }`).join())).toStrictEqual(['kube:!~', 'default:!~']);
  });

  it('should leave a column that is not searched out of free text, and filter it when named', () => {
    const age: TableViewField = {
      id: 'age', label: 'Age', isLabel: false, paginationHeader: { sort: 'metadata.creationTimestamp', search: false }
    };
    const free = termsToServerFilters([{
      field: null, value: '2026', negated: false
    }], [...FIELDS, age]);
    const named = termsToServerFilters([{
      field: 'age', value: '2026-09', negated: false
    }], [...FIELDS, age]);

    expect(pathsOf(free.filters[0])).not.toContain('metadata.creationTimestamp');
    expect(named.unsupported).toStrictEqual([]);
    expect(pathsOf(named.filters[0])).toStrictEqual(['metadata.creationTimestamp']);
  });

  it('should search every ordinary column for a free text term', () => {
    const { filters, unsupported } = termsToServerFilters([{
      field: null, value: 'nginx', negated: false
    }], FIELDS);

    expect(unsupported).toStrictEqual([]);
    expect(filters).toHaveLength(1);
    expect(pathsOf(filters[0])).toStrictEqual(['metadata.name', 'metadata.namespace']);
  });

  it('should keep label columns out of a free text search', () => {
    // Each metadata.labels[key] term costs the pagination API a join, and OR'ing a handful of
    // them together hangs it - see the comment in termsToServerFilters
    const { filters } = termsToServerFilters([{
      field: null, value: 'nginx', negated: false
    }], FIELDS);

    expect(pathsOf(filters[0]).some((p) => p?.includes('labels'))).toBe(false);
  });

  it('should still search a label when the term names one', () => {
    const { filters, unsupported } = termsToServerFilters([{
      field: 'label:app', value: 'nginx', negated: false
    }], FIELDS);

    expect(unsupported).toStrictEqual([]);
    expect(filters).toHaveLength(1);
    expect(pathsOf(filters[0])).toStrictEqual(['metadata.labels[app]']);
  });

  it('should report a free text term as unsupported when no column can be searched', () => {
    const terms = [{
      field: null, value: 'nginx', negated: false
    }];
    const { filters, unsupported } = termsToServerFilters(terms, [FIELDS[2]]);

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
  // Server filters only exist for a paginated list, so the fields carry the pagination headers
  const fields = fieldsFor(HEADERS, ROWS, undefined, PAGINATION_HEADERS);
  const build = (query: string) => queryToServerFilters(parseQueryExpression(query, fields), fields);

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
    // Only state has a paginated definition, so name cannot be asked of the api - and the side
    // that could be must not narrow the list alone
    const stateOnly = fieldsFor(HEADERS, ROWS, undefined, PAGINATION_HEADERS.filter((header) => header.name === 'state'));
    const { filters, unsupported } = queryToServerFilters(parseQueryExpression('state:Error or name:nginx', stateOnly), stateOnly);

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

  it('should hold on to the column the table is ordered by', () => {
    // An events list leads with its state and is ordered by when each was last seen
    expect(coreFieldIdsFor(['state', 'lastseen', 'type'], 'lastseen')).toStrictEqual(['state', 'lastseen']);
  });

  it('should not repeat a sorted column that is already held', () => {
    expect(coreFieldIdsFor(['state', 'name', 'age'], 'name')).toStrictEqual(['state', 'name']);
    expect(coreFieldIdsFor(['lastseen', 'type'], 'lastseen')).toStrictEqual(['lastseen']);
  });

  it('should ignore a sorted column the table does not show', () => {
    expect(coreFieldIdsFor(['state', 'name'], 'cpu')).toStrictEqual(['state', 'name']);
  });
});

describe('fx: validateQuery', () => {
  const fields = fieldsFor(HEADERS, ROWS);
  const kinds = (query: string) => validateQuery(query, fields).map((p) => p.kind);

  it('should find nothing wrong with a query that reads', () => {
    expect(kinds('state:Error name:nginx')).toStrictEqual([]);
    expect(kinds('state:Error and not name:nginx')).toStrictEqual([]);
    expect(kinds('not state:Error or name:nginx')).toStrictEqual([]);
    expect(kinds('')).toStrictEqual([]);
    expect(kinds('nginx')).toStrictEqual([]);
  });

  it('should report a field with nothing to match', () => {
    expect(kinds('state:')).toStrictEqual(['emptyValue']);
    expect(kinds('state:""')).toStrictEqual(['emptyValue']);
    expect(kinds('-state:')).toStrictEqual(['emptyValue']);
    expect(validateQuery('state:', fields)[0].label).toBe('State');
  });

  it('should report an operator with nothing after it', () => {
    expect(kinds('state:Error and')).toStrictEqual(['trailingOperator']);
    expect(kinds('state:Error or')).toStrictEqual(['trailingOperator']);
    expect(kinds('state:Error not')).toStrictEqual(['trailingOperator']);
  });

  it('should report a joining word with nothing before it', () => {
    expect(kinds('and state:Error')).toStrictEqual(['leadingJoiner']);
    expect(kinds('or state:Error')).toStrictEqual(['leadingJoiner']);
  });

  it('should let a query open with not, which joins nothing', () => {
    expect(kinds('not state:Error')).toStrictEqual([]);
  });

  it('should report a joining word straight after another operator', () => {
    expect(kinds('state:Error and or name:nginx')).toStrictEqual(['consecutiveOperators']);
    expect(kinds('state:Error or and name:nginx')).toStrictEqual(['consecutiveOperators']);
    expect(kinds('not and state:Error')).toStrictEqual(['consecutiveOperators']);
    expect(kinds('not or state:Error')).toStrictEqual(['consecutiveOperators']);
  });

  it('should accept an operator followed by not, which reads', () => {
    expect(kinds('state:Error and not name:nginx')).toStrictEqual([]);
    expect(kinds('state:Error or not name:nginx')).toStrictEqual([]);
  });

  it('should report a negation with nothing to negate', () => {
    expect(kinds('state:Error -')).toStrictEqual(['danglingNegation']);
    expect(kinds('! state:Error')).toStrictEqual(['danglingNegation']);
  });

  it('should report a quote that never closes', () => {
    expect(kinds('name:"unclosed')).toStrictEqual(['unbalancedQuote']);
    expect(kinds(`name:'unclosed`)).toStrictEqual(['unbalancedQuote']);
    expect(kinds('name:"closed"')).toStrictEqual([]);
  });

  it('should say only that there is nothing to filter by when there are no terms', () => {
    expect(kinds('and')).toStrictEqual(['noTerms']);
    expect(kinds('not')).toStrictEqual(['noTerms']);
    expect(kinds('and or')).toStrictEqual(['noTerms']);
  });

  it('should point at where the problem is', () => {
    const [problem] = validateQuery('state:Error and', fields);

    expect('state:Error and'.substring(problem.start, problem.end)).toBe('and');
  });
});

describe('dateBuckets', () => {
  const at = (value: string, count = 1) => ({ value, count });

  it('should roll timestamps up into months, newest first, each with its count', () => {
    expect(dateBuckets([at('2026-09-28T19:02:29Z', 2), at('2026-09-01T00:00:00Z'), at('2026-08-15T10:00:00Z')])).toStrictEqual([
      at('2026-09', 3), at('2026-08', 1)
    ]);
  });

  it('should read epoch milliseconds as the dates they are, and zero as none', () => {
    expect(dateBuckets([at(String(Date.UTC(2026, 8, 3))), at('0', 5)])).toStrictEqual([at('2026-09', 1)]);
  });

  it('should put the years above the months when there is more than one', () => {
    expect(dateBuckets([at('2026-01-02T00:00:00Z'), at('2025-12-31T00:00:00Z', 4)])).toStrictEqual([
      at('2026', 1), at('2025', 4), at('2026-01', 1), at('2025-12', 4)
    ]);
  });

  it('should leave out anything that is not a timestamp', () => {
    expect(dateBuckets([at('5 minutes ago'), at('')])).toStrictEqual([]);
  });
});

describe('dateText', () => {
  it.each([
    ['an ISO timestamp as it is', '2026-09-28T19:02:29Z', '2026-09-28T19:02:29Z'],
    ['epoch milliseconds as an ISO timestamp', Date.UTC(2026, 8, 28, 19, 2, 29), '2026-09-28T19:02:29.000Z'],
    ['zero, the models\' "none", as nothing', 0, ''],
    ['anything else as it reads', '23m', '23m'],
    ['a Date as an ISO timestamp', new Date(Date.UTC(2035, 0, 2)), '2035-01-02T00:00:00.000Z'],
  ])('should give %s', (_, value, expected) => {
    expect(dateText(value)).toBe(expected);
  });
});

describe('dates in fields and filters', () => {
  const at = (ms: number) => ({ metadata: { name: `${ ms }` }, lastLogin: ms });
  const headers = [
    {
      name: 'name', label: 'Name', value: 'metadata.name'
    },
    {
      name: 'user-last-login', label: 'Last Login', value: 'lastLogin', sort: 'lastLogin', formatter: 'LiveDate'
    },
    {
      name: 'age', label: 'Age', value: 'creationTimestamp', formatter: 'LiveDate'
    },
    {
      name: 'seen', label: 'Seen', value: 'seen'
    },
    // Text that reads as time - relative, like an event's last seen - is not a date
    {
      name: 'lastSeen', label: 'Last Seen', value: 'lastSeenText'
    },
  ];
  const rows = [
    {
      ...at(Date.UTC(2026, 8, 3)), seen: '2026-09-03T00:00:00Z', lastSeenText: '23m'
    },
    {
      ...at(Date.UTC(2025, 11, 1)), seen: '2025-12-01T00:00:00Z', lastSeenText: '2h'
    },
    {
      ...at(0), seen: '2025-12-02T00:00:00Z', lastSeenText: '5d'
    },
  ];
  const fields = fieldsFor(headers, rows);
  const dates = fields.filter((field) => field.isDate).map((field) => field.id);

  it('should know a date by how it is drawn or by holding timestamps, and not by its name', () => {
    expect(dates).toStrictEqual(['user-last-login', 'age', 'seen']);
  });

  it('should match a typed date against epoch milliseconds, and never match an empty one', () => {
    const names = (query: string) => applyQuery(rows, parseQuery(query, fields), fields).map((r) => r.metadata.name);

    expect(names('user-last-login:2026-09')).toStrictEqual([`${ Date.UTC(2026, 8, 3) }`]);
    expect(names('user-last-login:2025')).toStrictEqual([`${ Date.UTC(2025, 11, 1) }`]);
    // The row that never logged in holds 0, which must not read as the first of January 1970
    expect(names('user-last-login:1970')).toStrictEqual([]);
  });
});

describe('stringifyValue with dates', () => {
  it('should write a Date as its ISO timestamp, so an export or a filter has something to read', () => {
    expect(stringifyValue(new Date(Date.UTC(2035, 0, 2)))).toBe('2035-01-02T00:00:00.000Z');
    expect(stringifyValue(new Date('not a date'))).toBe('');
  });
});
