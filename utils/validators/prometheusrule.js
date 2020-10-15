import { has, isEmpty } from 'lodash';

export function ruleGroups(spec, getters, errors, validatorArgs) {
  if (isEmpty(spec?.groups)) {
    errors.push(getters['i18n/t']('validation.prometheusRule.groups.required'));
  }

  return errors;
}

export function groupsAreValid(groups, getters, errors, validatorArgs) {
  groups.forEach((group, groupIndex) => {
    if (isEmpty(group?.name)) {
      errors.push(getters['i18n/t']('validation.prometheusRule.groups.valid.name', { index: groupIndex }));
    }

    if (isEmpty(group?.rules)) {
      errors.push(getters['i18n/t']('validation.prometheusRule.groups.valid.singleEntry', { index: groupIndex }));
    } else {
      group.rules.forEach((rule, ruleIndex) => {
        if (has(rule, 'alert') && isEmpty(rule?.alert)) {
          errors.push(getters['i18n/t']('validation.prometheusRule.groups.valid.rule.alertName', { groupIndex, ruleIndex }));
        } else if (has(rule, 'record') && isEmpty(rule?.record)) {
          errors.push(getters['i18n/t']('validation.prometheusRule.groups.valid.rule.recordName', { groupIndex, ruleIndex }));
        }

        if ((has(rule, 'expr') && isEmpty(rule.expr)) || !has(rule, 'expr')) {
          errors.push(getters['i18n/t']('validation.prometheusRule.groups.valid.rule.expr', { groupIndex, ruleIndex }));
        }

        if (has(rule, 'alert')) {
          if ((has(rule, 'labels') && isEmpty(rule.labels)) || !has(rule, 'labels')) {
            errors.push(getters['i18n/t']('validation.prometheusRule.groups.valid.rule.labels', { groupIndex, ruleIndex }));
          }
        }
      });
    }
  });

  return errors;
}
