import ResourceTableViews from '@shell/mixins/resource-table-views';

type Fn = (this: object, ...args: unknown[]) => unknown;
const { methods, watch } = ResourceTableViews as unknown as { methods: Record<string, Fn>, watch: Record<string, Fn> };
const resultArrived = watch.externalPaginationResult;
const fetchViewCounts = methods.fetchViewCounts as (this: object, refresh?: boolean) => Promise<void>;

function list() {
  const ctx = {
    serverSideTableViews:       true,
    viewFiltersApplied:         false,
    externalPaginationArgs:     { page: 1, filters: [] } as object,
    lastResultArgsKey:          null as string | null,
    viewSwitchFromArgs:         null,
    endViewSwitch:              jest.fn(),
    debouncedRefreshViewCounts: jest.fn(),
    countableQueries:           ['', 'state:running'],
    viewCounts:                 { '': 3, 'state:running': 2 } as Record<string, number>,
    countingInFlight:           false,
    recountPending:             false,
    requestViewCounts:          jest.fn(() => Promise.resolve()),
    fetchViewCounts:            (refresh?: boolean) => fetchViewCounts.call(ctx, refresh),
  };

  return { ctx };
}

describe('the tabs\' counts as the list changes', () => {
  it('should not count again for the first page of a request', () => {
    const { ctx } = list();

    resultArrived.call(ctx, { count: 3 });

    expect(ctx.debouncedRefreshViewCounts).not.toHaveBeenCalled();
  });

  it('should count every tab again when the same request is answered afresh, as after a delete', () => {
    const { ctx } = list();

    resultArrived.call(ctx, { count: 3 });
    resultArrived.call(ctx, { count: 2 });

    expect(ctx.debouncedRefreshViewCounts).toHaveBeenCalledTimes(1);
  });

  it('should count again when the request was rebuilt the same, between the two answers', () => {
    const { ctx } = list();

    resultArrived.call(ctx, { count: 3 });
    ctx.externalPaginationArgs = { page: 1, filters: [] };
    resultArrived.call(ctx, { count: 2 });

    expect(ctx.debouncedRefreshViewCounts).toHaveBeenCalledTimes(1);
  });

  it('should not count again for a page turn, a sort or a filter', () => {
    const { ctx } = list();

    resultArrived.call(ctx, { count: 3 });
    ctx.externalPaginationArgs = { page: 2, filters: [] };
    resultArrived.call(ctx, { count: 3 });

    expect(ctx.debouncedRefreshViewCounts).not.toHaveBeenCalled();
  });

  it('should count again once the round in flight ends, when asked to mid-round', async() => {
    const { ctx } = list();
    let finish = () => {};

    ctx.requestViewCounts.mockImplementationOnce(() => new Promise<void>((resolve) => {
      finish = resolve;
    }));

    const round = ctx.fetchViewCounts(true);

    await ctx.fetchViewCounts(true);
    expect(ctx.requestViewCounts).toHaveBeenCalledTimes(1);

    finish();
    await round;

    expect(ctx.requestViewCounts).toHaveBeenCalledTimes(2);
    expect(ctx.requestViewCounts).toHaveBeenLastCalledWith(['', 'state:running']);
    expect(ctx.recountPending).toBe(false);
  });

  it('should not count again after a round when nothing asked mid-round', async() => {
    const { ctx } = list();

    await ctx.fetchViewCounts(true);

    expect(ctx.requestViewCounts).toHaveBeenCalledTimes(1);
  });
});
