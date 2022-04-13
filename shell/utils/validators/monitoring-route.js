import isEmpty from 'lodash/isEmpty';

export function matching(spec, getters, errors, validatorArgs) {
  if (isEmpty(spec?.match) && isEmpty(spec?.['match_re'])) {
    errors.push(getters['i18n/t']('validation.monitoring.route.match'));
  }
}

export function interval(value, getters, errors, validatorArgs, displayKey) {
  if (!/^\d+[hms]$/.test(value)) {
    errors.push(getters['i18n/t']('validation.monitoring.route.interval', { key: displayKey }));
  }
}
