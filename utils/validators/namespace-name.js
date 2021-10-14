export function namespaceName(pathValue, getters, errors, validatorArgs, displayKey) {
  if (!(pathValue || '').match(/[a-z0-9]([-a-z0-9]*[a-z0-9])?/)) {
    errors.push(getters['i18n/t']('validation.namespaceName'));
  }

  return errors;
}
