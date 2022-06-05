import { get } from '@shell/utils/object';

export function containerImages(spec, getters, errors) {
  let podSpec;

  if (spec.jobTemplate) {
    // cronjob pod template is nested slightly different than other types
    podSpec = get(spec, 'jobTemplate.spec.template.spec');
  } else {
    podSpec = get(spec, 'template.spec');
  }

  if (!podSpec.containers || !podSpec.containers.length) {
    errors.push(getters['i18n/t']('validation.required', { key: getters['i18n/t']('workload.container.titles.containers') }));

    return;
  }

  podSpec.containers.forEach((container) => {
    if (container && !container.image) {
      errors.push(getters['i18n/t']('workload.validation.containerImage', { name: container.name }));
    }
  });
}
