import isUrl from 'is-url';

// Note that these function cover specific use cases and you need to make sure it works for your use case before using them.
// ie they would consider empty values as valid, not all endpoint formatting is enforced

export const isServerUrl = (value) => value === 'server-url';

export const isHttps = (value) => value.toLowerCase().startsWith('https://');

/**
 * Checks that provided string is a domain without protocol (case insensitive):
 * - Cannot start with any protocol, such as http://, https://, ftp://, ftps://, udp://
 * - Must only use the letters a to z, the numbers 0 to 9, and the dot (.) and hyphen (-) characters.
 * - if the hyphen character is used in a domain name, it cannot be the first or the last character in the name.
 * - The length of each label can be 2-63 characters
 * - TLD is at least 2 characters
 * - The total length of a domain name, including the dot at the end, cannot exceed 254 characters.
 * - Allows for optional port and path
 * @param {*} value
 * @returns boolean indicating if the value is a domain without protocol
 */
export const isDomainWithoutProtocol = (value) => (/^(?=.{1,254}$)(?![a-z][a-z0-9+.-]*:\/\/)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?::\d{1,5})?(?:\/\S*)?$/i).test(value);

export const isLocalhost = (value) => (/^(?:https?:\/\/)?(?:localhost|127\.0\.0\.1)/i).test(value);

export const hasTrailingForwardSlash = (value) => isUrl(value) && value?.toLowerCase().endsWith('/');
