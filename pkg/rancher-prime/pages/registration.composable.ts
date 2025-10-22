import { computed, ref, Ref } from 'vue';
import { type Store, useStore } from 'vuex';

import { downloadFile } from '@shell/utils/download';
import {
  REGISTRATION_REQUEST_PREFIX, REGISTRATION_NAMESPACE, REGISTRATION_SECRET, REGISTRATION_RESOURCE_NAME, REGISTRATION_LABEL,
  REGISTRATION_REQUEST_FILENAME,
  REGISTRATION_NOTIFICATION_ID
} from '../config/constants';
import { SECRET } from '@shell/config/types';
import { dateTimeFormat } from '@shell/utils/time';
import { useI18n } from '@shell/composables/useI18n';

type RegistrationStatus = 'loading' | 'registering-online' | 'registration-request' | 'registering-offline' | 'registered' | null;
type AsyncButtonFunction = (val: boolean) => void;
type RegistrationMode = 'online' | 'offline';
interface RegistrationDashboard {
  id: string;
  active: boolean;
  product: string;
  mode: RegistrationMode | '--';
  expiration: string;
  color: 'error' | 'success';
  message: string;
  status: 'valid' | 'error' | 'none';
  code: string | null;
  registrationLink?: string; // not generated on failure or reset
  resourceLink?: string; // not generated on empty registration
}

/**
 * Partial of the registration condition
 */
interface PartialCondition {
  reason?: string;
  message?: string;
  type: string;
  status: 'True' | 'False';
}

/**
 * Partial of the registration interface used for this page
 */
interface PartialRegistration {
  id: string;
  metadata: {
    labels: Record<string, string>;
    namespace: string;
    name: string;
  };
  links: {
    view: string;
  };
  spec: {
    mode: RegistrationMode;
  };
  status: {
    registeredProduct: string;
    registrationExpiresAt: string;
    activationStatus: {
      activated: boolean;
      systemUrl: string;
    };
    conditions: PartialCondition[];
    currentCondition: PartialCondition;
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
    regCode?: string; // only for online registrations
    certificate?: string; // only for offline registrations
    registrationType?: string;
    request?: string; // only for offline registration requests (file download)
  };
  remove: () => Promise<void>;
  save: () => Promise<void>;
}

