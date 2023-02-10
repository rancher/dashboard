/**
 * Appends search params to the current URL
 * @param key search key
 * @param value search value
 * @returns boolean
 */
export const appendSearchParams = ( key: string, value: string) => {
  const _url = new URL(window.location.href);
  const params = new URLSearchParams(_url.search);

  params.append(key, value);

  return window.history.replaceState({}, '', `${ _url.pathname }?${ params.toString() }`);
};
