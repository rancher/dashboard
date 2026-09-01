import {
  isServerUrl,
  isHttps,
  isDomainWithoutProtocol,
  isLocalhost,
  isValidUrl,
  hasTrailingForwardSlash,
} from '@shell/utils/validators/setting';

describe('setting validators', () => {
  describe('isServerUrl', () => {
    it.each([
      {
        desc:     'exact match',
        value:    'server-url',
        expected: true,
      },
      {
        desc:     'wrong value',
        value:    'other',
        expected: false,
      },
      {
        desc:     'empty string',
        value:    '',
        expected: false,
      },
      {
        desc:     'extra characters',
        value:    'server-url-extra',
        expected: false,
      },
    ])('returns $expected for $desc', ({ value, expected }) => {
      expect(isServerUrl(value)).toStrictEqual(expected);
    });
  });

  describe('isHttps', () => {
    it.each([
      {
        desc:     'https url',
        value:    'https://example.com',
        expected: true,
      },
      {
        desc:     'uppercase HTTPS url',
        value:    'HTTPS://example.com',
        expected: true,
      },
      {
        desc:     'http url',
        value:    'http://example.com',
        expected: false,
      },
      {
        desc:     'empty string',
        value:    '',
        expected: false,
      },
      {
        desc:     'ftp url',
        value:    'ftp://example.com',
        expected: false,
      },
    ])('returns $expected for $desc', ({ value, expected }) => {
      expect(isHttps(value)).toStrictEqual(expected);
    });
  });

  describe('isDomainWithoutProtocol', () => {
    it.each([
      {
        desc:     'simple domain',
        value:    'example.com',
        expected: true,
      },
      {
        desc:     'subdomain',
        value:    'sub.example.com',
        expected: true,
      },
      {
        desc:     'domain with port',
        value:    'example.com:8080',
        expected: true,
      },
      {
        desc:     'domain with path',
        value:    'example.com/path',
        expected: true,
      },
      {
        desc:     'https protocol prefix',
        value:    'https://example.com',
        expected: false,
      },
      {
        desc:     'http protocol prefix',
        value:    'http://example.com',
        expected: false,
      },
      {
        desc:     'ftp protocol prefix',
        value:    'ftp://example.com',
        expected: false,
      },
      {
        desc:     'single label (no dot)',
        value:    'localhost',
        expected: false,
      },
      {
        desc:     'TLD only one character',
        value:    'example.c',
        expected: false,
      },
      {
        desc:     'hyphen at start of label',
        value:    '-example.com',
        expected: false,
      },
      {
        desc:     'uppercase domain (case insensitive)',
        value:    'EXAMPLE.COM',
        expected: true,
      },
    ])('returns $expected for $desc', ({ value, expected }) => {
      expect(isDomainWithoutProtocol(value)).toStrictEqual(expected);
    });
  });

  describe('isLocalhost', () => {
    it.each([
      {
        desc:     'plain localhost',
        value:    'localhost',
        expected: true,
      },
      {
        desc:     'http localhost',
        value:    'http://localhost',
        expected: true,
      },
      {
        desc:     'https localhost',
        value:    'https://localhost',
        expected: true,
      },
      {
        desc:     'loopback ip',
        value:    '127.0.0.1',
        expected: true,
      },
      {
        desc:     'http loopback ip',
        value:    'http://127.0.0.1',
        expected: true,
      },
      {
        desc:     'uppercase LOCALHOST',
        value:    'LOCALHOST',
        expected: true,
      },
      {
        desc:     'remote domain',
        value:    'https://example.com',
        expected: false,
      },
      {
        desc:     'empty string',
        value:    '',
        expected: false,
      },
    ])('returns $expected for $desc', ({ value, expected }) => {
      expect(isLocalhost(value)).toStrictEqual(expected);
    });
  });

  describe('isValidUrl', () => {
    it.each([
      {
        desc:     'https url',
        value:    'https://example.com',
        expected: true,
      },
      {
        desc:     'http url',
        value:    'http://example.com',
        expected: true,
      },
      {
        desc:     'single label hostname (private networks)',
        value:    'https://rancher-ui',
        expected: true,
      },
      {
        desc:     'empty string',
        value:    '',
        expected: false,
      },
      {
        desc:     'non-string null',
        value:    null as any,
        expected: false,
      },
      {
        desc:     'domain without protocol',
        value:    'example.com',
        expected: false,
      },
      {
        desc:     'random text',
        value:    'not a url',
        expected: false,
      },
    ])('returns $expected for $desc', ({ value, expected }) => {
      expect(isValidUrl(value)).toStrictEqual(expected);
    });
  });

  describe('hasTrailingForwardSlash', () => {
    it.each([
      {
        desc:     'url with trailing slash',
        value:    'https://example.com/',
        expected: true,
      },
      {
        desc:     'url without trailing slash',
        value:    'https://example.com',
        expected: false,
      },
      {
        desc:     'url with path and trailing slash',
        value:    'https://example.com/path/',
        expected: true,
      },
      {
        desc:     'url with path without trailing slash',
        value:    'https://example.com/path',
        expected: false,
      },
      {
        desc:     'invalid url',
        value:    'not-a-url',
        expected: false,
      },
      {
        desc:     'empty string',
        value:    '',
        expected: false,
      },
    ])('returns $expected for $desc', ({ value, expected }) => {
      expect(hasTrailingForwardSlash(value)).toStrictEqual(expected);
    });
  });
});
