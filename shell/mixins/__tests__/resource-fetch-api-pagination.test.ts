import { parseStructuredQuery } from '@shell/mixins/resource-fetch-api-pagination';
import { PaginationFilterEquality } from '@shell/types/store/pagination.types';

describe('parseStructuredQuery', () => {
  it('should return null for null input', () => {
    expect(parseStructuredQuery(null)).toBeNull();
  });

  it('should return null for undefined input', () => {
    expect(parseStructuredQuery(undefined)).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(parseStructuredQuery('')).toBeNull();
  });

  it('should return null for plain text search query', () => {
    expect(parseStructuredQuery('nginx')).toBeNull();
  });

  it('should return null for malformed structured query', () => {
    expect(parseStructuredQuery('"field"')).toBeNull();
  });

  it('should parse a single key-value pair', () => {
    const result = parseStructuredQuery('"metadata.state.name":"running"');

    expect(result).toHaveLength(1);
    expect(result?.[0].field).toStrictEqual('metadata.state.name');
    expect(result?.[0].value).toStrictEqual('running');
    expect(result?.[0].equality).toStrictEqual(PaginationFilterEquality.IN);
  });

  it('should parse multiple key-value pairs with the same field into a single IN filter', () => {
    const result = parseStructuredQuery('"metadata.state.name":"running","metadata.state.name":"active"');

    expect(result).toHaveLength(1);
    expect(result?.[0].field).toStrictEqual('metadata.state.name');
    expect(result?.[0].value).toStrictEqual('running,active');
    expect(result?.[0].equality).toStrictEqual(PaginationFilterEquality.IN);
  });

  it('should parse pairs with different fields into separate filters', () => {
    const result = parseStructuredQuery('"metadata.state.name":"running","metadata.namespace":"default"');

    expect(result).toHaveLength(2);
    expect(result?.[0].field).toStrictEqual('metadata.state.name');
    expect(result?.[0].value).toStrictEqual('running');
    expect(result?.[1].field).toStrictEqual('metadata.namespace');
    expect(result?.[1].value).toStrictEqual('default');
  });

  it('should handle empty value in a pair', () => {
    const result = parseStructuredQuery('"metadata.state.name":""');

    expect(result).toHaveLength(1);
    expect(result?.[0].field).toStrictEqual('metadata.state.name');
    expect(result?.[0].value).toStrictEqual('');
  });

  it('should group multiple values for the same field from three pairs', () => {
    const result = parseStructuredQuery('"metadata.state.name":"running","metadata.state.name":"active","metadata.state.name":"waiting"');

    expect(result).toHaveLength(1);
    expect(result?.[0].value).toStrictEqual('running,active,waiting');
  });
});
