import ResourceTableViews from '@shell/mixins/resource-table-views';
import type { TableViewField } from '@shell/types/table-views';

const { fetchFieldValues } = (ResourceTableViews as unknown as { methods: Record<string, (this: object, id: string) => Promise<void>> }).methods;

const field = (id: string, path: string): TableViewField => ({
  id, label: id, isLabel: false, paginationHeader: { search: path }
});

const NAMESPACE = field('namespace', 'metadata.namespace');
const OWNER = field('owner', 'metadata.labels[owner]');

/** A server side list whose query offers values for `namespace` only */
function list(request: () => Promise<unknown> = () => Promise.resolve({ data: [] })) {
  const dispatch = jest.fn(request);

  return {
    ctx: {
      serverSideTableViews: true,
      fieldValues:          {} as Record<string, unknown>,
      fieldValuesLoading:   [] as string[],
      viewQueryFields:      [NAMESPACE, OWNER],
      viewFilterFields:     [NAMESPACE],
      viewDateFieldIds:     [],
      summaryBaseUrl:       '/v1/pods?pagesize=1',
      inStore:              'cluster',
      $store:               { dispatch },
    },
    dispatch,
  };
}

describe('the values a field is asked for', () => {
  it('should ask the api for the values of a field the query offers values for', async() => {
    const { ctx, dispatch } = list();

    await fetchFieldValues.call(ctx, 'namespace');

    expect(dispatch).toHaveBeenCalledWith('cluster/request', { opt: { url: '/v1/pods?pagesize=1&summary=metadata.namespace&summaryonly' } });
  });

  it('should not ask for the values of a field whose values it doesn\'t offer, and say there are none', async() => {
    const { ctx, dispatch } = list();

    await fetchFieldValues.call(ctx, 'owner');

    expect(dispatch).not.toHaveBeenCalled();
    expect(ctx.fieldValues.owner).toStrictEqual([]);
    expect(ctx.fieldValuesLoading).toStrictEqual([]);
  });

  it('should not keep a request that failed, so the field asks again next time', async() => {
    const { ctx, dispatch } = list(() => Promise.reject(new Error('offline')));

    await fetchFieldValues.call(ctx, 'namespace');

    expect(ctx.fieldValues).not.toHaveProperty('namespace');
    expect(ctx.fieldValuesLoading).toStrictEqual([]);

    await fetchFieldValues.call(ctx, 'namespace');

    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it('should keep the values once the api has given them', async() => {
    const { ctx, dispatch } = list(() => Promise.resolve({ summary: [{ property: 'metadata.namespace', counts: { default: { total: 3 } } }] }));

    await fetchFieldValues.call(ctx, 'namespace');
    await fetchFieldValues.call(ctx, 'namespace');

    expect(ctx.fieldValues.namespace).toStrictEqual([{ value: 'default', count: 3 }]);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['values', () => Promise.resolve({ summary: [{ property: 'metadata.namespace', counts: { old: { total: 1 } } }] })],
    ['a failure', () => Promise.reject(new Error('gone'))],
  ])('should drop %s that came for a scope the list has since left', async(_, request) => {
    let answer: () => void = () => undefined;
    const { ctx } = list(() => new Promise((resolve, reject) => {
      answer = () => request().then(resolve, reject);
    }));
    const asked = fetchFieldValues.call(ctx, 'namespace');

    // The scope changes, and the values asked for afresh have come in
    ctx.summaryBaseUrl = '/v1/pods?pagesize=1&projectsornamespaces=other';
    ctx.fieldValues = { namespace: [{ value: 'fresh', count: 2 }] };
    answer();
    await asked;

    expect(ctx.fieldValues.namespace).toStrictEqual([{ value: 'fresh', count: 2 }]);
  });
});
