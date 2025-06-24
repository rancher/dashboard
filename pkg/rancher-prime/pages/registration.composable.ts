import { onMounted, computed, ref, Ref } from 'vue';
import { useStore } from 'vuex';

import { downloadFile } from '@shell/utils/download';
import { REGISTRATION_NAMESPACE, REGISTRATION_SECRET, REGISTRATION_RESOURCE_NAME, REGISTRATION_LABEL } from '../config/constants';
import { SECRET } from '@shell/config/types';
import { dateTimeFormat } from '@shell/utils/time';

type RegistrationStatus = 'registering-online' | 'registering-offline' | 'registered' | null;
interface RegistrationDashboard {
  active: boolean;
  product: string;
  mode: 'online' | 'offline' | '--';
  expiration: string;
  color: 'error' | 'success';
  message: string;
  status: 'valid' | 'error' | 'none';
  registrationLink?: string;
  resourceLink?: string;
}

/**
 * Partial of the registration interface used for this page
 */
interface PartialRegistration {
  metadata: {
    labels: Record<string, string>;
    namespace: string;
    name: string;
  };
  links: {
    view: string;
  };
  spec: {
    mode: 'online' | 'offline';
  };
  status: {
    registeredProduct: string;
    registrationExpiresAt: string;
    activationStatus: {
      activated: boolean;
      systemUrl: string;
    };
    conditions: Array<{
      reason?: string;
      message?: string;
    }>
  };
}

/**
 * Partial of the secret interface used for this page
 */
interface PartialSecret {
  metadata: {
    labels: Record<string, string>;
    namespace: string;
    name: string;
  };
  data: {
    regCode: string;
    registrationType: string;
  };
  remove: () => Promise<void>;
  save: () => Promise<void>;
}

const emptyRegistration: RegistrationDashboard = {
  active:     false,
  product:    '--',
  mode:       '--',
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
  },
  error: {
    message: 'registration.banner.status.error',
    type:    'error',
  }
};

export const usePrimeRegistration = () => {
  const store = useStore();

  /**
   * Registration from CRD
   */
  const registration = ref(emptyRegistration);

  /**
   * Secret containing user registration code or offline certificate
   */
  const secret: Ref<PartialSecret | null> = ref(null);

  /**
   * Single source for the registration status, used to define other computed properties
   */
  const registrationStatus = ref(null as RegistrationStatus);

  /**
   * Registration code for online registration; empty if none or offline
   */
  const registrationCode = ref(null as string | null);

  /**
   * Certificate for offline registration; empty if none or online
   */
  const offlineRegistrationCertificate = ref(null as string | null);

  /**
   * Current error list, displayed in the banner
   */
  const errors = ref([] as string[]);

  /**
   * Displayed registration banner
   */
  const registrationBanner = computed(() => registration.value.status === 'valid' ? registrationBannerCases.valid : registrationBannerCases.none);

  /**
   * Reg code contained within the encoded secret
   */
  const regCode = computed(() => {
    return secret.value?.data?.regCode ? atob(secret.value.data.regCode) : '';
  });

  /**
   * Retrieve and set registration related values based on the current secret
   */
  const setRegistration = async() => {
    if (secret.value) {
      const hash = secret.value.metadata?.labels?.[REGISTRATION_LABEL];

      if (hash) {
        registration.value = await getRegistration(hash) || emptyRegistration;
        if (registration.value) {
          registrationStatus.value = 'registered';
        }
      }
    }
  };

  /**
   * Reset page to initial state without registration
   */
  const resetRegistration = () => {
    registrationStatus.value = null;
    registrationCode.value = '';
    offlineRegistrationCertificate.value = null;
    registration.value = emptyRegistration;
    secret.value = null;
  };

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
      if (!registrationCode.value) break;
      secret.value = await createSecret('online', registrationCode.value);
      offlineRegistrationCertificate.value = null;
      setRegistration();
      break;
    case 'offline':
      if (!registrationCode.value) break;
      secret.value = await createSecret('offline', registrationCode.value);
      registrationCode.value = null;
      setRegistration();
      break;
    case 'deregister':
      resetRegistration();
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
  const onError = (error: unknown) => {
    errors.value.push(error?.message);
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
  const getRegistration = async(label: string): Promise<RegistrationDashboard> => {
    const registrations: PartialRegistration[] = await store.dispatch('management/findAll', { type: REGISTRATION_RESOURCE_NAME });
    const registration = registrations.find((registration) => registration.metadata?.labels[REGISTRATION_LABEL] === label);

    if (!registration) {
      return emptyRegistration;
    } else {
      const isActive = registration.status?.activationStatus?.activated === true;
      const resourceLink = registration.links.view.replace('/apis/scc.cattle.io/v1/registrations/', '/c/local/explorer/scc.cattle.io.registration/');
      // Common values for every registration
      const commonRegistration = {
        active:           isActive,
        mode:             registration.spec.mode,
        registrationLink: registration.status?.activationStatus?.systemUrl,
        resourceLink
      };

      if (isActive) {
        return {
          ...commonRegistration,
          product:    registration.status?.registeredProduct,
          expiration: dateTimeFormat(registration.status?.registrationExpiresAt, store),
          color:      'success',
          message:    'registration.list.table.badge.valid',
          status:     'valid'
        };
      } else {
        // Retrieve failure message from conditions
        const conditions = registration.status?.conditions || [];
        const errorMessage = conditions.find((condition) => condition.reason && condition.message);

        onError(errorMessage);

        return {
          ...commonRegistration,
          product:    '--',
          expiration: '--',
          color:      'error',
          message:    'registration.list.table.badge.invalid',
          status:     'error'
        };
      }
    }
  };

  /**
   * Get unique secret code with hardcoded namespace and name
   */
  const getSecret = async(): Promise<PartialSecret | null> => {
    const secrets: PartialSecret[] = await store.dispatch('cluster/findAll', { type: SECRET });

    return secrets.find((secret) => secret.metadata?.namespace === REGISTRATION_NAMESPACE &&
      secret.metadata?.name === REGISTRATION_SECRET) ?? null;
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
  const createSecret = async(type: string, code: string): Promise<PartialSecret | null> => {
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
    } catch (error) {
      onError(error);

      return null;
    }
  };

  onMounted(async() => {
    secret.value = await getSecret();
    registrationCode.value = regCode.value;

    await setRegistration();
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
