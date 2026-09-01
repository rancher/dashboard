import { isEmpty } from '@shell/utils/object';

// spec = podSpec.affinity
export function podAffinity(spec, getters, errors) {
  if (!spec) {
    return;
  }
  const { podAffinity, podAntiAffinity } = spec;

  // pod affinity
  if (podAffinity && !isEmpty(podAffinity)) {
    const { preferredDuringSchedulingIgnoredDuringExecution = [], requiredDuringSchedulingIgnoredDuringExecution = [] } = podAffinity;

    preferredDuringSchedulingIgnoredDuringExecution.forEach((term, i) => {
      const errorOpts = {
        index: i,
        group: getters['i18n/t']('validation.podAffinity.affinityTitle'),
        rules: getters['i18n/t']('validation.podAffinity.preferredDuringSchedulingIgnoredDuringExecution')
      };

      validateTermWeight(term, errorOpts, getters, errors);

      const { podAffinityTerm = {} } = term;

      validateTopologyKey(podAffinityTerm, errorOpts, getters, errors);
      validateLabelSelector(podAffinityTerm, errorOpts, getters, errors);
    });

    requiredDuringSchedulingIgnoredDuringExecution.forEach((term, i) => {
      const errorOpts = {
        index: i,
        group: getters['i18n/t']('validation.podAffinity.affinityTitle'),
        rules: getters['i18n/t']('validation.podAffinity.requiredDuringSchedulingIgnoredDuringExecution')
      };

      validateTopologyKey(term, errorOpts, getters, errors);
      validateLabelSelector(term, errorOpts, getters, errors);
    });
  }

  // pod antiaffinity
  if (podAntiAffinity && !isEmpty(podAntiAffinity)) {
    const { preferredDuringSchedulingIgnoredDuringExecution = [], requiredDuringSchedulingIgnoredDuringExecution = [] } = podAntiAffinity;

    preferredDuringSchedulingIgnoredDuringExecution.forEach((term, i) => {
      const errorOpts = {
        index: i,
        group: getters['i18n/t']('validation.podAffinity.antiAffinityTitle'),
        rules: getters['i18n/t']('validation.podAffinity.preferredDuringSchedulingIgnoredDuringExecution')
      };

      validateTermWeight(term, errorOpts, getters, errors);

      const { podAffinityTerm = {} } = term;

      validateTopologyKey(podAffinityTerm, errorOpts, getters, errors);

      validateLabelSelector(podAffinityTerm, errorOpts, getters, errors);
    });

    requiredDuringSchedulingIgnoredDuringExecution.forEach((term, i) => {
      const errorOpts = {
        index: i,
        group: getters['i18n/t']('validation.podAffinity.antiAffinityTitle'),
        rules: getters['i18n/t']('validation.podAffinity.requiredDuringSchedulingIgnoredDuringExecution')
      };

      validateTopologyKey(term, errorOpts, getters, errors);

      validateLabelSelector(term, errorOpts, getters, errors);
    });
  }
}

// verify weight (if present) is integer 1-100
function validateTermWeight(affinityTerm, errorOpts, getters, errors) {
  const { weight = 1 } = affinityTerm;

  if (typeof weight !== 'number' || weight > 100 || weight < 1 ) {
    errors.push(getters['i18n/t']('validation.number.between', {
      key: getters['i18n/t']('workload.scheduling.matchExpressions.weight'),
      min: 1,
      max: 100,
      ...errorOpts
    }));
  }
}

// verify topology key is present and matches regexp for labels
function validateTopologyKey(affinityTerm, errorOpts, getters, errors) {
  const { topologyKey } = affinityTerm;
  const regexp = RegExp('([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9]');

  if (!topologyKey || !regexp.test(topologyKey)) {
    errors.push(getters['i18n/t']('validation.podAffinity.topologyKey', errorOpts));
  }
}

/*
    verify that each matchExpression in labelSelector:
    operator is one of ['In', 'NotIn', 'Exists', 'DoesNotExist']
    values is defined if operator is In or NotIn
    values is empty if operator is Exists or DoesNotExist
 */
function validateLabelSelector(affinityTerm, errorOpts, getters, errors) {
  const validOperators = ['In', 'NotIn', 'Exists', 'DoesNotExist'];

  const { labelSelector } = affinityTerm;

  if (labelSelector && !isEmpty(labelSelector)) {
    const { matchExpressions = [] } = labelSelector;

    matchExpressions.forEach((rule, i) => {
      const { operator, values } = rule;

      if (!validOperators.includes(operator)) {
        errors.push(getters['i18n/t']('validation.podAffinity.matchExpressions.operator', errorOpts));
      }
      if (operator === 'In' || operator === 'NotIn') {
        if (!values || !values.length) {
          errors.push(getters['i18n/t']('validation.podAffinity.matchExpressions.valuesMustBeDefined', errorOpts));
        }
      } else if (values && values.length) {
        errors.push(getters['i18n/t']('validation.podAffinity.matchExpressions.valueMustBeEmpty', errorOpts));
      }
    });
  }
}
