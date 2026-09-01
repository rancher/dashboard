export function clusterName(pathValue, getters, errors, validatorArgs, displayKey) {
  const isRke2 = validatorArgs[0] === 'true'
;

  if (isRke2) {
    if ((pathValue || '').match(/^(c-.{5}|local)$/i)) {
      errors.push(getters['i18n/t']('validation.cluster.name'));
    }
  }

  return errors;
}
