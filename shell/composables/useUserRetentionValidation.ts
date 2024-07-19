import { Ref, ComputedRef, ref, computed } from 'vue';

import { SETTING } from '@shell/config/settings';
import { useStore } from '@shell/composables/useStore';
import { useI18n } from '@shell/composables/useI18n';
import type { Setting } from '@shell/types/resources/settings';

import { isValidCron } from 'cron-validator';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

interface UseUserRetentionValidation {
  validateUserRetentionCron: (cronSetting: string | null) => string | undefined;
  validateDeleteInactiveUserAfter: (duration: string) => string | undefined;
  validateDurationAgainstAuthUserSession: (duration: string) => string | undefined;
  setValidation: (formField: string, isValid: boolean) => void;
  removeCronValidation: () => void;
  addCronValidation: () => void;
  isFormValid: ComputedRef<boolean>;
}

export const useUserRetentionValidation = (disableAfterPeriod: Ref<boolean>, deleteAfterPeriod: Ref<boolean>, authUserSessionTtlMinutes: Ref<Setting | null>): UseUserRetentionValidation => {
  const store = useStore();
  const { t } = useI18n(store);

  /**
   * Tracks the validation state for user retention fields
   */
  const validation = ref({
    [SETTING.DISABLE_INACTIVE_USER_AFTER]: true,
    [SETTING.DELETE_INACTIVE_USER_AFTER]:  true,
    [SETTING.USER_RETENTION_CRON]:         true,
  });

  const isFormValid = computed(() => {
    const validations = validation.value;

    return !Object.values(validations).includes(false);
  });

  const setValidation = (formField: string, isValid: boolean) => {
    validation.value[formField] = isValid;
  };

  const removeCronValidation = () => {
    const { [SETTING.USER_RETENTION_CRON]: _, ...rest } = validation.value;

    validation.value = rest;
  };

  const addCronValidation = () => {
    validation.value = {
      ...validation.value,
      [SETTING.USER_RETENTION_CRON]: true,
    };
  };

  /**
   * Takes a duration string and produces a dayjs duration object.
   * @param duration Duration string in {h|m|s} (e.g. 6h3m2s)
   * @returns Day.js duration object
   */
  const parseDuration = (duration: string) => {
    const durationPattern = /^(\d+)h|(\d+)m|(\d+)s$/;
    const match = duration?.match(durationPattern);

    if (!match) {
      throw new Error('Invalid duration format. Accepted duration units are Hours, Minutes, and Seconds ({h|m|s})');
    }

    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;

    return dayjs.duration({
      hours, minutes, seconds
    });
  };

  /**
   * Asserts that a given string is a valid cron expression
   * @param cronSetting Cron expression to test
   * @returns Undefined if cron expression is valid; Error string for an invalid
   * cron expression.
   */
  const validateUserRetentionCron = (cronSetting: string | null): string | undefined => {
    // Only require user retention cron when disable or delete after are active
    if (!disableAfterPeriod.value && !deleteAfterPeriod.value) {
      return;
    }

    if (
      !cronSetting ||
      (typeof cronSetting === 'string' && !isValidCron(cronSetting))
    ) {
      return t('user.retention.edit.form.cron.errorMessage');
    }
  };

  /**
   * Asserts that the provided duration is greater than the default minimum of
   * 336h
   * @param duration Duration string in {h|m|s} (e.g. 6h3m2s)
   * @returns Undefined if duration is valid; Error string for an invalid
   * duration
   */
  const validateDeleteInactiveUserAfter = (duration: string): string | undefined => {
    try {
      const inputDuration = parseDuration(duration);
      const minDuration = dayjs.duration({ hours: 336 });

      if (inputDuration.asMilliseconds() < minDuration.asMilliseconds()) {
        return `Invalid value: "${ duration }": must be at least 336h0m0s`;
      }
    } catch (error: any) {
      return error.message;
    }
  };

  /**
   * Asserts that the provided duration is not less than the user session TTL
   * @param duration Duration string in {h|m|s} (e.g. 6h3m2s)
   * @returns Undefined if duration is valid; Error string for an invalid
   * duration
   */
  const validateDurationAgainstAuthUserSession = (duration: string): string | undefined => {
    try {
      const inputDuration = parseDuration(duration);
      const minDuration = dayjs.duration({ minutes: authUserSessionTtlMinutes.value?.value });

      if (inputDuration.asMilliseconds() < minDuration.asMilliseconds()) {
        return `Invalid value: "${ duration }": must be at least ${ SETTING.AUTH_USER_SESSION_TTL_MINUTES } (${ authUserSessionTtlMinutes.value?.value }m)`;
      }
    } catch (error: any) {
      return error.message;
    }
  };

  return {
    validateUserRetentionCron,
    validateDeleteInactiveUserAfter,
    validateDurationAgainstAuthUserSession,
    setValidation,
    removeCronValidation,
    addCronValidation,
    isFormValid,
  };
};
