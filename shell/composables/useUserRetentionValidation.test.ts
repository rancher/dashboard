import { ref } from 'vue';
import { useUserRetentionValidation, Setting } from './useUserRetentionValidation';

const mockStore = {
  dispatch: jest.fn(),
}
jest.mock('@shell/composables/useStore', () => ({
  useStore: () => mockStore,
}))

const mockAuthUserSessionTtlMinutes: Setting = {
  apiVersion: 'management.cattle.io/v3',
  customized: false,
  default: '960',
  id: 'auth-user-session-ttl-minutes',
  kind: 'Setting',
  links: {
    remove: 'mock-remove-link',
    self: 'mock-self-link',
    update: 'mock-update-link',
    view: 'mock-view-link',
  },
  metadata: {
    creationTimestamp: 'mock-creation-timestamp',
    fields: ['mock-field'],
    generation: 1,
    managedFields: [
      {
        apiVersion: 'mock-api-version',
        fieldsType: 'mock-fields-type',
        fieldsV1: {
          'f:customized': {},
          'f:default': {},
          'f:source': {},
          'f:value': {},
        },
        manager: 'mock-manager',
        operation: 'mock-operation',
        time: 'mock-time',
      },
    ],
    name: 'mock-name',
    relationships: null,
    resourceVersion: 'mock-resource-version',
    state: {
      error: false,
      message: 'mock-message',
      name: 'mock-name',
      transitioning: false,
    },
    uid: 'mock-uid',
  },
  source: '',
  type: 'management.cattle.io.setting',
  value: '960',
  save: () => {},
}

describe('validateDurationAgainstAuthUserSession', () => {
  it('should return an error message when the  duration is less than the auth user session TTL', () => {
    const authUserSessionTtlMinutes = ref<Setting>(mockAuthUserSessionTtlMinutes);
    
    const { validateDurationAgainstAuthUserSession } = useUserRetentionValidation(ref(false), ref(false), authUserSessionTtlMinutes)

    const result = validateDurationAgainstAuthUserSession('59m')

    expect(result).toEqual('Invalid value: "59m": must be at least auth-user-session-ttl-minutes (960m)');
  });

  it('should return undefined when the duration is equal to the auth user session TTL', () => {
    const authUserSessionTtlMinutes = ref<Setting>(mockAuthUserSessionTtlMinutes);
    
    const { validateDurationAgainstAuthUserSession } = useUserRetentionValidation(ref(false), ref(false), authUserSessionTtlMinutes)

    const result = validateDurationAgainstAuthUserSession('960m')

    expect(result).toBeUndefined();
  });

  it('should return undefined when the duration is greater than the auth user session TTL', () => {
    const authUserSessionTtlMinutes = ref<Setting>(mockAuthUserSessionTtlMinutes);
    
    const { validateDurationAgainstAuthUserSession } = useUserRetentionValidation(ref(false), ref(false), authUserSessionTtlMinutes)

    const result = validateDurationAgainstAuthUserSession('961m')

    expect(result).toBeUndefined();
  });

  it('should throw an error when the duration is in an invalid format', () => {
    const authUserSessionTtlMinutes = ref<Setting>(mockAuthUserSessionTtlMinutes);
    
    const { validateDurationAgainstAuthUserSession } = useUserRetentionValidation(ref(false), ref(false), authUserSessionTtlMinutes)

    const result = validateDurationAgainstAuthUserSession('960')

    expect(result).toEqual('Invalid duration format. Accepted duration units are Hours, Minutes, and Seconds ({h|m|s})');
  });
})
