import { HCI } from '@shell/config/labels-annotations';

export const VM_IMAGE_FILE_FORMAT = ['qcow', 'qcow2', 'raw', 'img', 'iso'];

export function imageUrl(url, getters, errors, validatorArgs, type) {
  const t = getters['i18n/t'];

  if (!url || url === '') {
    return errors;
  }

  const suffixName = url.split('/').pop();
  const fileSuffix = suffixName.split('.').pop().toLowerCase();

  if (!VM_IMAGE_FILE_FORMAT.includes(fileSuffix)) {
    const tipString = type === 'file' ? 'harvester.validation.image.ruleFileTip' : 'harvester.validation.image.ruleTip';

    errors.push(t(tipString));
  }

  return errors;
}

export function fileRequired(annotations = {}, getters, errors, validatorArgs, type) {
  const t = getters['i18n/t'];

  if (!annotations[HCI.IMAGE_NAME]) {
    errors.push(t('validation.required', { key: t('harvester.image.fileName') }));
  }

  return errors;
}

export function displayName(displayName, getters, errors, validatorArgs) {
  const t = getters['i18n/t'];
  // https://kubernetes.io/docs/concepts/overview/working-with-objects/names/
  const regex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;

  if (!regex.test(displayName)) {
    errors.push(t('harvester.image.displayNameValidate'));
  }

  return errors;
}
