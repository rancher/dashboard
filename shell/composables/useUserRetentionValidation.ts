import { Ref, ref, computed } from 'vue';

import { SETTING } from '@shell/config/settings';
import { useStore } from '@shell/composables/useStore';
import { useI18n } from '@shell/composables/useI18n';

import { isValidCron } from 'cron-validator';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

type Links = {
  remove: string;
  self: string;
  update: string;
  view: string;
};

type FieldsV1 = {
  'f:customized': {};
  'f:default': {};
  'f:source': {};
  'f:value': {};
};

type ManagedFields = {
  apiVersion: string;
  fieldsType: string;
  fieldsV1: FieldsV1;
  manager: string;
  operation: string;
  time: string;
};

type Metadata = {
  creationTimestamp: string;
  fields: string[];
  generation: number;
  managedFields: ManagedFields[];
  name: string;
  relationships: null;
  resourceVersion: string;
  state: {
    error: boolean;
    message: string;
    name: string;
    transitioning: boolean;
  };
  uid: string;
};

export type Setting = {
  id: string;
  type: string;
  links: Links;
  apiVersion: string;
  customized: boolean;
  default: string;
  kind: string;
  metadata: Metadata;
  source: string;
  value: string | null;
  save: () => void;
};

export const useUserRetentionValidation = (disableAfterPeriod: Ref<boolean>, deleteAfterPeriod: Ref<boolean>, authUserSessionTtlMinutes: Ref<Setting | null>) => {
  const store = useStore();
  const { t } = useI18n(store);

  const validation = ref({
    [SETTING.DISABLE_INACTIVE_USER_AFTER]: true,
    [SETTING.DELETE_INACTIVE_USER_AFTER]: true,
    [SETTING.USER_RETENTION_CRON]: true,
  })

  const isFormValid = computed(() => {
    const validations = validation.value
    return !Object.values(validations).includes(false);
  })

  const setValidation = (formField: string, isValid: boolean) => {
    validation.value[formField] = isValid;
  }

  const removeCronValidation = () => {
    const { [SETTING.USER_RETENTION_CRON]: _, ...rest } = validation.value;
    validation.value = rest;
  }

  const addCronValidation = () => {
    validation.value = {
      ...validation.value,
      [SETTING.USER_RETENTION_CRON]: true,
    }
  }

  const parseDuration = (duration: string) => {
    const durationPattern = /^(\d+)h|(\d+)m|(\d+)s$/;
    const match = duration?.match(durationPattern);

    if (!match) {
      throw new Error('Invalid duration format. Accepted duration units are Hours, Minutes, and Seconds ({h|m|s})');
    }

    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;

    return dayjs.duration({ hours, minutes, seconds });
  };

  const validateUserRetentionCron = (cronSetting: string | null) => {
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

  const validateDeleteInactiveUserAfter = (duration: string) => {
    try {
      const inputDuration = parseDuration(duration);
      const minDuration = dayjs.duration({ hours: 336 });

      if (inputDuration.asMilliseconds() < minDuration.asMilliseconds()) {
        return `Invalid value: "${duration}": must be at least 336h0m0s`;
      }
    } catch (error: any) {
      return error.message;
    }
  }

  const validateDurationAgainstAuthUserSession = (duration: string) => {
    try {
      const inputDuration = parseDuration(duration);
      const minDuration = dayjs.duration({ minutes: authUserSessionTtlMinutes.value?.value });

      if (inputDuration.asMilliseconds() < minDuration.asMilliseconds()) {
        return `Invalid value: "${duration}": must be at least ${SETTING.AUTH_USER_SESSION_TTL_MINUTES} (${authUserSessionTtlMinutes.value?.value}m)`;
      }
    } catch (error: any) {
      return error.message;
    }
  }

  return {
    validateUserRetentionCron,
    validateDeleteInactiveUserAfter,
    validateDurationAgainstAuthUserSession,
    setValidation,
    removeCronValidation,
    addCronValidation,
    isFormValid,
  }
};
