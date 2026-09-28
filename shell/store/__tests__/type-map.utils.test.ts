import {
  conditionalDepaginate,
  configureConditionalDepaginate,
  headerFromSchemaCol,
  rowValueGetter,
} from '../type-map.utils';

const makeGetters = (overrides: any = {}) => ({
  'i18n/exists': jest.fn(() => false),
  'i18n/t':      jest.fn((key: string) => key),
  currentStore:  jest.fn(() => 'cluster'),
  'cluster/all': jest.fn(() => []),
  ...overrides,
});

const makeCol = (overrides: any = {}) => ({
  description: '',
  field:       '$.metadata.name',
  format:      '',
  name:        'Name',
  priority:    0,
  type:        'string',
  ...overrides,
});

const makeAgeColumn = () => ({
  name:  'age',
  label: 'Age',
  value: 'metadata.creationTimestamp',
  sort:  ['metadata.creationTimestamp'],
});

describe('rowValueGetter', () => {
  describe('fields matching $.metadata.fields[N] pattern', () => {
    it.each([
      {
        desc:          'returns function accessing index 0',
        field:         '$.metadata.fields[0]',
        asFn:          true as const,
        expectedValue: { metadata: { fields: ['first', 'second'] } },
        expectedIdx:   0,
      },
      {
        desc:          'returns function accessing index 2',
        field:         '$.metadata.fields[2]',
        asFn:          true as const,
        expectedValue: { metadata: { fields: ['a', 'b', 'c'] } },
        expectedIdx:   2,
      },
    ])('$desc', ({
      field, asFn, expectedValue, expectedIdx,
    }) => {
      const getter = rowValueGetter(makeCol({ field }), asFn) as (row: any) => any;

      expect(typeof getter).toStrictEqual('function');
      expect(getter(expectedValue)).toStrictEqual(expectedValue.metadata.fields[expectedIdx]);
    });

    it.each([
      {
        desc:     'returns string path for index 0',
        field:    '$.metadata.fields[0]',
        asFn:     false as const,
        expected: 'metadata.fields.0',
      },
      {
        desc:     'returns string path for index 3',
        field:    '$.metadata.fields[3]',
        asFn:     false as const,
        expected: 'metadata.fields.3',
      },
    ])('$desc', ({ field, asFn, expected }) => {
      expect(rowValueGetter(makeCol({ field }), asFn)).toStrictEqual(expected);
    });

    it('returns undefined when row has no fields array', () => {
      const getter = rowValueGetter(makeCol({ field: '$.metadata.fields[0]' }), true) as (row: any) => any;

      expect(getter({})).toBeUndefined();
    });

    it('returns undefined when metadata is missing', () => {
      const getter = rowValueGetter(makeCol({ field: '$.metadata.fields[1]' }), true) as (row: any) => any;

      expect(getter({ other: 'data' })).toBeUndefined();
    });
  });

  describe('fields starting with . (dot-prefixed)', () => {
    it('prepends $ to dot-prefixed fields', () => {
      const result = rowValueGetter(makeCol({ field: '.metadata.name' }), false);

      expect(result).toStrictEqual('$.metadata.name');
    });

    it('does not modify fields already starting with $', () => {
      const result = rowValueGetter(makeCol({ field: '$.metadata.name' }), false);

      expect(result).toStrictEqual('$.metadata.name');
    });
  });

  describe('fields with escaped dots (rewriteJsonPath)', () => {
    it.each([
      {
        desc:     'rewrites single escaped dot in label key',
        field:    '$.metadata.labels.topology\\.kubernetes\\.io/zone',
        expected: '$.metadata.labels.["topology.kubernetes.io/zone"]',
      },
      {
        desc:     'rewrites escaped dot in annotation key',
        field:    '$.metadata.annotations.cattle\\.io/hash',
        expected: '$.metadata.annotations.["cattle.io/hash"]',
      },
    ])('$desc', ({ field, expected }) => {
      expect(rowValueGetter(makeCol({ field }), false)).toStrictEqual(expected);
    });

    it('returns path unchanged when no escaped dots present', () => {
      const field = '$.metadata.labels.app';

      expect(rowValueGetter(makeCol({ field }), false)).toStrictEqual(field);
    });
  });
});

