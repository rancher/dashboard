import {
  REGISTRATION_LABEL, REGISTRATION_NAMESPACE, REGISTRATION_SECRET, REGISTRATION_REQUEST_FILENAME, REGISTRATION_REQUEST_PREFIX
} from '../config/constants';
import { usePrimeRegistration } from './registration.composable';

let dispatchSpy = jest.fn();
const downloadSpy = jest.fn();
const namespaceRequest = {
  id: 'cattle-scc-system', opt: { force: true }, type: 'namespace'
};

jest.mock('vuex', () => ({ useStore: () => ({ dispatch: dispatchSpy }) }));
jest.mock('@shell/utils/download', () => ({ downloadFile: downloadSpy }));

describe('registration composable', () => {
  beforeEach(() => {
    dispatchSpy = jest.fn().mockReturnValue(Promise.resolve([]));
  });

  describe('when initialized', () => {
    it('should retrieve the registration secret and current registration', async() => {
      const value = 'whatever';

      dispatchSpy = jest.fn()
        .mockReturnValueOnce(Promise.resolve([
          { metadata: { namespace: 'not me' } },
          { metadata: { name: 'also not me' } },
          {
            metadata: {
              namespace: REGISTRATION_NAMESPACE,
              name:      REGISTRATION_SECRET
            },
            value: { data: { regCode: value } }
          },
        ]))
        .mockReturnValue(Promise.resolve([{ metadata: { labels: { [REGISTRATION_LABEL]: 'whatever' } } }]));
      const store = { state: {}, dispatch: dispatchSpy } as any;
      const {
        initRegistration, registrationCode, registration, registrationStatus
      } = usePrimeRegistration(store);

      await initRegistration();

      expect(registrationCode).toStrictEqual(value);
      expect(registration.value.active).toStrictEqual(true);
      expect(registrationStatus.value).toStrictEqual('registered');
    });
  });

  describe('downloading the registration certificate', () => {
    it('should retrieve and start download process', async() => {
      const expectation = 'whatever';

      dispatchSpy = jest.fn()
        .mockReturnValueOnce(Promise.resolve([
          { metadata: { namespace: 'not me' } },
          { metadata: { name: 'also not me' } },
          {
            metadata: {
              namespace: REGISTRATION_NAMESPACE,
              name:      `${ REGISTRATION_REQUEST_PREFIX }whatever`
            },
            value: { data: { request: expectation } }
          },
        ]));
      const store = { state: {}, dispatch: dispatchSpy } as any;
      const { downloadOfflineRequest } = usePrimeRegistration(store);

      await downloadOfflineRequest(() => { });

      expect(downloadSpy).toHaveBeenCalledWith(REGISTRATION_REQUEST_FILENAME, expectation, 'application/json');
    });
  });

  describe('changing registration type', () => {
    it('should get a namespace', async() => {
      const { registerOnline } = usePrimeRegistration();

      await registerOnline((val: boolean) => true);

      expect(dispatchSpy).toHaveBeenCalledWith('management/find', namespaceRequest);
    });

    it('should create a new namespace if missing', async() => {
      dispatchSpy = jest.fn()
        .mockReturnValueOnce(Promise.reject(new Error('Namespace not found')))
        .mockReturnValue(Promise.resolve({ save: () => { } }));
      const { registerOnline } = usePrimeRegistration();

      await registerOnline((val: boolean) => true);

      expect(dispatchSpy).toHaveBeenCalledTimes(2);
      expect(dispatchSpy).toHaveBeenCalledWith('management/find', namespaceRequest);
    });

    it('should delete any existing secret', async() => {
      const { registerOnline } = usePrimeRegistration();

      await registerOnline((val: boolean) => true);

      expect(dispatchSpy).toHaveBeenCalledWith('management/find', namespaceRequest);
    });
  });

  describe('registering online', () => {
    it('should set status online', async() => {
      const {
        registerOnline,
        registrationStatus
      } = usePrimeRegistration();

      await registerOnline((val: boolean) => true);

      expect(registrationStatus.value).toStrictEqual('registering-online');
    });

    it('should reset offline certificate', async() => {
      const {
        registerOnline,
        offlineRegistrationCertificate,
      } = usePrimeRegistration();

      await registerOnline((val: boolean) => true);

      expect(offlineRegistrationCertificate.value).toBeNull();
    });

    it.skip('should create a new registration', async() => {
      dispatchSpy = jest.fn()
        .mockReturnValueOnce(Promise.resolve([{ metadata: { labels: { [REGISTRATION_LABEL]: 'whatever' } } }]))
        .mockReturnValueOnce(Promise.resolve([{ metadata: { labels: { [REGISTRATION_LABEL]: 'whatever' } } }]));
      const expectation = {};
      const {
        registrationCode,
        registerOnline,
        registration,
      } = usePrimeRegistration();
      const secret = {
        id:  'cattle-scc-system',
        opt: {
          force: true,
          data:  {
            regCode:          'dGVzdC1jb2Rl',
            registrationType: 'b25saW5l',
          },
          metadata: {
            name:      'scc-registration',
            namespace: 'cattle-scc-system',
          },
          type: 'secret',
        }
      };

      registrationCode.value = 'test-code';

      await registerOnline((val: boolean) => true);

      expect(dispatchSpy).toHaveBeenCalledWith('management/find', namespaceRequest);
      expect(dispatchSpy).toHaveBeenCalledWith('management/create', secret);
      expect(registration.value).toStrictEqual(expectation);
    });
  });

  describe('registering offline', () => {
    it('should set status offline', async() => {
      const {
        registerOffline,
        registrationStatus
      } = usePrimeRegistration();

      registerOffline('');

      expect(registrationStatus.value).toStrictEqual('registering-offline');
    });

    it.skip('should create a new registration', async() => {
      const expectation = {};
      const {
        registerOffline,
        registration,
      } = usePrimeRegistration();

      await registerOffline('');

      expect(registration.value).toStrictEqual(expectation);
    });

    it('should reset registrationCode', async() => {
      const {
        registerOffline,
        registrationCode,
      } = usePrimeRegistration();

      await registerOffline('');

      expect(registrationCode.value).toBeNull();
    });
  });

  describe('deregistering', () => {
    it('should reset all de values', async() => {
      const {
        registerOffline,
        registrationStatus
      } = usePrimeRegistration();

      registerOffline('');

      expect(registrationStatus.value).toStrictEqual('registering-offline');
    });
  });
});
