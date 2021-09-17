import { VM_IMAGE_FILE_FORMAT } from '@/models/harvester/harvesterhci.io.virtualmachineimage';
import { HCI } from '@/config/labels-annotations';

export function imageUrl(url, getters, errors, validatorArgs, type) {
  const t = getters['i18n/t'];

  if (!url || url === '') {
    return errors;
  }

  const suffixName = url.split('/').pop();
  const fileSuffiic = suffixName.split('.').pop().toLowerCase();

  if (!VM_IMAGE_FILE_FORMAT.includes(fileSuffiic)) {
    const tipString = type === 'file' ? 'harvester.validation.image.ruleFileTip' : 'harvester.validation.image.ruleTip';

    errors.push(t(tipString));
  }

  return errors;
}

export function fileRequired(annotaions = {}, getters, errors, validatorArgs, type) {
  const t = getters['i18n/t'];

  if (!annotaions[HCI.IMAGE_NAME]) {
    errors.push(t('validation.required', { key: t('harvester.image.fileName') }));
  }

  return errors;
}
