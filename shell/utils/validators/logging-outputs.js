import isEmpty from 'lodash/isEmpty';

export function logdna(value, getters, errors, validatorArgs) {
  if (isEmpty(value)) {
    return;
  }

  if (isEmpty(value.api_key)) {
    errors.push(getters['i18n/t']('validation.output.logdna.apiKey'));
  }
}
