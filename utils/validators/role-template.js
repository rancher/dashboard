import isEmpty from 'lodash/isEmpty';

export function roleTemplateRules(rules = [], getters, errors, validatorArgs) {
  if (rules.some(rule => isEmpty(rule.verbs))) {
    errors.push(getters['i18n/t']('validation.roleTemplate.roleTemplateRules.missingVerb'));
  }

  if (rules.some(rule => isEmpty(rule.resources) && isEmpty(rule.nonResourceURLs) && isEmpty(rule.apiGroups))) {
    errors.push(getters['i18n/t']('validation.roleTemplate.roleTemplateRules.missingResource'));
  }
}
