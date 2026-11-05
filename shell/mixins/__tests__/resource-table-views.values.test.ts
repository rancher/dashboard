import ResourceTableViews from '@shell/mixins/resource-table-views';
import type { TableViewField } from '@shell/types/table-views';

const { methods } = ResourceTableViews as unknown as { methods: Record<string, (this: object, ...args: unknown[]) => unknown> };
const fetchFieldValues = methods.fetchFieldValues as (this: object, id: string) => Promise<void>;
const refreshFieldValues = methods.refreshFieldValues as (this: object, id: string) => Promise<void>;

const field = (id: string, path: string): TableViewField => ({
  id, label: id, isLabel: false, paginationHeader: { search: path }
});

const NAMESPACE = field('namespace', 'metadata.namespace');
const OWNER = field('owner', 'metadata.labels[owner]');

/** A server side list whose query offers values for `namespace` only */
function list(request: () => Promise<unknown> = () => Promise.resolve({ data: [] })) {
  const dispatch = jest.fn(request);
  const ctx = {
    serverSideTableViews:  true,
    fieldValues:           {} as Record<string, unknown>,
    fieldValuesLoading:    [] as string[],
    fieldValuesRefreshing: [] as string[],
    fieldValuesAt:         {} as Record<string, number>,
    viewQueryFields:       [NAMESPACE, OWNER],
    viewFilterFields:      [NAMESPACE],
    viewDateFieldIds:      [],
    summaryBaseUrl:        '/v1/pods?pagesize=1',
    inStore:               'cluster',
    $store:                { dispatch },
  } as Record<string, unknown>;

  // The helpers the methods call on `this`
  ctx.fieldSummaryPath = (methods.fieldSummaryPath as (this: object, f: unknown) => string | null).bind(ctx);
  ctx.summaryValues = (methods.summaryValues as (this: object, id: string, path: string) => Promise<unknown>).bind(ctx);

  return {
    ctx: ctx as typeof ctx & { fieldValues: Record<string, unknown>, fieldValuesLoading: string[], fieldValuesRefreshing: string[], fieldValuesAt: Record<string, number>, summaryBaseUrl: string },
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

  describe('asked for again as their suggestions open', () => {
    const NS = { summary: [{ property: 'metadata.namespace', counts: { fresh: { total: 4 } } }] };
    const inHand = [{ value: 'old', count: 1 }];
    const opened = (request: () => Promise<unknown> = () => Promise.resolve(NS)) => {
      const out = list(request);

      out.ctx.fieldValues = { namespace: inHand };
      out.ctx.fieldValuesAt = { namespace: Date.now() - 10000 };

      return out;
    };

    afterEach(() => jest.useRealTimers());

    it('should swap the values in hand for the api\'s, offering them meanwhile with no loading', async() => {
      let answer: () => void = () => undefined;
      const { ctx } = opened(() => new Promise((resolve) => {
        answer = () => resolve(NS);
      }));
      const asked = refreshFieldValues.call(ctx, 'namespace');

      expect(ctx.fieldValues.namespace).toBe(inHand);
      expect(ctx.fieldValuesLoading).toStrictEqual([]);

      answer();
      await asked;

      expect(ctx.fieldValues.namespace).toStrictEqual([{ value: 'fresh', count: 4 }]);
      expect(ctx.fieldValuesRefreshing).toStrictEqual([]);
    });

    it('should not ask while one is on its way, nor again soon after an answer', async() => {
      const { ctx, dispatch } = opened();

      const first = refreshFieldValues.call(ctx, 'namespace');

      refreshFieldValues.call(ctx, 'namespace');
      await first;
      await refreshFieldValues.call(ctx, 'namespace');

      expect(dispatch).toHaveBeenCalledTimes(1);
    });

    it('should ask again once a while has passed', async() => {
      jest.useFakeTimers({ now: 1_000_000 });
      const { ctx, dispatch } = opened();

      await refreshFieldValues.call(ctx, 'namespace');
      jest.setSystemTime(1_000_000 + 2500);
      await refreshFieldValues.call(ctx, 'namespace');

      expect(dispatch).toHaveBeenCalledTimes(2);
    });

    it('should keep the values in hand when the api can\'t answer', async() => {
      const { ctx } = opened(() => Promise.reject(new Error('offline')));

      await refreshFieldValues.call(ctx, 'namespace');

      expect(ctx.fieldValues.namespace).toBe(inHand);
    });

    it('should leave values not asked for yet to the first request, and a field whose values aren\'t offered alone', async() => {
      const { ctx, dispatch } = list();

      await refreshFieldValues.call(ctx, 'namespace');
      ctx.fieldValues = { owner: [] };
      await refreshFieldValues.call(ctx, 'owner');

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('should drop an answer for a scope the list has since left', async() => {
      let answer: () => void = () => undefined;
      const { ctx } = opened(() => new Promise((resolve) => {
        answer = () => resolve(NS);
      }));
      const asked = refreshFieldValues.call(ctx, 'namespace');

      ctx.summaryBaseUrl = '/v1/pods?pagesize=1&projectsornamespaces=other';
      answer();
      await asked;

      expect(ctx.fieldValues.namespace).toBe(inHand);
    });
  });
});
