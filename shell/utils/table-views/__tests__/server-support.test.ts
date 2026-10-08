import { computed, nextTick } from 'vue';

import { DESCRIPTION_PATH, canQueryDescription, resetServerSupport } from '@shell/utils/table-views/server-support';
import { optionalHeadersFor } from '@shell/utils/table-views/optional-headers';

/** A store whose one request is answered when the test says */
function storeAnswering() {
  let answer: { resolve: () => void, reject: (e: unknown) => void } = { resolve: () => {}, reject: () => {} };
  const dispatch = jest.fn(() => new Promise<void>((resolve, reject) => {
    answer = { resolve, reject };
  }));

  return {
    store: { dispatch }, dispatch, ok: () => answer.resolve(), fail: () => answer.reject({ status: 422 })
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('what the pagination api can query', () => {
  beforeEach(() => resetServerSupport());

  it('should ask the server once, however many tables ask', () => {
    const { store, dispatch } = storeAnswering();

    canQueryDescription(store);
    canQueryDescription(store);
    canQueryDescription(store);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith('management/request', { url: `/v1/management.cattle.io.feature?pagesize=1&filter=${ encodeURIComponent(`${ DESCRIPTION_PATH }=x`) }` });
  });

  it('should say no until the server has answered', () => {
    const { store } = storeAnswering();

    expect(canQueryDescription(store)).toBe(false);
  });

  it('should say yes once the server accepts the field', async() => {
    const { store, ok } = storeAnswering();

    canQueryDescription(store);
    ok();
    await flush();

    expect(canQueryDescription(store)).toBe(true);
  });

  it('should say no when the server rejects it, or the request fails', async() => {
    const { store, fail } = storeAnswering();

    canQueryDescription(store);
    fail();
    await flush();

    expect(canQueryDescription(store)).toBe(false);
  });

  it('should say no without a store to ask', () => {
    expect(canQueryDescription({})).toBe(false);
  });

  it('should tell a table that asked before the answer once it comes', async() => {
    const { store, ok } = storeAnswering();
    const asked = computed(() => canQueryDescription(store));

    expect(asked.value).toBe(false);

    ok();
    await flush();
    await nextTick();

    expect(asked.value).toBe(true);
  });

  describe('the paginated Description column', () => {
    const description = (headers: { name?: string, sort?: unknown, search?: unknown }[]) => headers.find((h) => h.name === 'description');

    it('should offer no server sort or search until the api can query it', () => {
      const { store } = storeAnswering();
      const column = description(optionalHeadersFor('configmap', store, true));

      expect(column?.sort).toBe(false);
      expect(column?.search).toBe(false);
    });

    it('should sort and search on the annotation once the api can', async() => {
      const { store, ok } = storeAnswering();

      optionalHeadersFor('configmap', store, true);
      ok();
      await flush();

      const column = description(optionalHeadersFor('configmap', store, true));

      expect(column?.sort).toBe(DESCRIPTION_PATH);
      expect(column?.search).toBe(DESCRIPTION_PATH);
    });

    it('should leave the column of a list that is not paginated alone, and ask nothing', () => {
      const { store, dispatch } = storeAnswering();
      const column = description(optionalHeadersFor('configmap', store, false));

      expect(column?.sort).toStrictEqual(['metadata.annotations."field.cattle.io/description"']);
      expect(dispatch).not.toHaveBeenCalled();
    });
  });
});
