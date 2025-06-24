import { usePrimeRegistration } from './registration.composable';

const dispatchSpy = jest.fn().mockReturnValue(Promise.resolve([]));

jest.mock('vuex', () => ({ useStore: () => ({ dispatch: dispatchSpy }) }));

describe('registration composable', () => {
  describe('changing registration type', () => {
    it('should get a namespace', async() => {
      const { registerOnline } = usePrimeRegistration();

      await registerOnline((val: boolean) => true);

      expect(dispatchSpy).toHaveBeenCalledWith('cluster/find');
    });

    it('should create a new namespace if missing', async() => {
      const { registerOnline } = usePrimeRegistration();

      await registerOnline((val: boolean) => true);

      expect(dispatchSpy).toHaveBeenCalledWith('cluster/create');
    });

    it('should delete any existing secret', async() => {
      const { registerOnline } = usePrimeRegistration();

      await registerOnline((val: boolean) => true);

      expect(dispatchSpy).toHaveBeenCalledWith('cluster/find');
    });
  });

  describe('registering online', () => {
    it('should set status online', async() => {
      const {
        registerOnline,
        registrationStatus
      } = usePrimeRegistration();

      await registerOnline((val: boolean) => true);

      expect(registrationStatus).toStrictEqual('registering-online');
    });

    it('should reset offline certificate', async() => {
      const {
        registerOnline,
        offlineRegistrationCertificate,
      } = usePrimeRegistration();

      await registerOnline((val: boolean) => true);

      expect(offlineRegistrationCertificate).toBeNull();
    });

    it('should create a new registration', async() => {
      const expectation = {};
      const {
        registerOnline,
        registration,
      } = usePrimeRegistration();

      await registerOnline((val: boolean) => true);

      expect(registration).toStrictEqual(expectation);
    });
  });

  describe('registering offline', () => {
    it('should set status offline', async() => {
      const {
        registerOffline,
        registrationStatus
      } = usePrimeRegistration();

      registerOffline('');

      expect(registrationStatus).toStrictEqual('registering-offline');
    });

    it('should create a new registration', async() => {
      const expectation = {};
      const {
        registerOffline,
        registration,
      } = usePrimeRegistration();

      await registerOffline('');

      expect(registration).toStrictEqual(expectation);
    });

    it('should reset registrationCode', async() => {
      const {
        registerOffline,
        registrationCode,
      } = usePrimeRegistration();

      await registerOffline('');

      expect(registrationCode).toBeNull();
    });
  });

  describe('deregistering', () => {
    it('should reset all de values', async() => {
      const {
        registerOffline,
        registrationStatus
      } = usePrimeRegistration();

      registerOffline('');

      expect(registrationStatus).toStrictEqual('registering-offline');
    });
  });
});
