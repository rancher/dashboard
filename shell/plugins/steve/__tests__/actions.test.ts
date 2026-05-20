import actions from '@shell/plugins/steve/actions';
import paginationUtils from '@shell/utils/pagination-utils';
import stevePaginationUtils from '@shell/plugins/steve/steve-pagination-utils';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';

const { fetchResourceSummary } = actions;

describe('steve: actions:', () => {
  describe('fetchResourceSummary', () => {
    const schema = {
      id:         'pod',
      links:      { collection: '/v1/pods' },
      attributes: { namespaced: true },
    };

    const baseCtx = () => ({
      getters: {
        normalizeType: (type: string) => type,
        schemaFor:     (type: string) => (type === 'pod' ? schema : undefined),
      },
      dispatch:    jest.fn(),
      rootGetters: {},
    });

    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(paginationUtils, 'isSteveCacheEnabled').mockReturnValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return undefined and warn when schema is not found', async() => {
      const ctx = baseCtx();
      const result = await fetchResourceSummary.call({}, ctx, { type: 'nonexistent', opt: { summaryField: 'metadata.state.name' } });

      expect(result).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('no schema found'));
    });

    it('should return undefined and warn when VAI is not enabled', async() => {
      jest.spyOn(paginationUtils, 'isSteveCacheEnabled').mockReturnValue(false);
      const ctx = baseCtx();
      const result = await fetchResourceSummary.call({}, ctx, { type: 'pod', opt: { summaryField: 'metadata.state.name' } });

      expect(result).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('VAI is not enabled'));
    });

    it('should return undefined and warn when summaryField is missing', async() => {
      const ctx = baseCtx();
      const result = await fetchResourceSummary.call({}, ctx, { type: 'pod', opt: {} });

      expect(result).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('summaryField is required'));
    });

    it('should construct the correct URL with summary and exclude params', async() => {
      const ctx = baseCtx();

      ctx.dispatch.mockResolvedValue({ count: 5, summary: [{ property: 'metadata.state.name', counts: { running: 5 } }] });

      await fetchResourceSummary.call({}, ctx, { type: 'pod', opt: { summaryField: 'metadata.state.name' } });

      const requestUrl = ctx.dispatch.mock.calls[0][1].opt.url;

      expect(requestUrl).toContain('summary=metadata.state.name');
      expect(requestUrl).toContain('exclude=metadata');
      expect(requestUrl).toContain('exclude=spec');
      expect(requestUrl).toContain('exclude=status');
    });

    it('should append namespace to path for namespaced resources', async() => {
      const ctx = baseCtx();

      ctx.dispatch.mockResolvedValue({ count: 2, summary: null });

      await fetchResourceSummary.call({}, ctx, { type: 'pod', opt: { summaryField: 'metadata.state.name', namespaced: 'cattle-system' } });

      const requestUrl = ctx.dispatch.mock.calls[0][1].opt.url;

      expect(requestUrl).toMatch(/\/v1\/pods\/cattle-system\?/);
    });

    it('should not append namespace when schema is not namespaced', async() => {
      const nonNsSchema = { ...schema, attributes: { namespaced: false } };
      const ctx = baseCtx();

      ctx.getters.schemaFor = () => nonNsSchema;
      ctx.dispatch.mockResolvedValue({ count: 1, summary: null });

      await fetchResourceSummary.call({}, ctx, { type: 'pod', opt: { summaryField: 'metadata.state.name', namespaced: 'default' } });

      const requestUrl = ctx.dispatch.mock.calls[0][1].opt.url;

      expect(requestUrl).not.toContain('/default');
    });

    it('should append filter params when filters are provided', async() => {
      const ctx = baseCtx();
      const filters = [PaginationParamFilter.createSingleField({ field: 'metadata.namespace', value: 'default' })];

      jest.spyOn(stevePaginationUtils, 'convertPaginationParams').mockReturnValue('filter=metadata.namespace%3Ddefault');
      ctx.dispatch.mockResolvedValue({ count: 3, summary: null });

      await fetchResourceSummary.call({}, ctx, { type: 'pod', opt: { summaryField: 'metadata.state.name', filters } });

      const requestUrl = ctx.dispatch.mock.calls[0][1].opt.url;

      expect(requestUrl).toContain('filter=');
      expect(stevePaginationUtils.convertPaginationParams).toHaveBeenCalledWith(expect.objectContaining({ filters }));
    });

    it('should return count and summary from the response', async() => {
      const ctx = baseCtx();
      const apiResponse = {
        count:   10,
        summary: [{ property: 'metadata.state.name', counts: { running: 7, error: 3 } }]
      };

      ctx.dispatch.mockResolvedValue(apiResponse);

      const result = await fetchResourceSummary.call({}, ctx, { type: 'pod', opt: { summaryField: 'metadata.state.name' } });

      expect(result).toStrictEqual({
        count:   10,
        summary: [{ property: 'metadata.state.name', counts: { running: 7, error: 3 } }]
      });
    });

    it('should default count to 0 and summary to null when response is empty', async() => {
      const ctx = baseCtx();

      ctx.dispatch.mockResolvedValue({});

      const result = await fetchResourceSummary.call({}, ctx, { type: 'pod', opt: { summaryField: 'metadata.state.name' } });

      expect(result).toStrictEqual({ count: 0, summary: null });
    });

    it('should return undefined and warn when the request fails', async() => {
      const ctx = baseCtx();

      ctx.dispatch.mockRejectedValue(new Error('network error'));

      const result = await fetchResourceSummary.call({}, ctx, { type: 'pod', opt: { summaryField: 'metadata.state.name' } });

      expect(result).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('summary API request failed'), expect.any(Error));
    });
  });
});
