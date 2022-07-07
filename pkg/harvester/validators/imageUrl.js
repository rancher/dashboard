export const VM_IMAGE_FILE_FORMAT = ['qcow', 'qcow2', 'raw', 'img', 'iso'];

export default function imageUrl(url, getters, errors, validatorArgs, type) {
  const t = getters['i18n/t'];

  if (!url || url === '') {
    return errors;
  }

  const suffixName = url.split('/').pop();
  const fileSuffix = suffixName
    .split('.')
    .pop()
    .toLowerCase();

  if (!VM_IMAGE_FILE_FORMAT.includes(fileSuffix)) {
    const tipString =
      type === 'file' ? 'harvester.validation.image.ruleFileTip' : 'harvester.validation.image.ruleTip';

    errors.push(t(tipString));
  }

  return errors;
}
