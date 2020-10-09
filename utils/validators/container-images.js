export function containerImages(spec, getters, errors) {
  let container;

  if (spec.jobTemplate) {
    // cronjob pod template is nested slightly different than other types
    const { jobTemplate: { spec: { template: { spec: { containers = [] } } } } } = spec;

    container = containers[0] || {};
  } else {
    const { template:{ spec:{ containers = [] } } } = spec;

    container = containers[0] || {};
  }

  if (!container.image) {
    errors.push(getters['i18n/t']('validation.required', { key: getters['i18n/t']('workload.container.image') }));
  }
}
