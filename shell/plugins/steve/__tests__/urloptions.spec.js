import urlOptions from '@shell/plugins/steve/urloptions';

describe('plugins/steve: urlOptions', () => {
  it('returns undefined when called without params', () => {
    expect(urlOptions()).toBeUndefined();
  });
  it('returns an unmodified string when called without options', () => {
    expect(urlOptions('foo')).toBe('foo');
  });
  it('returns an unmodified string when called with options that are not accounted for', () => {
    expect(urlOptions('foo', { bar: 'baz' })).toBe('foo');
  });
  it('returns a string with a single filter statement applied if a single filter statement is applied', () => {
    expect(urlOptions('foo', { filter: { bar: 'baz' } })).toBe('foo?bar=baz');
  });
  it('returns a string with a multiple filter statements applied if a single filter statement is applied', () => {
    expect(urlOptions('foo', { filter: { bar: 'baz', far: 'faz' } })).toBe('foo?bar=baz&far=faz');
  });
  it('returns a string with an exclude statement for "bar" if excludeFields is a single element array with the string "bar"', () => {
    expect(urlOptions('foo', { excludeFields: ['bar'] })).toBe('foo?exclude=bar');
  });
  it('returns a string with a limit applied if a limit is provided', () => {
    expect(urlOptions('foo', { limit: 10 })).toBe('foo?limit=10');
  });
  it('returns a string with a sorting criteria if the sort option is provided', () => {
    expect(urlOptions('foo', { sortBy: 'bar' })).toBe('foo?sort=bar');
  });
  it('returns a string with a sorting criteria if the sort option is provided and an order if sortOrder is provided', () => {
    expect(urlOptions('foo', { sortBy: 'bar', sortOrder: 'baz' })).toBe('foo?sort=bar&order=baz');
  });
});
