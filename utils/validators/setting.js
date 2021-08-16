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
