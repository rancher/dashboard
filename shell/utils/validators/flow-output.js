import isEmpty from 'lodash/isEmpty';

export function flowOutput(spec, getters, errors, validatorArgs) {
  const verifyLocal = validatorArgs.includes('verifyLocal');
  const localOutputRefs = spec.localOutputRefs || [];
  const globalOutputRefs = spec.globalOutputRefs || [];

  if (verifyLocal) {
    if (isEmpty(localOutputRefs) && isEmpty(globalOutputRefs)) {
      errors.push(getters['i18n/t']('validation.flowOutput.both'));
    }
  } else if (isEmpty(globalOutputRefs)) {
    errors.push(getters['i18n/t']('validation.flowOutput.global'));
  }
}
