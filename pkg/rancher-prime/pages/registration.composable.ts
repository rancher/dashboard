import { onMounted, computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

import { downloadFile } from '@shell/utils/download';
import { K8S_RESOURCE_NAME, REGISTRATION_CRD } from '../config/constants';

type RegistrationStatus = 'registering-online' | 'registering-offline' | 'registered-online' | 'registered-offline' | null;

const registrationMock = {
  none: {
    product:    '--',
    code:       '--',
    expiration: '--',
    color:      'error',
    message:    'registration.list.table.badge.none',
    status:     'none'
  },
  expired: {
    product:    'SUSE Rancher Manager Prime Suite',
    code:       'sdfs-a987435-kjhsf-8u44p0-dmw0o44p0dmasd9',
    expiration: '12/12/2021',
    color:      'error',
    message:    'registration.list.table.badge.expired',
    status:     'expired'
  },
  valid: {
    product:    'SUSE Rancher Manager Prime Suite',
    code:       'sdfs-a987435-kjhsf-8u44p0-dmw0o44p0dmasd9',
    expiration: '12/12/2021',
    color:      'success',
    message:    'registration.list.table.badge.valid',
    status:     'valid'
  }
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
  const registration = ref(registrationMock.none);

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
   * Reset other inputs and errors, set current state then patch the registration
   * @param type 'online' | 'offline' | 'deregister'
   * @param asyncButtonResolution Async button callback
   */
  const patchRegistration = (type: 'online' | 'offline' | 'deregister', asyncButtonResolution: () => void) => {
    errors.value = [];
    setTimeout(() => {
      switch (type) {
      case 'online':
        offlineRegistrationCertificate.value = '';
        registrationStatus.value = 'registered-online';
        registration.value = registrationMock.valid;
        break;
      case 'offline':
        registrationCode.value = '';
        registrationStatus.value = 'registered-offline';
        registration.value = registrationMock.expired;
        break;
      case 'deregister':
        registrationStatus.value = null;
        registrationCode.value = '';
        offlineRegistrationCertificate.value = '';
        registration.value = registrationMock.none;
        break;
      }
      asyncButtonResolution();
    }, 2000);
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
    patchRegistration('online', asyncButtonResolution);
  };

  /**
   * Set certificate from file, then patch the registration for offline
   * @param certificate base64 encoded certificate from SCC
   */
  const registerOffline = (certificate: string) => {
    registrationStatus.value = 'registering-offline';
    offlineRegistrationCertificate.value = certificate;
    patchRegistration('offline', () => {});
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
    patchRegistration('deregister', asyncButtonResolution);
  };

  /**
   * Handle download offline registration request
   * @param asyncButtonResolution Async button callback
   */
  const downloadOfflineRequest = (asyncButtonResolution: (status: boolean) => void) => {
    const fileName = 'rancher-offline-registration-request.json';
    const data = '';

    setTimeout(() => {
      downloadFile(fileName, JSON.stringify(data), 'application/json')
        .then(() => asyncButtonResolution(true))
        .catch(() => asyncButtonResolution(false));
    }, 1000);
  };

  /**
   * Initialize the CRD for registration if missing
   */
  const registerSchema = async() => {
    try {
      await store.dispatch('management/request', {
        url:    '/v1/apiextensions.k8s.io.customresourcedefinitions',
        method: 'POST',
        data:   REGISTRATION_CRD,
      });
    } catch (err) {
      onError(t('registration.error.schema'), err as string);
    }
  };

  // Fetch data when the component is mounted
  onMounted(async() => {
    const schema = store.getters['management/schemaFor'](K8S_RESOURCE_NAME);

    if (!schema) {
      await registerSchema();
    }

    const registrations = await store.dispatch('management/findAll', { type: K8S_RESOURCE_NAME });

    // TODO: Pick one registration only to display
    if (registrations.length) {
      registration.value = registrations[0];
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
