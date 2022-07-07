import { HCI } from '@shell/config/labels-annotations';

export default function fileRequired(annotations = {}, getters, errors, validatorArgs, type) {
  const t = getters['i18n/t'];

  if (!annotations[HCI.IMAGE_NAME]) {
    errors.push(t('validation.required', { key: t('harvester.image.fileName') }));
  }

  return errors;
}
