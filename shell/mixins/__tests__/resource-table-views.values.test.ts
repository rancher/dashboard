import ResourceTableViews from '@shell/mixins/resource-table-views';
import type { TableViewField } from '@shell/types/table-views';

const { fetchFieldValues } = (ResourceTableViews as unknown as { methods: Record<string, (this: object, id: string) => Promise<void>> }).methods;

const field = (id: string, path: string): TableViewField => ({
  id, label: id, isLabel: false, paginationHeader: { search: path }
});

const NAMESPACE = field('namespace', 'metadata.namespace');
const OWNER = field('owner', 'metadata.labels[owner]');

/** A server side list whose query offers values for `namespace` only */
function list() {
  const dispatch = jest.fn(() => Promise.resolve({ data: [] }));

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
});
