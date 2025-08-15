import isUrl from 'is-url';

// Note that these function cover specific use cases and you need to make sure it works for your use case before using them.
// ie they would consider empty values as valid, not all endpoint formatting is enforced

export const isServerUrl = (value) => value === 'server-url';

export const isHttps = (value) => value.toLowerCase().startsWith('https://');

export const isAWSStyleEndpoint = (value) => (/^(?!https?:\/\/)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?::\d{1,5})?(?:\/\S*)?$/).test(value);

export const isLocalhost = (value) => (/^(?:https?:\/\/)?(?:localhost|127\.0\.0\.1)/i).test(value);

export const hasTrailingForwardSlash = (value) => isUrl(value) && value?.toLowerCase().endsWith('/');
