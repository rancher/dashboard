import { downloadFile } from '@shell/utils/download';
import { ref } from 'vue';

type RegistrationStatus = 'registering-online' | 'registering-offline' | 'registered-online' | 'registered-offline' | null;

export const usePrimeRegistration = () => {
  const registration = ref(null as any);

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
   * Expiration status for the registration, both online and offline
   */
  const expirationStatus = ref(null as 'success' | 'warning' | null);

  /**
   * Current error list, displayed in the banner
   */
  const errors = ref([] as string[]);

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
        expirationStatus.value = 'success';
        break;
      case 'offline':
        registrationCode.value = '';
        registrationStatus.value = 'registered-offline';
        expirationStatus.value = 'warning';
        break;
      case 'deregister':
        registrationStatus.value = null;
        registrationCode.value = '';
        offlineRegistrationCertificate.value = '';
        break;
      }
      asyncButtonResolution();
    }, 2000);
  };

  /**
   * Handle error
   */
  const onError = () => {
    errors.value.push('An error occurred');
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
      onError();
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

  return {
    downloadOfflineRequest,
    registration,
    registrationStatus,
    registerOnline,
    registerOffline,
    deregister,
    errors,
    registrationCode,
    expirationStatus
  };
};
