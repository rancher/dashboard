export function backupTarget(value, getters, errors, validatorArgs) {
  const t = getters['i18n/t'];

  const parseValue = JSON.parse(value);
  const type = parseValue.type;

  if (!type) {
    errors.push(t('validation.required', { key: 'Type' }));
  }

  if (!parseValue.endpoint) {
    return errors;
  }

  if (type === 's3') {
    if (!parseValue.accessKeyId) {
      errors.push(t('validation.required', { key: 'accessKeyId' }));
    }

    if (!parseValue.secretAccessKey) {
      errors.push(t('validation.required', { key: 'secretAccessKey' }));
    }

    if (!parseValue.bucketRegion) {
      errors.push(t('validation.required', { key: 'bucketRegion' }));
    }

    if (!parseValue.bucketName) {
      errors.push(t('validation.required', { key: 'bucketName' }));
    }
  }

  return errors;
}
