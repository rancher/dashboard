import isEmpty from 'lodash/isEmpty';
import uniq from 'lodash/uniq';
import { get } from '@shell/utils/object';
import { camelToTitle } from '@shell/utils/string';

export function displayKeyFor(type, key, getters) {
  const intlPrefix = `model.${ type }.${ key }`;
  const intlPrefixLabel = `${ intlPrefix }.label`;

  if ( getters['i18n/exists'](`${ intlPrefix }.label`) ) {
    return getters['i18n/t'](intlPrefixLabel);
  }

  if ( getters['i18n/exists'](intlPrefix) ) {
    return getters['i18n/t'](intlPrefix);
  }

  if ( key.match(/.Id$/) ) {
    return camelToTitle(key.replace(/Id$/, ''));
  }

  return camelToTitle(key);
}

export function validateLength(val, field, displayKey, getters, errors = []) {
  const {
    nullable,
    required,
    type = '',
    minLength,
    maxLength,
    min: fieldMin,
    max: fieldMax,
  } = field;
  const len = val ? get(val, 'length') : 0;

  if ( !nullable && required) {
    if ((typeof val === 'object' && isEmpty(val)) || (!val && val !== 0)) {
      errors.push(getters['i18n/t']('validation.required', { key: displayKey }));

      return errors;
    }
  }

  if ( val === null ) {
    return errors;
  }

  const lengthKey = (type.indexOf('array[') === 0 ? 'arrayLength' : 'stringLength');

  // String and array length:
  let min = minLength;
  let max = maxLength;

  if ( min && max ) {
    if ( (len < min) || (len > max) ) {
      if ( min === max ) {
        errors.push(getters['i18n/t'](`validation.${ lengthKey }.exactly`, { key: displayKey, count: min }));
      } else {
        errors.push(getters['i18n/t'](`validation.${ lengthKey }.between`, {
          key: displayKey, min, max
        }));
      }
    }
  } else if ( min && (len < min) ) {
    errors.push(getters['i18n/t'](`validation.${ lengthKey }.min`, { key: displayKey, count: min }));
  } else if ( max && (len > max) ) {
    errors.push(getters['i18n/t'](`validation.${ lengthKey }.max`, { key: displayKey, count: max }));
  }

  // Number min/max
  min = fieldMin;
  max = fieldMax;

  if ( val !== null && min && max ) {
    if ( (val < min) || (val > max) ) {
      if ( min === max ) {
        errors.push(getters['i18n/t']('validation.number.exactly', { key: displayKey, val: max }));
      } else {
        errors.push(getters['i18n/t']('validation.number.between', {
          key: displayKey, min, max
        }));
      }
    }
  } else if ( min && (val < min) ) {
    errors.push(getters['i18n/t']('validation.number.min', { key: displayKey, val: min }));
  } else if ( max && (val > max) ) {
    errors.push(getters['i18n/t']('validation.number.max', { key: displayKey, val: max }));
  }

  return errors;
}

export function validateChars(val, field, displayKey, getters, errors = []) {
  const {
    validChars,
    invalidChars
  } = field;
  const test = [];

  if ( validChars ) {
    test.push(`[^${ field.validChars }]`);
  }

  if ( invalidChars ) {
    test.push(`[${ field.invalidChars }]`);
  }

  if ( test.length ) {
    const regex = new RegExp(`(${ test.join('|') })`, 'g');
    let match = val.match(regex);

    if ( match ) {
      match = uniq(match).map((chr) => {
        if ( chr === ' ' ) {
          return '[space]';
        } else {
          return chr;
        }
      });

      errors.push(getters['i18n/t']('validation.chars', {
        key: displayKey, count: match.length, chars: match.join(' ')
      }));
    }
  }

  return errors;
}

