import { onMounted, computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

import { downloadFile } from '@shell/utils/download';
import { REGISTRATION_NAMESPACE, REGISTRATION_SECRET, REGISTRATION_RESOURCE_NAME, REGISTRATION_LABEL } from '../config/constants';
import { SECRET } from '@shell/config/types';

type RegistrationStatus = 'registering-online' | 'registering-offline' | 'registered' | null;

const emptyRegistration = {
  product:    '--',
  code:       '--',
  expiration: '--',
  color:      'error',
  message:    'registration.list.table.badge.none',
  status:     'none'
};

const registrationBannerCases = {
  none: {
    message: 'registration.banner.status.error',
    type:    'error',
  },
  valid: {
    message: 'registration.banner.status.success',
    type:    'success',
  }
};

export const usePrimeRegistration = () => {
  const store = useStore();
  const { t } = useI18n(store);

  /**
   * Registration from CRD
   */
  const registration = ref(emptyRegistration);

  /**
   * Secret containing user registration code or offline certificate
   */
  const secret = ref(null);

  /**
   * Single source for the registration status, used to define other computed properties
   */
  const registrationStatus = ref(null as RegistrationStatus);

  /**
   * Registration code for online registration; empty if none or offline
   */
  const registrationCode = ref('');

  /**
   * Certificate for offline registration; empty if none or online
   */
  const offlineRegistrationCertificate = ref('');

  /**
   * Current error list, displayed in the banner
   */
  const errors = ref([] as string[]);

  /**
   * Displayed registration banner
   */
  const registrationBanner = computed(() => registration.value.status === 'valid' ? registrationBannerCases.valid : registrationBannerCases.none);

  /**
   * Update registration to defined case
   * Reset other inputs and errors, set current state then patch the registration
   * @param type 'online' | 'offline' | 'deregister'
   * @param asyncButtonResolution Async button callback
   */
  const changeRegistration = async(type: 'online' | 'offline' | 'deregister', asyncButtonResolution: () => void) => {
    errors.value = [];
    await ensureNamespace();
    await deleteSecret();

    switch (type) {
    case 'online':
      secret.value = await createSecret('online', registrationCode.value);
      offlineRegistrationCertificate.value = '';
      if (secret.value) {
        registration.value = await getRegistration(secret.value.metadata?.labels?.[REGISTRATION_LABEL]);
        if (registration.value) {
          registrationStatus.value = 'registered';
        }
      }
      break;
    case 'offline':
      secret.value = await createSecret('offline', registrationCode.value);
      registrationCode.value = '';
      if (secret.value) {
        registration.value = await getRegistration(secret.value.metadata?.labels?.[REGISTRATION_LABEL]);
        if (registration.value) {
          registrationStatus.value = 'registered';
        }
      }
      break;
    case 'deregister':
      registrationStatus.value = null;
      registrationCode.value = '';
      offlineRegistrationCertificate.value = '';
      registration.value = emptyRegistration;
      break;
    }
    asyncButtonResolution();
  };

  /**
   * Create registration namespace if none exists
   */
  const ensureNamespace = async() => {
    try {
      await store.dispatch('cluster/find', {
        type: 'namespace',
        id:   REGISTRATION_NAMESPACE,
        opt:  { force: true }
      });
    } catch (error) {
      const newNamespace = await store.dispatch('cluster/create', {
        type:     'namespace',
        metadata: { name: REGISTRATION_NAMESPACE }
      });

      newNamespace.save();
    }
  };

  /**
   * Handle error
   */
  const onError = (message: string, payload: unknown) => {
    errors.value.push(message, payload as string);
  };

  /**
   * Patch CRD for online registration
   * @param asyncButtonResolution Async button callback
   */
  const registerOnline = (asyncButtonResolution: () => void) => {
    registrationStatus.value = 'registering-online';
    changeRegistration('online', asyncButtonResolution);
  };

  /**
   * Set certificate from file, then patch the registration for offline
   * @param certificate base64 encoded certificate from SCC
   */
  const registerOffline = (certificate: string) => {
    registrationStatus.value = 'registering-offline';
    offlineRegistrationCertificate.value = certificate;
    changeRegistration('offline', () => {});
  };

  /**
   * TODO - #13387: Remove after implementing the real error handling
   * @param asyncButtonResolution Async button callback
   */
  // eslint-disable-next-line no-unused-vars
  const registerWithError = (asyncButtonResolution: () => void) => {
    errors.value = [];
    setTimeout(() => {
      onError(t('registration.error.submission'), {});
      asyncButtonResolution();
    }, 1000);
  };

  /**
   * De-register handler
   * @param asyncButtonResolution Async button callback
   */
  const deregister = (asyncButtonResolution: () => void) => {
    changeRegistration('deregister', asyncButtonResolution);
  };

  /**
   * Handle download offline registration request
   * @param asyncButtonResolution Async button callback
   */
  const downloadOfflineRequest = (asyncButtonResolution: (status: boolean) => void) => {
    const fileName = 'rancher-offline-registration-request.json';
    const data = '';

    downloadFile(fileName, JSON.stringify(data), 'application/json')
      .then(() => asyncButtonResolution(true))
      .catch(() => asyncButtonResolution(false));
  };

  /**
   * Get registration CRD matching secret label
   */
  const getRegistration = async(label: string) => {
    const registrations = await store.dispatch('management/findAll', { type: REGISTRATION_RESOURCE_NAME });

    const registration = registrations.find((registration) => registration.metadata?.labels[REGISTRATION_LABEL] === label);

    return registration ? {
      product:    '--',
      code:       regCode.value,
      expiration: '--',
      color:      'success',
      message:    'registration.list.table.badge.valid',
      status:     'valid'
    } : emptyRegistration;
  };

  /**
   * Get unique secret code with hardcoded namespace and name
   */
  const getSecret = async() => {
    const secrets = await store.dispatch('cluster/findAll', { type: SECRET });

    return secrets.find((secret) => secret.metadata?.namespace === REGISTRATION_NAMESPACE && secret.metadata?.name === REGISTRATION_SECRET);
  };

  /**
   * Delete any secret before creating a new one
   */
  const deleteSecret = async() => {
    if (secret.value) {
      try {
        await secret.value.remove();
      } catch (error) {}
    }
  };

  /**
   * Create secret to trigger registration
   * @param type 'online' | 'offline'
   * @param code
   * @returns
   */
  const createSecret = async(type: string, code: string) => {
    try {
      const secret = await store.dispatch('cluster/create', {
        type:     SECRET,
        metadata: {
          namespace: REGISTRATION_NAMESPACE,
          name:      REGISTRATION_SECRET,
        },
        data: {
          regCode:          btoa(code),
          registrationType: btoa(type)
        }
      });

      await secret.save();

      return secret;
    } catch (error) {}
  };

  const regCode = computed(() => {
    return secret.value?.data?.regCode ? atob(secret.value.data.regCode) : '';
  });

  onMounted(async() => {
    secret.value = await getSecret();

    if (secret.value) {
      registrationCode.value = regCode.value;
      const hash = secret.value.metadata?.labels?.[REGISTRATION_LABEL];

      if (hash) {
        registration.value = await getRegistration(hash) || emptyRegistration;
        registrationStatus.value = 'registered';
      }
    }
  });

  return {
    downloadOfflineRequest,
    registration,
    registrationStatus,
    registerOnline,
    registerOffline,
    deregister,
    errors,
    registrationCode,
    registrationBanner
  };
};
