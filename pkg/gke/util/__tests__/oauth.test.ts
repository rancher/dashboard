import { getValueFromGKEOauthScopes, addGKEAuthScope } from '@pkg/gke/util/oauth';

const defaultScopes = [
  'https://www.googleapis.com/auth/devstorage.read_only',
  'https://www.googleapis.com/auth/logging.write',
  'https://www.googleapis.com/auth/monitoring',
  'https://www.googleapis.com/auth/servicecontrol',
  'https://www.googleapis.com/auth/service.management.readonly',
  'https://www.googleapis.com/auth/trace.append'
];

describe('fx: getValueFromGKEOauthScopes', () => {
  it.each([
    ['monitoring', 'monitoring'],
    ['service.management', 'service.management.readonly'],
    ['compute', 'none']
  ])('should search oauth scopes array and return matching value for a given api key', (apiKey, expectedScope) => {
    expect(getValueFromGKEOauthScopes([...defaultScopes], apiKey)).toStrictEqual(expectedScope);
  });
});

describe('fx: addGKEAuthScope', () => {
  it('should add auth scope url when provided a api key/value', () => {
    const oauthScopes: string[] = [];

    expect(addGKEAuthScope(oauthScopes, 'logging', 'logging.write')).toStrictEqual(['https://www.googleapis.com/auth/logging.write']);
  });

  it('should remove auth scope url when provided a \'none\' key', () => {
    const oauthScopes = [...defaultScopes];

    expect(addGKEAuthScope(oauthScopes, 'monitoring', 'none').find((s:string) => s.includes('monitoring'))).toBeUndefined();
  });

  it('should remove the previous auth scope url when changing an apis scope value', () => {
    const oauthScopes = [...defaultScopes];
    const neu = addGKEAuthScope(oauthScopes, 'logging', 'logging.admin');

    expect(neu.find((s: string) => s === 'https://www.googleapis.com/auth/logging.write')).toBeUndefined();
    expect(neu.find((s: string) => s === 'https://www.googleapis.com/auth/logging.admin')).toBeDefined();
  });
});
