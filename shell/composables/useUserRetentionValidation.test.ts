import { ref } from 'vue';
import { useUserRetentionValidation } from './useUserRetentionValidation';
import type { Setting } from '@shell/types/resources/settings';

const mockStore = { dispatch: jest.fn() };

jest.mock('vuex', () => ({ useStore: () => mockStore }));

const mockI18n = { t: (key: string) => key };

jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => mockI18n }));

const mockAuthUserSessionTtlMinutes: Setting = {
  apiVersion: 'management.cattle.io/v3',
  customized: false,
  default:    '960',
  id:         'auth-user-session-ttl-minutes',
  kind:       'Setting',
  links:      {
    remove: 'mock-remove-link',
    self:   'mock-self-link',
    update: 'mock-update-link',

    view: 'mock-view-link',
  },
  metadata: {
    creationTimestamp: 'mock-creation-timestamp',
    fields:            ['mock-field'],
    generation:        1,
    managedFields:     [
      {
        apiVersion: 'mock-api-version',
        fieldsType: 'mock-fields-type',
        fieldsV1:   {
          'f:customized': {},
          'f:default':    {},
          'f:source':     {},
          'f:value':      {},
        },
        manager:   'mock-manager',
        operation: 'mock-operation',
        time:      'mock-time',
      },
    ],
    name:            'mock-name',
    relationships:   null,
    resourceVersion: 'mock-resource-version',
    state:           {
      error:         false,
      message:       'mock-message',
      name:          'mock-name',
      transitioning: false,
    },
    uid: 'mock-uid',
  },
  source: '',
  type:   'management.cattle.io.setting',
  value:  '960',
  save:   () => {},
};

describe('validateUserRetentionCron', () => {
  it('should return undefined when disableAfterPeriod and deleteAfterPeriod are false', () => {
    const disableAfterPeriod = ref(false);
    const deleteAfterPeriod = ref(false);
    const authUserSessionTtlMinutes = ref(null);

    const { validateUserRetentionCron } = useUserRetentionValidation(disableAfterPeriod, deleteAfterPeriod, authUserSessionTtlMinutes);

    const result = validateUserRetentionCron(null);

    expect(result).toBeUndefined();
  });

  it('should return an error message when cronSetting is invalid', () => {
    const disableAfterPeriod = ref(true);
    const deleteAfterPeriod = ref(false);
    const authUserSessionTtlMinutes = ref(null);

    const { validateUserRetentionCron } = useUserRetentionValidation(disableAfterPeriod, deleteAfterPeriod, authUserSessionTtlMinutes);

    const result = validateUserRetentionCron(null);

    expect(result).toStrictEqual('user.retention.edit.form.cron.errorMessage');
  });

  it('should return undefined when cronSetting is valid', () => {
    const disableAfterPeriod = ref(true);
    const deleteAfterPeriod = ref(false);
    const authUserSessionTtlMinutes = ref(null);

    const { validateUserRetentionCron } = useUserRetentionValidation(disableAfterPeriod, deleteAfterPeriod, authUserSessionTtlMinutes);

    const result = validateUserRetentionCron('0 0 1 1 *');

    expect(result).toBeUndefined();
  });
});

describe('validateDeleteInactiveUserAfter', () => {
  it('should return an error message when the duration is less than 336 hours', () => {
    const { validateDeleteInactiveUserAfter } = useUserRetentionValidation(ref(false), ref(false), ref(null));

    const result = validateDeleteInactiveUserAfter('335h');

    expect(result).toStrictEqual('Invalid value: "335h": must be at least 336h0m0s');
  });

  it('should return undefined when the duration is equal to 336 hours', () => {
    const { validateDeleteInactiveUserAfter } = useUserRetentionValidation(ref(false), ref(false), ref(null));

    const result = validateDeleteInactiveUserAfter('336h');

    expect(result).toBeUndefined();
  });

  it('should return undefined when the duration is greater than 336 hours', () => {
    const { validateDeleteInactiveUserAfter } = useUserRetentionValidation(ref(false), ref(false), ref(null));

    const result = validateDeleteInactiveUserAfter('500h');

    expect(result).toBeUndefined();
  });
});

describe('validateDurationAgainstAuthUserSession', () => {
  it('should return an error message when the  duration is less than the auth user session TTL', () => {
    const authUserSessionTtlMinutes = ref<Setting>(mockAuthUserSessionTtlMinutes);

    const { validateDurationAgainstAuthUserSession } = useUserRetentionValidation(ref(false), ref(false), authUserSessionTtlMinutes);

    const result = validateDurationAgainstAuthUserSession('59m');

    expect(result).toStrictEqual('Invalid value: "59m": must be at least auth-user-session-ttl-minutes (960m)');
  });

  it('should return undefined when the duration is equal to the auth user session TTL', () => {
    const authUserSessionTtlMinutes = ref<Setting>(mockAuthUserSessionTtlMinutes);

    const { validateDurationAgainstAuthUserSession } = useUserRetentionValidation(ref(false), ref(false), authUserSessionTtlMinutes);

    const result = validateDurationAgainstAuthUserSession('960m');

    expect(result).toBeUndefined();
  });

  it('should return undefined when the duration is greater than the auth user session TTL', () => {
    const authUserSessionTtlMinutes = ref<Setting>(mockAuthUserSessionTtlMinutes);

    const { validateDurationAgainstAuthUserSession } = useUserRetentionValidation(ref(false), ref(false), authUserSessionTtlMinutes);

    const result = validateDurationAgainstAuthUserSession('961m');

    expect(result).toBeUndefined();
  });
});

describe('validateDurations', () => {
  it('should return an errror message when the duration is in an invalid format', () => {
    const authUserSessionTtlMinutes = ref<Setting>(mockAuthUserSessionTtlMinutes);

    const { validateDeleteInactiveUserAfterDuration } = useUserRetentionValidation(ref(false), ref(true), authUserSessionTtlMinutes);

    const result = validateDeleteInactiveUserAfterDuration('960');

    expect(result).toStrictEqual('Invalid duration format. Accepted duration units are Hours, Minutes, and Seconds ({h|m|s})');
  });

  it('should return undefined with a valid duration string', () => {
    const authUserSessionTtlMinutes = ref<Setting>(mockAuthUserSessionTtlMinutes);

    const { validateDeleteInactiveUserAfterDuration } = useUserRetentionValidation(ref(false), ref(false), authUserSessionTtlMinutes);

    const result = validateDeleteInactiveUserAfterDuration('960m');

    expect(result).toBeUndefined();
  });
});
