import isUrl from 'is-url';

export const isServerUrl = (value) => value === 'server-url';

export const isHttps = (value) => value.toLowerCase().startsWith('https://');

export const isHttpsOrHttp = (value) => {
    if (typeof value !== 'string') {
        return false; // Or throw new Error('Input is not a string');
    }
  return value.toLowerCase().startsWith('https://') || value.toLowerCase().startsWith('http://');
};

export const isLocalhost = (value) => (/^(?:https?:\/\/)?(?:localhost|127\.0\.0\.1)/i).test(value);

export const hasTrailingForwardSlash = (value) => isUrl(value) && value?.toLowerCase().endsWith('/');
