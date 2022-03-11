const httpsKeys = [
  'server-url'
];

export function isHttps(value, getters, errors, validatorArgs, displayKey) {
  const key = validatorArgs[0];

  if (httpsKeys.includes(key) && !value.toLowerCase().startsWith('https://')) {
    errors.push(getters['i18n/t']('validation.setting.serverUrl.https'));
  }

  return errors;
}

export function backupTarget(value, getters, errors, validatorArgs) {
  const t = getters['i18n/t'];

  const parseValue = JSON.parse(value);
  const type = parseValue.type;

  if (!type) {
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

  if (!parseValue.endpoint) {
    errors.push(t('validation.required', { key: 'endpoint' }));
  }

  return errors;
}
