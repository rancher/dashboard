import { IMAGE_FILE_FORMAT } from '@/config/constant';

export function imageUrl(url, getters, errors, validatorArgs, type) {
  const t = getters['i18n/t'];

  if (!url || url === '') {
    return errors;
  }

  const suffixName = url.split('/').pop();
  const fileSuffiic = suffixName.split('.').pop().toLowerCase();

  if (!IMAGE_FILE_FORMAT.includes(fileSuffiic)) {
    const tipString = type === 'file' ? 'harvester.validation.image.ruleFileTip' : 'harvester.validation.image.ruleTip';

    errors.push(t(tipString));
  }

  return errors;
}
