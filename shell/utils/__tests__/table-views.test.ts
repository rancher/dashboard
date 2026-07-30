import {
  applyQuery, decodeView, encodeView, fieldsFor, parseQuery, rowsToCsv, valuesInUse
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
      name: 'Need attention', query: 'state:Error', columns: ['name'], labelColumns: ['app'], groupBy: 'namespace'
    };

    expect(decodeView(encodeView(view))).toStrictEqual(view);
  });
});
