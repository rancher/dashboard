// IP address format validation utilities extracted from the 'ip' npm package (https://github.com/indutny/node-ip)
// Done because this package is not actively maintained

const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
const ipv6Regex = /^(::)?(((\d{1,3}\.){3}(\d{1,3}){1})?([0-9a-f]){0,4}:{0,2}){1,8}(::)?$/i;

/**
 * Returns true if the given string matches IPv4 dotted-decimal format.
 * @param ip - The string to test (e.g. "192.168.1.1")
 * @returns Whether the string matches IPv4 format
 */
export function isV4Format(ip: string): boolean {
  return ipv4Regex.test(ip);
}

/**
 * Returns true if the given string matches IPv6 format.
 * @param ip - The string to test (e.g. "::1", "fe80::1")
 * @returns Whether the string matches IPv6 format
 */
export function isV6Format(ip: string): boolean {
  return ipv6Regex.test(ip);
}
