import { computed, ref, Ref } from 'vue';
import { type Store, useStore } from 'vuex';

import { downloadFile } from '@shell/utils/download';
import {
  REGISTRATION_REQUEST_PREFIX, REGISTRATION_NAMESPACE, REGISTRATION_SECRET, REGISTRATION_RESOURCE_NAME, REGISTRATION_LABEL,
  REGISTRATION_REQUEST_FILENAME
} from '../config/constants';
import { SECRET } from '@shell/config/types';
import { dateTimeFormat } from '@shell/utils/time';

type RegistrationStatus = 'loading' | 'registering-online' | 'registration-request' | 'registering-offline' | 'registered' | null;
type AsyncButtonFunction = (val: boolean) => void;
interface RegistrationDashboard {
  active: boolean;
  product: string;
  mode: 'online' | 'offline' | '--';
  expiration: string;
  color: 'error' | 'success';
  message: string;
  status: 'valid' | 'error' | 'none';
  registrationLink?: string; // not generated on failure or reset
  resourceLink?: string; // not generated on empty registration
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
    regCode?: string;
    registrationType?: string;
    request?: string; // only for offline requests
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

export const usePrimeRegistration = (storeArg?: Store<any>) => {
  const store = storeArg ?? useStore();

  /**
   * Registration from CRD
   */
  const registration = ref(emptyRegistration);

  /**
   * Secret containing user registration code or offline certificate
   */
  const secret: Ref<PartialSecret | null> = ref(null);

  /**
   * Label from the secret used to find the registration
   */
  const secretHash = computed(() => (secret.value?.metadata?.labels || {})[REGISTRATION_LABEL] || null);

  /**
   * Single source for the registration status, used to define other computed properties
   */
  const registrationStatus = ref('loading' as RegistrationStatus);

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
  const getRegistration = async(): Promise<RegistrationStatus> => {
    if (secret.value) {
      const hash = secret.value.metadata?.labels?.[REGISTRATION_LABEL];

      if (hash) {
        registration.value = mapRegistration(await findRegistration(hash));
        if (registration.value) {
          return 'registered';
        }
      }
    }

    return null;
  };

  /**
   * Reset page to initial state without registration
   */
  const resetRegistration = () => {
    registrationStatus.value = null;
    registrationCode.value = null;
    offlineRegistrationCertificate.value = null;
    registration.value = emptyRegistration;
    secret.value = null;
  };

  /**
   * Common operations required before registration
   */
  const preRegistration = async() => {
    errors.value = [];
    await ensureNamespace();
    await deleteSecret();
  };

  /**
   * Create registration namespace if none exists
   */
  const ensureNamespace = async() => {
    try {
      await store.dispatch('management/find', {
        type: 'namespace',
        id:   REGISTRATION_NAMESPACE,
        opt:  { force: true }
      });
    } catch (error) {
      try {
        const newNamespace = await store.dispatch('management/create', {
          type:     'namespace',
          metadata: { name: REGISTRATION_NAMESPACE }
        });

        if (newNamespace) {
          newNamespace.save();
        }
      } catch (error) {
        onError(error);
      }
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
  const registerOnline = async(asyncButtonResolution: AsyncButtonFunction) => {
    registrationStatus.value = 'registering-online';
    await preRegistration();

    if (!registrationCode.value) return;

    secret.value = await createSecret('online', registrationCode.value);
    offlineRegistrationCertificate.value = null;
    registration.value = await pollResource(findRegistration, mapRegistration);
    registrationStatus.value = registration.value ? 'registered' : null;
    asyncButtonResolution(true);
  };

  /**
   * Set certificate from file, then patch the registration for offline
   * @param certificate base64 encoded certificate from SCC
   */
  const registerOffline = async(certificate: string) => {
    registrationStatus.value = 'registering-offline';
    offlineRegistrationCertificate.value = certificate;
    await preRegistration();

    if (!registrationCode.value) return;
    secret.value = await createSecret('offline', registrationCode.value);
    registrationCode.value = null;
    registration.value = await pollResource(findRegistration, mapRegistration);
    registrationStatus.value = registration.value ? 'registered' : null;
    // asyncButtonResolution(true);
  };

  /**
   * De-register handler
   * @param asyncButtonResolution Async button callback
   */
  const deregister = async(asyncButtonResolution: AsyncButtonFunction) => {
    await preRegistration();
    resetRegistration();
    asyncButtonResolution(true);
  };

  /**
   * Download is also on its own a form of registration as it uses the same secret
   * @param asyncButtonResolution Async button callback
   */
  const downloadOfflineRequest = async(asyncButtonResolution: (status: boolean) => void) => {
    registrationStatus.value = 'registration-request';
    await preRegistration();

    secret.value = await createSecret('offline'); // Generate secret to trigger offline registration request
    registrationCode.value = null;
    const data = await pollResource(findOfflineRequest, getRegistrationRequest);

    await downloadFile(REGISTRATION_REQUEST_FILENAME, JSON.stringify(data), 'application/json')
      .catch(() => {
        asyncButtonResolution(false);
        onError(new Error('Registration request download not found'));
      });
    asyncButtonResolution(true);
  };

  /**
   * Get registration CRD matching secret label
   * @param hash current registration hash
   */
  const findRegistration = async(hash: string | null): Promise<PartialRegistration | undefined> => {
    const registrations: PartialRegistration[] = await store.dispatch('management/findAll', { type: REGISTRATION_RESOURCE_NAME });
    const registration = registrations.find((registration) => registration.metadata?.labels[REGISTRATION_LABEL] === hash);

    return registration;
  };

  /**
   * Get offline request secret matching the hash and name prefix
   * @param hash current registration hash
   */
  const findOfflineRequest = async(hash: string | null): Promise<PartialSecret | null> => {
    const secrets: PartialSecret[] = await store.dispatch('management/findAll', { type: SECRET });
    const request = secrets.find((secret) => secret.metadata?.namespace === REGISTRATION_NAMESPACE &&
      secret.metadata?.name.startsWith(REGISTRATION_REQUEST_PREFIX)) ?? null;

    return request;
  };

  /**
   * Get the registration request from the secret data
   * @param request PartialSecret containing the request data
   */
  const getRegistrationRequest = (request: PartialSecret | null): string | null => request?.data?.request ?? null;

  /**
   * Map registration to the displayed format
   * @param registration Registration
   */
  const mapRegistration = (registration: PartialRegistration | undefined): RegistrationDashboard => {
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
        resourceLink,
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
    const secrets: PartialSecret[] = await store.dispatch('management/findAll', { type: SECRET });

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
  const createSecret = async(type: string, code?: string): Promise<PartialSecret | null> => {
    const code64 = code ? { regCode: btoa(code) } : {};

    try {
      const secret = await store.dispatch('management/create', {
        type:     SECRET,
        metadata: {
          namespace: REGISTRATION_NAMESPACE,
          name:      REGISTRATION_SECRET,
        },
        data: {
          ...code64,
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

  /**
 * Polls periodically until a condition is met or timeout is reached.
 * @param fetchFn Function to fetch the resource (e.g., findRegistration or findOfflineRequest)
 * @param mapResult Function to map the result before resolving
 * @param frequency Polling frequency in ms
 * @param timeout Timeout in ms
 */
  const pollResource = async<T>(
    fetchFn: (hash: string | null) => Promise<any>,
    mapResult: (resource: any) => T,
    frequency = 500,
    timeout = 10000
  ): Promise<T> => {
    const originalHash = secretHash.value;

    return new Promise<T>((resolve, reject) => {
      const startTime = Date.now();

      const interval = setInterval(async() => {
        if (Date.now() - startTime > timeout) {
          clearInterval(interval);
          reject(new Error('Timeout reached while waiting for resource'));

          return;
        }

        const hash = secretHash.value;
        const resource = await fetchFn(hash);
        const newHash = resource?.metadata?.labels[REGISTRATION_LABEL];

        if (
          (originalHash && !newHash) ||
          (!originalHash && newHash) ||
          (originalHash && newHash && originalHash !== newHash)
        ) {
          clearInterval(interval);
          resolve(mapResult(resource));
        }
      }, frequency);
    });
  };

  /**
   * Retrieve the initial registration state
   */
  const initRegistration = async() => {
    secret.value = await getSecret();
    registrationCode.value = regCode.value;

    registrationStatus.value = await getRegistration();
  };

  return {
    downloadOfflineRequest,
    registration,
    registrationStatus,
    registerOnline,
    registerOffline,
    deregister,
    initRegistration,
    errors,
    offlineRegistrationCertificate,
    registrationCode,
    registrationBanner
  };
};
