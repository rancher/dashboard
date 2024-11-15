import { stripOrigin } from '../url';

describe('stripOrigin', () => {
  // eslint-disable-next-line jest/no-hooks
  beforeAll(() => {
    process.env.BASE_URL = 'https://example.com';
  });

  // eslint-disable-next-line jest/no-hooks
  afterAll(() => {
    delete process.env.BASE_URL;
  });

  it('should strip origin from a valid absolute URL', () => {
    const url = 'https://example.com/path/to/resource?query=value';

    expect(stripOrigin(url)).toBe('/path/to/resource?query=value');
  });

  it('should strip origin from a valid relative URL', () => {
    const url = '/path/to/resource?query=value';

    expect(stripOrigin(url)).toBe('/path/to/resource?query=value');
  });

  it('should return the original URL if it is invalid', () => {
    const url = 'invalid-url';

    expect(stripOrigin(url, '')).toBe('invalid-url');
  });

  it('should handle URLs without search queries', () => {
    const url = 'https://example.com/path/to/resource';

    expect(stripOrigin(url)).toBe('/path/to/resource');
  });

  it('should handle URLs with only search queries', () => {
    const url = 'https://example.com?query=value';

    expect(stripOrigin(url)).toBe('/?query=value');
  });

  it('should handle URLs with only path', () => {
    const url = 'https://example.com/path/to/resource';

    expect(stripOrigin(url)).toBe('/path/to/resource');
  });

  it('should handle URLs with only search query in relative URL', () => {
    const url = '?query=value';

    expect(stripOrigin(url)).toBe('/?query=value');
  });

  it('should handle URLs with only path in relative URL', () => {
    const url = '/path/to/resource';

    expect(stripOrigin(url)).toBe('/path/to/resource');
  });
});