const emptyRegistration: RegistrationDashboard = {
  id:         '--',
  active:     false,
  product:    '--',
  mode:       '--',
  expiration: '--',
  color:      'error',
  code:       null,
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
  const { t } = useI18n(store);

  /**
   * Registration mapped value used in the UI
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
   * Single source for the registration status, used to define process state of the UI
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
   * Retrieve and set registration related values based on the current secret
   */
  const getRegistration = async(): Promise<RegistrationStatus> => {
    if (secret.value) {
      const hash = secret.value.metadata?.labels?.[REGISTRATION_LABEL];

      if (hash) {
        const registrationData = await findRegistration(hash);

        registration.value = mapRegistration(registrationData);
        // Empty registrations are still displayed but not as registered
        if (registration.value.status !== 'none') {
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
  const preRegistration = async(needSecret?: true) => {
    errors.value = [];
    await ensureNamespace();
    if (!needSecret) {
      await deleteSecret();
    } else {
      secret.value = await getSecret();
    }
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
    offlineRegistrationCertificate.value = null;
    await preRegistration();

    if (!registrationCode.value) return;
    const originalHash = secretHash.value;

    secret.value = await createSecret('online', registrationCode.value);
    registration.value = await pollResource(originalHash, findRegistration, mapRegistration);
    registrationStatus.value = registration.value ? 'registered' : null;
    store.dispatch('notifications/remove', REGISTRATION_NOTIFICATION_ID);
    asyncButtonResolution(true);
  };

  /**
   * Set certificate from file, then patch the registration for offline
   * @param certificate base64 encoded certificate from SCC
   */
  const registerOffline = async(certificate: string) => {
    registrationStatus.value = 'registering-offline';
    registrationCode.value = null;
    const originalHash = secretHash.value;

    await preRegistration(true);
    offlineRegistrationCertificate.value = certificate ? atob(certificate) : null;

    try {
      updateSecret(secret.value, offlineRegistrationCertificate.value);
      registration.value = await pollResource(originalHash, findRegistration, mapRegistration);
      registrationStatus.value = registration.value ? 'registered' : null;
      store.dispatch('notifications/remove', REGISTRATION_NOTIFICATION_ID);
    } catch (error) {
      onError(error);
    }
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
    const originalHash = secretHash.value;

    secret.value = await createSecret('offline'); // Generate secret to trigger offline registration request
    registrationCode.value = null;
    const data = await pollResource(originalHash, findOfflineRequest, getRegistrationRequest);

    await downloadFile(REGISTRATION_REQUEST_FILENAME, data ? btoa(data) : data, 'application/json')
      .catch(() => {
        asyncButtonResolution(false);
        onError(new Error('Registration request download not found'));
      });
    asyncButtonResolution(true);
  };

  /**
   * Exclude these types of registrations "in progress" due offline activation logic
   * @param registration
   * @returns
   */
  const isRegistrationOfflineProgress = (registration: PartialRegistration): boolean => {
    const isOffline = registration.spec?.mode === 'offline';
    const lastCondition = registration.status?.currentCondition;
    const isInProgress = lastCondition.type === 'OfflineRequestReady';
    const isActive = registration.status.activationStatus.activated === true;

    return isOffline && !isActive && isInProgress;
  };

  /**
   * Return only registrations with ended process, based on conditions
   * @param registration
   * @returns
   */
  const isRegistrationCompleted = (registration: PartialRegistration): boolean => {
    const mode = registration.spec?.mode;
    const lastCondition = registration.status?.currentCondition;

    if (!lastCondition.type) return false;

    const isError = lastCondition.type === 'RegistrationActivated';
    const isError2 = lastCondition.type === 'RegistrationAnnounced';
    const isCompleteOnline = mode === 'online' && lastCondition.type === 'Done';
    const isCompleteOffline = mode === 'offline' && lastCondition.type === 'Done';

    return isError || isError2 || isCompleteOnline || isCompleteOffline;
  };

  /**
   * Get registration CRD matching secret label
   * @param hash current registration hash
   */
  const findRegistration = async(hash: string | null): Promise<PartialRegistration | undefined> => {
    const registrations: PartialRegistration[] = await store.dispatch('management/findAll', { type: REGISTRATION_RESOURCE_NAME }).catch(() => []) || [];
    const newRegistration = registrations.find((registration) => registration.metadata?.labels[REGISTRATION_LABEL] === hash &&
      !isRegistrationOfflineProgress(registration) &&
      isRegistrationCompleted(registration)
    );

    return newRegistration;
  };

  /**
   * Get offline request secret matching the hash and name prefix
   * @param hash current registration hash
   */
  const findOfflineRequest = async(hash: string | null): Promise<PartialSecret | null> => {
    const secrets: PartialSecret[] = await store.dispatch('management/findAll', { type: SECRET, opt: { namespaced: REGISTRATION_NAMESPACE } }).catch(() => []) || [];
    const request = secrets.find((secret) => secret.metadata?.namespace === REGISTRATION_NAMESPACE &&
      secret.metadata?.name.startsWith(REGISTRATION_REQUEST_PREFIX)) ?? null;

    return request;
  };

  /**
   * Get the registration request from the secret data
   * @param secret PartialSecret containing the request data
   */
  const getRegistrationRequest = (secret: PartialSecret | null): string | null => secret?.data?.request ? atob(secret?.data?.request) : null;

  /**
   * Map registration to the displayed format
   * @param registration Registration
   */
  const mapRegistration = (registration: PartialRegistration | undefined): RegistrationDashboard => {
    if (!registration) {
      return emptyRegistration;
    } else {
      const isActive = registration.status?.activationStatus?.activated === true;

      // Common values for every registration
      const commonRegistration = {
        id:               registration.id,
        active:           isActive,
        mode:             registration.spec.mode,
        registrationLink: registration.status?.activationStatus?.systemUrl,
        resourceLink:     registration.links.view,
        code:             registration?.metadata?.labels[REGISTRATION_LABEL],
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
        const errorMessage = registration.status?.currentCondition;

        if (errorMessage) {
          onError(errorMessage);
        } else {
          onError(new Error(t('registration.errors.generic-registration')));
        }

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
    const secrets: PartialSecret[] = await store.dispatch('management/findAll', { type: SECRET, opt: { namespaced: REGISTRATION_NAMESPACE } }).catch(() => []) || [];

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
   * @param mode 'online' | 'offline'
   * @param code
   * @returns
   */
  const createSecret = async(mode: string, code?: string): Promise<PartialSecret | null> => {
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
          registrationType: btoa(mode)
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
   * Update secret model and append certificate
   * @param secret
   * @param certificate
   * @returns
   */
  const updateSecret = async(secret: PartialSecret | null, certificate: string | null) => {
    if (!secret || !certificate) return;
    delete secret.data.request;
    secret.data.certificate = btoa(certificate);
    await secret.save();
  };

  /**
   * Generic fallback in case of unhandled errors based on existing resources
   * @param polling
   * @returns
   */
  const getError = (polling?: boolean): string => {
    if (polling && !secret.value?.data?.regCode) {
      return t('registration.errors.missing-code');
    }

    // Fallback in case of logic changes
    if (polling && registration.value.active && secret.value?.data?.regCode !== registration.value?.code) {
      return t('registration.errors.mismatch-code');
    }

    if (secret.value && !registration.value.active) {
      return t('registration.errors.generic-registration');
    }

    if (polling) {
      return t('registration.errors.timeout-registration');
    }

    return '';
  };

  /**
 * Polls periodically until a condition is met or timeout is reached.
 * @param fetchFn Function to fetch the resource (e.g., findRegistration or findOfflineRequest)
 * @param mapResult Function to map the result before resolving
 * @param frequency Polling frequency in ms
 * @param timeout Timeout in ms
 * @param extraConditionFn Optional function to apply additional conditions on the resource; it must return true to resolve
 * @return Promise that resolves with the mapped result
 */
  const pollResource = async<T>(
    originalHash: string | null,
    fetchFn: (hash: string | null) => Promise<any>,
    mapResult: (resource: any) => T,
    extraConditionFn?: (resource: any) => boolean,
    frequency = 250,
    timeout = 10000 // First initialization is slow, which is most of the cases
  ): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const startTime = Date.now();

      const interval = setInterval(async() => {
        if (Date.now() - startTime > timeout) {
          clearInterval(interval);
          reject(new Error(getError(true)));

          return;
        }

        // Get resource with matching hash
        const hash = secretHash.value;
        const resource = await fetchFn(hash);
        const newHash: string = resource?.metadata?.labels[REGISTRATION_LABEL];

        const passExtraConditions = (!extraConditionFn || extraConditionFn(resource)); // Run further conditions, default none
        const isHashChanged: boolean = (!originalHash && !!newHash) ||
          (!!originalHash && !!newHash && originalHash !== newHash); // Ensure hash has changed

        if (passExtraConditions && isHashChanged) {
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
    registrationCode.value = secret.value?.data?.regCode ? atob(secret.value.data.regCode) : null; // Get registration code from secret
    registrationStatus.value = await getRegistration();
    const message = getError();

    if (message) {
      onError(new Error(message));
    }
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
