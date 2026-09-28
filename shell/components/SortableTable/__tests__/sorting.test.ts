import sorting from '@shell/components/SortableTable/sorting';

const { arrangedRows } = sorting.computed;

describe('sorting mixin', () => {
  describe('arrangedRows', () => {
    function createContext({
      rows = [] as any[],
      sortFields = ['id'],
      descending = false,
      sortGeneration = undefined as string | undefined,
      sortGenerationFn = (() => 'gen1') as (() => string) | undefined,
      externalPaginationEnabled = false,
      cacheKey = null as string | null,
      cachedRows = null as any[] | null,
      cachedRowsRef = null as any[] | null,
    } = {}) {
      return {
        rows,
        sortFields,
        descending,
        sortGeneration,
        sortGenerationFn,
        externalPaginationEnabled,
        cacheKey,
        cachedRows,
        cachedRowsRef,
      };
    }

    it('should return undefined when externalPaginationEnabled is true', () => {
      const ctx = createContext({ externalPaginationEnabled: true });

      expect(arrangedRows.call(ctx)).toBeUndefined();
    });

    it('should sort rows by the given sort fields', () => {
      const rows = [{ id: 'b' }, { id: 'a' }, { id: 'c' }];
      const ctx = createContext({ rows, sortGenerationFn: undefined });

      const result = arrangedRows.call(ctx);

      expect(result.map((r: any) => r.id)).toStrictEqual(['a', 'b', 'c']);
    });

    it('should cache results when sortGenerationFn is provided', () => {
      const rows = [{ id: 'b' }, { id: 'a' }];
      const ctx = createContext({ rows });

      const result1 = arrangedRows.call(ctx);

      expect(ctx.cacheKey).not.toBeNull();
      expect(ctx.cachedRows).toStrictEqual(result1);

      const result2 = arrangedRows.call(ctx);

      expect(result2).toBe(ctx.cachedRows);
    });

    it('should invalidate cache when rows change to different items with the same count', () => {
      const rowsA = [{ id: 'alpha' }];
      const rowsB = [{ id: 'beta' }];
      const ctx = createContext({ rows: rowsA });

      const resultA = arrangedRows.call(ctx);

      expect(resultA.map((r: any) => r.id)).toStrictEqual(['alpha']);

      ctx.rows = rowsB;
      const resultB = arrangedRows.call(ctx);

      expect(resultB.map((r: any) => r.id)).toStrictEqual(['beta']);
    });

    it('should return cached rows when same rows are passed again', () => {
      const rows = [{ id: 'x' }, { id: 'y' }];
      const ctx = createContext({ rows });

      arrangedRows.call(ctx);
      const cached = ctx.cachedRows;

      const result = arrangedRows.call(ctx);

      expect(result).toBe(cached);
    });

    it('should invalidate cache when descending changes', () => {
      const rows = [{ id: 'a' }, { id: 'b' }];
      const ctx = createContext({ rows });

      arrangedRows.call(ctx);

      ctx.descending = true;
      const result = arrangedRows.call(ctx);

      expect(result.map((r: any) => r.id)).toStrictEqual(['b', 'a']);
    });

    it('should not cache when there is no sortGenerationFn or sortGeneration', () => {
      const rows = [{ id: 'a' }];
      const ctx = createContext({ rows });

      ctx.sortGenerationFn = undefined;
      ctx.sortGeneration = undefined;

      arrangedRows.call(ctx);

      expect(ctx.cacheKey).toBeNull();
      expect(ctx.cachedRows).toBeNull();
    });

    it('should use sortGeneration over sortGenerationFn when provided', () => {
      const rows = [{ id: 'a' }];
      const ctx = createContext({
        rows,
        sortGeneration:   'custom-gen',
        sortGenerationFn: () => 'fn-gen',
      });

      arrangedRows.call(ctx);

      expect(ctx.cacheKey).toContain('custom-gen');
      expect(ctx.cacheKey).not.toContain('fn-gen');
    });
  });
});
