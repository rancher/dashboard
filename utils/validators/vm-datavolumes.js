import { formatSi, parseSi } from '@/utils/units';

export function dataVolumeSize(storage, getters, errors, validatorArgs) {
  const t = getters['i18n/t'];

  if (!storage || storage === '') {
    const key = t('harvester.volume.size');

    errors.push(t('validation.required', { key }));

    return errors;
  }

  const size = getSize(storage);
  const max = 999999;
  const integerRegex = /^[1-9]\d*$/;

  if (!integerRegex.test(size) || size > max) {
    errors.push(t('harvester.validation.sizeRange'));
  }

  return errors;
}

export function dataVolumeImage(annotations, getters, errors) {
  const t = getters['i18n/t'];
  const key = t('harvester.fields.image');

  if (!annotations?.['harvesterhci.io/imageId']) {
    errors.push(t('validation.required', { key }));
  }

  return errors;
}

function getSize(storage) {
  if (!storage) {
    return null;
  }

  const kibUnitSize = parseSi(storage);

  return formatSi(kibUnitSize, {
    addSuffix:   false,
    increment:   1024,
    minExponent: 3,
    maxExponent: 3
  });
}
