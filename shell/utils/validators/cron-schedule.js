import cronstrue from 'cronstrue';

export function cronSchedule(schedule = '', getters, errors) {
  try {
    cronScheduleRule.validation(schedule);
  } catch (e) {
    errors.push(getters['i18n/t'](cronScheduleRule.message));
  }
}

export const cronScheduleRule = {
  validation: (text) => cronstrue.toString(text, { verbose: true }),
  message:    'validation.invalidCron'
};
