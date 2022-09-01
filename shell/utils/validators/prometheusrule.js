import has from 'lodash/has';
import isEmpty from 'lodash/isEmpty';

export function ruleGroups(spec, getters, errors, validatorArgs) {
  if (isEmpty(spec?.groups)) {
    errors.push(getters['i18n/t']('validation.prometheusRule.groups.required'));
  }

  return errors;
}

export function groupsAreValid(groups = [], getters, errors, validatorArgs) {
  groups.forEach((group, groupIndex) => {
    const readableGroupIndex = groupIndex + 1; // oh that ol zero based array index....

    if (isEmpty(group?.name)) {
      errors.push(
        getters['i18n/t']('validation.prometheusRule.groups.valid.name', { index: readableGroupIndex })
      );
    }

    if (isEmpty(group?.rules)) {
      errors.push(
        getters['i18n/t'](
          'validation.prometheusRule.groups.valid.singleEntry',
          { index: readableGroupIndex }
        )
      );
    } else {
      group.rules.forEach((rule, ruleIndex) => {
        const readableRuleIndex = ruleIndex + 1; // oh that ol zero based array index....

        if (has(rule, 'alert') && isEmpty(rule?.alert)) {
          errors.push(
            getters['i18n/t'](
              'validation.prometheusRule.groups.valid.rule.alertName',
              { groupIndex: readableGroupIndex, ruleIndex: readableRuleIndex }
            )
          );
        } else if (has(rule, 'record') && isEmpty(rule?.record)) {
          errors.push(
            getters['i18n/t'](
              'validation.prometheusRule.groups.valid.rule.recordName',
              { groupIndex: readableGroupIndex, ruleIndex: readableRuleIndex }
            )
          );
        }

        if ((has(rule, 'expr') && isEmpty(rule.expr)) || !has(rule, 'expr')) {
          errors.push(
            getters['i18n/t'](
              'validation.prometheusRule.groups.valid.rule.expr',
              { groupIndex: readableGroupIndex, ruleIndex: readableRuleIndex }
            )
          );
        }

        if (has(rule, 'alert')) {
          if (
            (has(rule, 'labels') && isEmpty(rule.labels)) ||
            !has(rule, 'labels')
          ) {
            errors.push(
              getters['i18n/t'](
                'validation.prometheusRule.groups.valid.rule.labels',
                { groupIndex: readableGroupIndex, ruleIndex: readableRuleIndex }
              )
            );
          }
        }
      });
    }
  });

  return errors;
}
