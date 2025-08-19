import {
  isServerUrl,
  isHttps,
  isDomainWithoutProtocol,
  isLocalhost,
  hasTrailingForwardSlash,
} from '@shell/utils/validators/setting';

describe('isServerUrl', () => {
  it.each([
    ['server-url', true],
    ['SERVER-URL', false],
    ['server-url/', false],
    ['not-server-url', false],
    ['', false],
  ])('should validate that isServerUrl("%s") returns %s', (input, expected) => {
    expect(isServerUrl(input)).toBe(expected);
  });
});

describe('isHttps', () => {
  it.each([
    ['https://example.com', true],
    ['HTTPS://EXAMPLE.COM', true],
    ['http://example.com', false],
    ['ftp://example.com', false],
    ['example.com', false],
    ['', false],
  ])('should validate that isHttps("%s") returns %s', (input, expected) => {
    expect(isHttps(input)).toBe(expected);
  });
});

describe('isDomainWithoutProtocol (follows domain format, no protocol)', () => {
  it.each([
    ['ec2.us-west-2.amazonaws.com', true],
    ['ec2.us-west-2.api.aws', true],
    ['ec2.us-west-2.amazonaws.com.cn', true],
    ['s3.eu-central-1.amazonaws.com.cn', true],
    ['my-service.internal.net', true],
    ['db.example.org:5432', true],
    ['ex.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.com', true],
    ['service.company.local/path/to/resource', true],
    ['example.org:443', true],
    ['https://ec2.us-west-2.amazonaws.com', false],
    ['http://example.com', false],
    ['udp://example.com', false],
    ['ftp://example.com', false],
    ['ftps://example.com', false],
    ['example://example.com', false],
    ['example', false],
    ['-bad.example.com', false],
    ['bad-.example.com', false],
    ['example.c', false],
    ['exa mple.com', false],
    ['exa.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.example.com', false],
    ['', false],
  ])('should validate that isDomainWithoutProtocol("%s") returns %s', (input, expected) => {
    expect(isDomainWithoutProtocol(input)).toBe(expected);
  });
});

describe('isLocalhost', () => {
  it.each([
    ['localhost', true],
    ['LOCALHOST', true],
    ['http://localhost', true],
    ['https://localhost:3000', true],
    ['127.0.0.1', true],
    ['http://127.0.0.1:8080/path', true],
    ['HTTPS://127.0.0.1/Health', true],
    ['127.0.0.2', false],
    ['http://127.0.0.2', false],
    ['mylocalhost', false],
  ])('should validate that isLocalhost("%s") returns %s', (input, expected) => {
    expect(isLocalhost(input)).toBe(expected);
  });
});

describe('hasTrailingForwardSlash', () => {
  it.each([
    ['https://example.com/', true],
    ['http://example.com/', true],
    ['HTTPS://EXAMPLE.COM/', true],
    ['https://example.com/path/', true],
    ['https://example.com', false],
    ['http://example.com/path', false],
    ['example.com/', false],
  ])('should validate that hasTrailingForwardSlash("%s") returns %s', (input, expected) => {
    expect(hasTrailingForwardSlash(input)).toBe(expected);
  });
});
