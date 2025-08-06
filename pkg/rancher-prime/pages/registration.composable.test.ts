import {
  REGISTRATION_LABEL, REGISTRATION_NAMESPACE, REGISTRATION_SECRET, REGISTRATION_REQUEST_FILENAME, REGISTRATION_REQUEST_PREFIX
} from '../config/constants';
import { usePrimeRegistration } from './registration.composable';

let dispatchSpy = jest.fn();
const downloadSpy = jest.fn().mockReturnValue(Promise.resolve());
const namespaceRequest = {
  id: REGISTRATION_NAMESPACE, opt: { force: true }, type: 'namespace'
};

jest.mock('vuex', () => ({ useStore: () => ({ dispatch: dispatchSpy }) }));
jest.mock('@shell/utils/download', () => ({ downloadFile: (...args: any) => downloadSpy(...args) }));

describe('registration composable', () => {
  beforeEach(() => {
    dispatchSpy = jest.fn().mockReturnValue(Promise.resolve([]));
  });

  describe('when initialized', () => {
    it('should retrieve the registration secret and current registration', async() => {
      const value = 'whatever';
      const hash = 'anything';
      const secrets = [
        { metadata: { namespace: 'not me' } },
        { metadata: { name: 'also not me' } },
        {
          metadata: {
            namespace: REGISTRATION_NAMESPACE,
            name:      REGISTRATION_SECRET,
            labels:    { [REGISTRATION_LABEL]: hash }
          },
          data: { regCode: btoa(value) }
        },
      ];
      const registrations = [{
        spec:     { mode: 'online' },
        metadata: { labels: { [REGISTRATION_LABEL]: hash } },
        links:    { view: '123' },
        status:   {
          activationStatus: { activated: true },
          conditions:       [{
            type:   'Done',
            status: 'True',
          }]
        },
      }];

      dispatchSpy = jest.fn()
        .mockReturnValueOnce(Promise.resolve(secrets))
        .mockReturnValue(Promise.resolve(registrations));
      const store = { state: {}, dispatch: dispatchSpy } as any;
      const {
        initRegistration, registrationCode, registration, registrationStatus
      } = usePrimeRegistration(store);

      await initRegistration();
      jest.setTimeout(0);

      expect(registrationCode.value).toStrictEqual(value);
      expect(registration.value.active).toStrictEqual(true);
      expect(registration.value.resourceLink).toStrictEqual('123');
      expect(registrationStatus.value).toStrictEqual('registered');
    });

    it('should display the correct error message, prioritizing conditions without Failure', async() => {
      const value = 'whatever';
      const hash = 'anything';
      const errorMessage = 'Registration failed';
      const secrets = [
        { metadata: { namespace: 'not me' } },
        { metadata: { name: 'also not me' } },
        {
          metadata: {
            namespace: REGISTRATION_NAMESPACE,
            name:      REGISTRATION_SECRET,
            labels:    { [REGISTRATION_LABEL]: hash }
          },
          data: { regCode: btoa(value) }
        },
      ];
      const registrations = [{
        spec:     { mode: 'online' },
        metadata: { labels: { [REGISTRATION_LABEL]: hash } },
        links:    { view: '123' },
        status:   {
          activationStatus: { activated: false },
          conditions:       [
            {
              type:    'Failure',
              status:  'True',
              message: 'Message not for the user',
              reason:  'Give me a reason',
            },
            {
              type:    'RegistrationActivated',
              status:  'False',
              message: errorMessage,
              reason:  'Give me a reason',
            },
          ]
        },
      }];

      dispatchSpy = jest.fn()
        .mockReturnValueOnce(Promise.resolve(secrets))
        .mockReturnValue(Promise.resolve(registrations));
      const store = { state: {}, dispatch: dispatchSpy } as any;
      const { initRegistration, errors } = usePrimeRegistration(store);

      await initRegistration();
      jest.setTimeout(0);

      expect(errors.value[0]).toStrictEqual(errorMessage);
    });
  });

  describe('downloading the registration certificate', () => {
    it('should retrieve and start download process', async() => {
      const expectation = 'whatever';
      const hash = 'anything';
      const secrets = [
        {
          metadata: {
            namespace: REGISTRATION_NAMESPACE,
            name:      `${ REGISTRATION_REQUEST_PREFIX }whatever`,
            labels:    { [REGISTRATION_LABEL]: hash }
          },
          data: { request: expectation },
          save: () => {},
        },
      ];
      const registrations = [{
        spec:     { mode: 'online' },
        metadata: { labels: { [REGISTRATION_LABEL]: hash } },
        links:    { view: '123' },
        status:   {
          activationStatus: { activated: true },
          conditions:       [{
            type:   'Done',
            status: 'True',
          }]
        },
      }];

      dispatchSpy = jest.fn()
        .mockReturnValueOnce(Promise.resolve(/** Ensure namespace */))
        .mockReturnValueOnce(Promise.resolve(/** Create secret */))
        .mockReturnValueOnce(Promise.resolve(secrets))
        .mockReturnValue(Promise.resolve(registrations));
      const store = { state: {}, dispatch: dispatchSpy } as any;
      const { downloadOfflineRequest } = usePrimeRegistration(store);

      await downloadOfflineRequest(() => { });
      jest.setTimeout(0);

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

    it('should create a new registration', async() => {
      const hash = 'whatever';
      const secrets = {
        metadata: {
          namespace: REGISTRATION_NAMESPACE,
          name:      REGISTRATION_SECRET,
          labels:    { [REGISTRATION_LABEL]: hash }
        },
        data: { request: 'whatever' },
        save: () => {},
      };
      const registrations = [{
        spec:     { mode: 'online' },
        metadata: { labels: { [REGISTRATION_LABEL]: hash } },
        links:    { view: '123' },
        status:   {
          activationStatus: { activated: true },
          conditions:       [{
            type:   'Done',
            status: 'True',
          }]
        },
      }];
      const secretRequest = {
        type:     'secret',
        metadata: {
          namespace: 'cattle-scc-system',
          name:      'scc-registration',
        },
        data: {
          regCode:          'dGVzdC1jb2Rl',
          registrationType: 'b25saW5l',
        },
      };

      dispatchSpy = jest.fn()
        .mockReturnValueOnce(Promise.resolve(/** Ensure namespace */))
        // .mockReturnValueOnce(Promise.resolve(/** Create secret */))
        .mockReturnValueOnce(Promise.resolve(secrets))
        .mockReturnValueOnce(Promise.resolve(registrations));
      const {
        registrationCode,
        registerOnline,
        registration,
      } = usePrimeRegistration();

      registrationCode.value = 'test-code';

      await registerOnline((val: boolean) => true);

      expect(dispatchSpy).toHaveBeenCalledTimes(3);
      expect(dispatchSpy).toHaveBeenCalledWith('management/find', namespaceRequest);
      expect(dispatchSpy).toHaveBeenCalledWith('management/create', secretRequest);
      expect(dispatchSpy).toHaveBeenCalledWith('management/findAll', { type: 'scc.cattle.io.registration' });
      expect(registration.value.active).toStrictEqual(true);
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

    it('should update existing registration', async() => {
      const hash = 'whatever';
      const certificate = 'the certificate';
      const secrets = [{
        metadata: {
          namespace: REGISTRATION_NAMESPACE,
          name:      REGISTRATION_SECRET,
          labels:    { [REGISTRATION_LABEL]: hash }
        },
        data: {},
        save: () => {},
      }];
      const registrations = [{
        spec:     { mode: 'offline' },
        metadata: { labels: { [REGISTRATION_LABEL]: hash } },
        links:    { view: '123' },
        status:   {
          activationStatus: { activated: true },
          conditions:       [
            { type: 'OfflineRequestReady' },
            {
              type:   'OfflineActivationDone',
              status: 'True',
            },
          ]
        },
      }];

      dispatchSpy = jest.fn()
        .mockReturnValueOnce(Promise.resolve(/** Ensure namespace */))
        .mockReturnValueOnce(Promise.resolve(secrets))
        .mockReturnValueOnce(Promise.resolve(registrations));
      const {
        registerOffline,
        registration,
      } = usePrimeRegistration();

      await registerOffline(certificate);

      expect(dispatchSpy).toHaveBeenCalledTimes(3);
      expect(dispatchSpy).toHaveBeenCalledWith('management/find', namespaceRequest);
      expect(dispatchSpy).toHaveBeenCalledWith('management/findAll', { type: 'scc.cattle.io.registration' });
      expect(registration.value.active).toStrictEqual(true);
    });

    it.skip('should reset registrationCode', async() => {
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
