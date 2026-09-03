import ipaddr from 'ipaddr.js';

const validCIDRregex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(3[0-2]|2[0-9]|1[0-9]|[0-9])$/;

export function isValidCIDR(cidr) {
  if (!validCIDRregex.test(cidr)) {
    // Try IPv6 CIDR using ipaddr.js
    try {
      const [ip, prefixLen] = cidr.split('/');
      const ipObj = ipaddr.parse(ip);
      const prefix = parseInt(prefixLen, 10);

      if (ipObj instanceof ipaddr.IPv6) {
        return prefix >= 0 && prefix <= 128;
      }

      if (ipObj instanceof ipaddr.IPv4) {
        return prefix >= 0 && prefix <= 32;
      }
    } catch {
      return false;
    }

    return false;
  }

  return true;
}

export function isValidIP(ip) {
  return !!ip && (ipaddr.IPv4.isValidFourPartDecimal(ip) || ipaddr.IPv6.isValid(ip));
}

export function isValidMac(value) {
  return /^[A-Fa-f0-9]{2}(-[A-Fa-f0-9]{2}){5}$|^[A-Fa-f0-9]{2}(:[A-Fa-f0-9]{2}){5}$/.test(value);
}
