import cronstrue from 'cronstrue';
import { isValidCron } from 'cron-validator';

const PREDEFINED_SCHEDULES = [
  '@yearly',
  '@annually',
  '@monthly',
  '@weekly',
  '@daily',
  '@midnight',
  '@hourly'
];

/**
 * Whether a schedule is a predefined alias (e.g. `@daily`) or a five field cron expression.
 *
 * @param {string} schedule the cron schedule
 * @returns {boolean} true when the schedule is valid
 */
export function isValidCronSchedule(schedule) {
  if (PREDEFINED_SCHEDULES.includes(schedule)) {
    return true;
  }

  return isValidCron(schedule, {
    alias:              true,
    allowBlankDay:      true,
    allowSevenAsSunday: true,
  });
}

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
