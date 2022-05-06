import { validateChars } from './index';

export function validateKubernetesName(label, displayKey, getters, opts, errors = []) {
  opts = opts || {};

  const {
    invalidChars,
    forHostname = false,
    errorKey = (forHostname ? 'hostname' : 'label'),
    maxLength = 63,
    minLength = 1,
    validChars = 'A-Za-z0-9-',
  } = opts;

  // Label must consist of a-z, 0-9 and hyphen
  validateChars(label, { validChars, invalidChars }, displayKey, getters, errors);

  // Label cannot begin with a hyphen
  if ( label.slice(0, 1) === '-' ) {
    errors.push(getters['i18n/t'](`validation.dns.${ errorKey }.startHyphen`, { key: displayKey }));
  }

  // Label cannot end with a hyphen
  if ( label.slice(-1) === '-' ) {
    errors.push(getters['i18n/t'](`validation.dns.${ errorKey }.endHyphen`, { key: displayKey }));
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
