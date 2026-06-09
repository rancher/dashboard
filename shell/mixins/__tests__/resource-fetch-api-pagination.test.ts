import { parseStateFilter } from '@shell/mixins/resource-fetch-api-pagination';
import { PaginationFilterEquality } from '@shell/types/store/pagination.types';

describe('parseStateFilter', () => {
  it('should return null for null input', () => {
    expect(parseStateFilter(null)).toBeNull();
  });

  it('should return null for undefined input', () => {
    expect(parseStateFilter(undefined)).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(parseStateFilter('')).toBeNull();
  });

  it('should parse a single state', () => {
    const result = parseStateFilter('running');

    expect(result).toHaveLength(1);
    expect(result?.[0].field).toStrictEqual('metadata.state.name');
    expect(result?.[0].value).toStrictEqual('running');
    expect(result?.[0].equality).toStrictEqual(PaginationFilterEquality.IN);
  });

  it('should parse multiple comma-separated states', () => {
    const result = parseStateFilter('running,active');

    expect(result).toHaveLength(1);
    expect(result?.[0].field).toStrictEqual('metadata.state.name');
    expect(result?.[0].value).toStrictEqual('running,active');
    expect(result?.[0].equality).toStrictEqual(PaginationFilterEquality.IN);
  });

  it('should parse three comma-separated states', () => {
    const result = parseStateFilter('running,active,waiting');

    expect(result).toHaveLength(1);
    expect(result?.[0].value).toStrictEqual('running,active,waiting');
  });

  it('should ignore empty segments from trailing commas', () => {
    const result = parseStateFilter('running,,active,');

    expect(result).toHaveLength(1);
    expect(result?.[0].value).toStrictEqual('running,active');
  });
});