export function validateHostname(val, displayKey, getters, opts, errors = []) {
  opts = opts || {};

  const {
    max = 253,
    restricted = false,
  } = opts;

  // Hostname can not start with a dot
  if (val.slice(0, 1) === '.') {
    errors.push(getters['i18n/t']('validation.dns.hostname.startDot', { key: displayKey }));
  }

  // Hostname can not end with a dot in restricted mode
  if ( restricted && val.length > 1 && val.slice(-1) === '.' ) {
    errors.push(getters['i18n/t']('validation.dns.hostname.endDot', { key: displayKey }));
  }

  // Hostname can not be empty string
  if (val.length === 0) {
    errors.push(getters['i18n/t']('validation.dns.hostname.empty', { key: displayKey }));
  }

  // Total length of the hostname can be at most 253 characters
  // (255 minus one for null-termination, and one for the trailing dot of a real FQDN)
  if (val.length > max) {
    errors.push(getters['i18n/t']('validation.dns.hostname.tooLong', { key: displayKey, max }));
  }

  // Split the hostname with the dot and validate the element as label
  const labels = val.split(/\./);
  let label;

  for ( let i = 0 ; i < labels.length ; i++ ) {
    label = labels[i];

    // Already checked if Hostname starts with a dot
    if ( i === 0 && label === '' ) {
      continue;
    }

    // Hostname can end with a dot (this makes it an explicitly fully qualified domain name)
    // so the last element of the labels can be empty string.
    if (i === labels.length - 1 && label === '') {
      continue;
    }

    validateDnsLabel(label, displayKey, getters, { forHostname: true }, errors);
  }

  return errors;
}

export function validateDnsLabel(label, displayKey, getters, opts, errors = []) {
  opts = opts || {};

  const {
    invalidChars,
    forHostname = false,
    errorKey = (forHostname ? 'hostname' : 'label'),
    ianaServiceName = false,
    maxLength = 63,
    minLength = 1,
    restricted = false,
    validChars = 'A-Za-z0-9-',
  } = opts;

  // [a-z]([-a-z0-9]*[a-z0-9])?

  // Label must consist of a-z, 0-9 and hyphen
  validateChars(label, { validChars, invalidChars }, displayKey, getters, errors);

  // Restricted labels cannot begin with a number
  if ( restricted && label.slice(0, 1).match(/[0-9]/) ) {
    errors.push(getters['i18n/t'](`validation.dns.${ errorKey }.startNumber`, { key: displayKey }));
  }

  // Label cannot begin with a hyphen
  if ( label.slice(0, 1) === '-' ) {
    errors.push(getters['i18n/t'](`validation.dns.${ errorKey }.startHyphen`, { key: displayKey }));
  }

  // Label cannot end with a hyphen
  if ( label.slice(-1) === '-' ) {
    errors.push(getters['i18n/t'](`validation.dns.${ errorKey }.endHyphen`, { key: displayKey }));
  }

  // Label cannot contain two consecutive hyphens at the 3rd & 4th characters, unless an IDN string
  // If is of type ianaServiceName can not contain two consecutive hyphens in any position
  if (
    ( label.substr(2, 2) === '--' && label.substr(0, 2) !== 'xn' ) ||
    ( ianaServiceName && label.includes('--') )
  ) {
    errors.push(getters['i18n/t'](`validation.dns.doubleHyphen`, { key: displayKey }));
  }

  // Label must be 1-63 characters
  const min = minLength;
  const max = maxLength;

  if ( label.length < min ) {
    errors.push(getters['i18n/t'](`validation.dns.${ errorKey }.emptyLabel`, { key: displayKey, min }));
  } else if ( label.length > max ) {
    errors.push(getters['i18n/t'](`validation.dns.${ errorKey }.tooLongLabel`, { key: displayKey, max }));
  }

  return errors;
}

export function validateDnsLikeTypes(val, type, displayKey, getters, opts, errors = []) {
  switch (type) {
  case 'dnsLabel':
    validateDnsLabel(val, displayKey, getters, { restricted: false }, errors);
    break;
  case 'dnsLabelRestricted':
    validateDnsLabel(val, displayKey, getters, { restricted: true }, errors);
    break;
  case 'hostname':
    validateHostname(val, displayKey, getters, { restricted: false }, errors);
    break;
  default:
    break;
  }

  return errors;
}

export function validateBoolean(val, field, displayKey, getters, errors = []) {
  const { required } = field;

  if (required && !val && val !== false) {
    errors.push(getters['i18n/t']('validation.required', { key: displayKey }));

    return;
  }
  if (typeof val !== 'boolean' && !!val) {
    errors.push(getters['i18n/t']('validation.boolean', { key: displayKey }));
  }
}