describe('conditionalDepaginate', () => {
  it.each([
    {
      desc:       'returns true when depaginate is boolean true',
      depaginate: true,
      args:       undefined,
      expected:   true,
    },
    {
      desc:       'returns false when depaginate is boolean false',
      depaginate: false,
      args:       undefined,
      expected:   false,
    },
    {
      desc:       'returns undefined when depaginate is undefined',
      depaginate: undefined,
      args:       undefined,
      expected:   undefined,
    },
  ])('$desc', ({ depaginate, args, expected }) => {
    expect(conditionalDepaginate(depaginate as any, args)).toStrictEqual(expected);
  });

  it('calls function with args and returns its result when args are provided', () => {
    const fn = jest.fn(() => true);
    const args = { ctx: { rootGetters: {} as any }, args: { type: 'pod', opt: {} } };

    const result = conditionalDepaginate(fn, args);

    expect(fn).toHaveBeenCalledWith(args);
    expect(result).toStrictEqual(true);
  });

  it('returns false when depaginate is a function but no args are provided', () => {
    const fn = jest.fn(() => true);

    expect(conditionalDepaginate(fn, undefined)).toStrictEqual(false);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('configureConditionalDepaginate', () => {
  const makeRootGetters = (resourceCount: number | undefined, type: string, store = 'cluster') => {
    const counts: any = {};

    if (resourceCount !== undefined) {
      counts[type] = { summary: { count: resourceCount } };
    }

    return {
      currentStore:       jest.fn(() => store),
      [`${ store }/all`]: jest.fn(() => [{ counts }]),
    };
  };

  it('returns true when resource count is below maxResourceCount', () => {
    const type = 'pod';
    const rootGetters = makeRootGetters(50, type) as any;
    const fn = configureConditionalDepaginate({ maxResourceCount: 100, isNorman: false });
    const result = fn({
      ctx:  { rootGetters },
      args: { type, opt: {} },
    });

    expect(result).toStrictEqual(true);
  });

  it('returns false when resource count equals maxResourceCount', () => {
    const type = 'pod';
    const rootGetters = makeRootGetters(100, type) as any;
    const fn = configureConditionalDepaginate({ maxResourceCount: 100, isNorman: false });
    const result = fn({
      ctx:  { rootGetters },
      args: { type, opt: {} },
    });

    expect(result).toStrictEqual(false);
  });

  it('returns false when resource count exceeds maxResourceCount', () => {
    const type = 'pod';
    const rootGetters = makeRootGetters(200, type) as any;
    const fn = configureConditionalDepaginate({ maxResourceCount: 100, isNorman: false });
    const result = fn({
      ctx:  { rootGetters },
      args: { type, opt: {} },
    });

    expect(result).toStrictEqual(false);
  });

  it('returns false when resource count is undefined', () => {
    const type = 'pod';
    const rootGetters = makeRootGetters(undefined, type) as any;
    const fn = configureConditionalDepaginate({ maxResourceCount: 100, isNorman: false });
    const result = fn({
      ctx:  { rootGetters },
      args: { type, opt: {} },
    });

    expect(result).toStrictEqual(false);
  });

  it('uses management.cattle.io. prefix for Norman types', () => {
    const type = 'node';
    const normanType = `management.cattle.io.${ type }`;
    const rootGetters = makeRootGetters(5, normanType) as any;
    const fn = configureConditionalDepaginate({ maxResourceCount: 100, isNorman: true });
    const result = fn({
      ctx:  { rootGetters },
      args: { type, opt: {} },
    });

    expect(result).toStrictEqual(true);
  });
});

describe('headerFromSchemaCol', () => {
  describe('age column shortcut', () => {
    it.each([
      {
        desc: 'returns ageColumn when format is empty and name is age',
        col:  makeCol({
          name:   'age',
          format: '',
        }),
      },
      {
        desc: 'returns ageColumn when format is date and name is age',
        col:  makeCol({
          name:   'age',
          format: 'date',
        }),
      },
      {
        desc: 'returns ageColumn when type is date and name is age',
        col:  makeCol({
          name:   'age',
          type:   'date',
          format: '',
        }),
      },
      {
        desc: 'returns ageColumn when name is Age (case insensitive)',
        col:  makeCol({
          name:   'Age',
          format: '',
        }),
      },
    ])('$desc', ({ col }) => {
      const ageColumn = makeAgeColumn() as any;
      const result = headerFromSchemaCol(col as any, makeGetters() as any, false, ageColumn);

      expect(result).toStrictEqual(ageColumn);
    });

    it('does not return ageColumn when ageColumn is not provided', () => {
      const col = makeCol({ name: 'age', format: '' });
      const result = headerFromSchemaCol(col as any, makeGetters() as any, false, null as any);

      expect(result).not.toStrictEqual(null);
      expect(result.name).toStrictEqual('age');
    });
  });

  describe('formatter assignment', () => {
    it('sets formatter to Date and width 120 for date format', () => {
      const col = makeCol({
        name:   'created',
        format: 'date',
      });
      const result = headerFromSchemaCol(col as any, makeGetters() as any, false, null as any);

      expect(result.formatter).toStrictEqual('Date');
      expect(result.width).toStrictEqual(120);
      expect(result.formatterOpts).toStrictEqual({ multiline: true });
    });

    it('sets formatter to Date and width 120 when type is date', () => {
      const col = makeCol({
        name:   'modified',
        format: '',
        type:   'date',
      });
      const result = headerFromSchemaCol(col as any, makeGetters() as any, false, null as any);

      expect(result.formatter).toStrictEqual('Date');
      expect(result.width).toStrictEqual(120);
    });

    it('sets formatter to Number when type is number', () => {
      const col = makeCol({
        name: 'count',
        type: 'number',
      });
      const result = headerFromSchemaCol(col as any, makeGetters() as any, false, null as any);

      expect(result.formatter).toStrictEqual('Number');
    });

    it('sets formatter to Number when type is int', () => {
      const col = makeCol({
        name: 'replicas',
        type: 'int',
      });
      const result = headerFromSchemaCol(col as any, makeGetters() as any, false, null as any);

      expect(result.formatter).toStrictEqual('Number');
    });

    it('does not set formatter for plain text column', () => {
      const col = makeCol({ name: 'status', type: 'string' });
      const result = headerFromSchemaCol(col as any, makeGetters() as any, false, null as any);

      expect(result.formatter).toBeUndefined();
    });
  });

  describe('label resolution', () => {
    it('uses i18n translation when key exists', () => {
      const getters = makeGetters({
        'i18n/exists': jest.fn(() => true),
        'i18n/t':      jest.fn((key: string) => `translated:${ key }`),
      });
      const col = makeCol({ name: 'status' });
      const result = headerFromSchemaCol(col as any, getters as any, false, null as any);

      expect(result.label).toStrictEqual('translated:tableHeaders.status');
    });

    it('uses column name when i18n key does not exist', () => {
      const getters = makeGetters({ 'i18n/exists': jest.fn(() => false) });
      const col = makeCol({ name: 'MyColumn' });
      const result = headerFromSchemaCol(col as any, getters as any, false, null as any);

      expect(result.label).toStrictEqual('MyColumn');
    });

    it('camelCases the i18n key when col name has spaces', () => {
      const getters = makeGetters({
        'i18n/exists': jest.fn((key: string) => key === 'tableHeaders.myLabel'),
        'i18n/t':      jest.fn((key: string) => `t:${ key }`),
      });
      const col = makeCol({ name: 'my label' });
      const result = headerFromSchemaCol(col as any, getters as any, false, null as any);

      expect(result.label).toStrictEqual('t:tableHeaders.myLabel');
    });
  });

  describe('tooltip from description', () => {
    it('uses description as tooltip when not ending with dot', () => {
      const col = makeCol({ name: 'status', description: 'Current status' });
      const result = headerFromSchemaCol(col as any, makeGetters() as any, false, null as any);

      expect(result.tooltip).toStrictEqual('Current status');
    });

    it('strips trailing dot from description for tooltip', () => {
      const col = makeCol({ name: 'status', description: 'Current status.' });
      const result = headerFromSchemaCol(col as any, makeGetters() as any, false, null as any);

      expect(result.tooltip).toStrictEqual('Current status');
    });

    it('uses empty string as tooltip when description is empty', () => {
      const col = makeCol({ name: 'status', description: '' });
      const result = headerFromSchemaCol(col as any, makeGetters() as any, false, null as any);

      expect(result.tooltip).toStrictEqual('');
    });
  });

  describe('pagination mode', () => {
    it('uses string path as value when pagination is true', () => {
      const col = makeCol({ name: 'status', field: '$.metadata.name' });
      const result = headerFromSchemaCol(col as any, makeGetters() as any, true, null as any);

      expect(typeof result.value).toStrictEqual('string');
    });

    it('uses function as value when pagination is false', () => {
      const col = makeCol({ name: 'status', field: '$.metadata.fields[0]' });
      const result = headerFromSchemaCol(col as any, makeGetters() as any, false, null as any);

      expect(typeof result.value).toStrictEqual('function');
    });
  });

  describe('output shape', () => {
    it('sets name to lowercase version of col.name', () => {
      const col = makeCol({ name: 'Status' });
      const result = headerFromSchemaCol(col as any, makeGetters() as any, false, null as any);

      expect(result.name).toStrictEqual('status');
    });

    it('sets sort and search from string path', () => {
      const col = makeCol({ name: 'name', field: '$.metadata.name' });
      const result = headerFromSchemaCol(col as any, makeGetters() as any, true, null as any);

      expect(result.sort).toStrictEqual(['$.metadata.name']);
      expect(result.search).toStrictEqual('$.metadata.name');
    });
  });
});
