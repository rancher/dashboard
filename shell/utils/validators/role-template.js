import { RBAC } from '@shell/config/types';
import isEmpty from 'lodash/isEmpty';

export function roleTemplateRules(rules = [], getters, errors, validatorArgs = []) {
  if (rules.some(rule => isEmpty(rule.verbs))) {
    errors.push(getters['i18n/t']('validation.roleTemplate.roleTemplateRules.missingVerb'));
  }

  if (validatorArgs[0] === RBAC.ROLE) {
    if (rules.some(rule => isEmpty(rule.resources))) {
      errors.push(getters['i18n/t']('validation.roleTemplate.roleTemplateRules.missingResource'));
    }
    if (rules.some(rule => isEmpty(rule.apiGroups))) {
      errors.push(getters['i18n/t']('validation.roleTemplate.roleTemplateRules.missingApiGroup'));
    }
  } else if (rules.some(rule => isEmpty(rule.resources) && isEmpty(rule.nonResourceURLs) && isEmpty(rule.apiGroups))) {
    errors.push(getters['i18n/t']('validation.roleTemplate.roleTemplateRules.missingOneResource'));
  }
}
