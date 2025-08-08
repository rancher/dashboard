import isUrl from 'is-url';

export const isServerUrl = (value) => value === 'server-url';

export const isHttps = (value) => value.toLowerCase().startsWith('https://');

export const isHttpsOrHttp = (value) => {
  if (typeof value !== 'string') {
    return false; 
  }

  const lowerCaseValue = value.toLowerCase();

  return lowerCaseValue.startsWith('https://') || lowerCaseValue.startsWith('http://');
};

export const isLocalhost = (value) => (/^(?:https?:\/\/)?(?:localhost|127\.0\.0\.1)/i).test(value);

export const hasTrailingForwardSlash = (value) => isUrl(value) && value?.toLowerCase().endsWith('/');
