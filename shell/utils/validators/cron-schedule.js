import cronstrue from 'cronstrue';

export function cronSchedule(schedule = '', getters, errors) {
  try {
    cronstrue.toString(schedule);
  } catch (e) {
    errors.push(getters['i18n/t']('validation.invalidCron'));
  }
}
