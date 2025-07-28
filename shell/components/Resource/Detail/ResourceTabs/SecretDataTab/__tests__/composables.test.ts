import * as authTypes from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/auth-types';
import { useSecretDataTabDefaultProps } from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/composeables';
import { SECRET_TYPES } from '@shell/config/secret';

jest.mock('@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/auth-types');
jest.mock('vuex', () => ({ useStore: jest.fn() }));

describe('composables: SecretDataTab/composables', () => {
  describe('useSecretDataTabDefaultProps', () => {
    const useSecretInfoSpy = jest.spyOn(authTypes, 'useSecretInfo');
    const resource = { type: 'Resource' };

    it('should return the appropriate props when secret type is DOCKER_JSON', () => {
      const dockerRegistry = { type: 'DockerRegistry' };
      const dockerBasic = { type: 'DockerBasic' };
      const useDockerRegistrySpy = jest.spyOn(authTypes, 'useDockerRegistry');
      const useDockerBasic = jest.spyOn(authTypes, 'useDockerBasic');

      useSecretInfoSpy.mockImplementation((): any => ({ value: { secretType: SECRET_TYPES.DOCKER_JSON } }));
      useDockerRegistrySpy.mockImplementation((): any => ({ value: dockerRegistry }));
      useDockerBasic.mockImplementation((): any => ({ value: dockerBasic }));

      const props = useSecretDataTabDefaultProps(resource);

      expect(props.value.tabLabel).toStrictEqual('secret.data');
      expect(useDockerRegistrySpy).toHaveBeenCalledWith(resource);
      expect(useDockerBasic).toHaveBeenCalledWith(resource);
      expect(props.value.secretData.registry).toStrictEqual(dockerRegistry);
      expect(props.value.secretData.basicAuth).toStrictEqual(dockerBasic);
    });

    it('should return the appropriate props when secret type is TLS', () => {
      const tls = { type: 'TLS' };
      const useTlsSpy = jest.spyOn(authTypes, 'useTls');

      useSecretInfoSpy.mockImplementation((): any => ({ value: { secretType: SECRET_TYPES.TLS } }));
      useTlsSpy.mockImplementation((): any => ({ value: tls }));

      const props = useSecretDataTabDefaultProps(resource);

      expect(props.value.tabLabel).toStrictEqual('secret.certificate.certificate');
      expect(useTlsSpy).toHaveBeenCalledWith(resource);
      expect(props.value.secretData.certificate).toStrictEqual(tls);
    });

    it('should return the appropriate props when secret type is SERVICE_ACCT', () => {
      const serviceAccount = { type: 'serviceAccount' };
      const useServiceAccountSpy = jest.spyOn(authTypes, 'useServiceAccount');

      useSecretInfoSpy.mockImplementation((): any => ({ value: { secretType: SECRET_TYPES.SERVICE_ACCT } }));
      useServiceAccountSpy.mockImplementation((): any => ({ value: serviceAccount }));

      const props = useSecretDataTabDefaultProps(resource);

      expect(props.value.tabLabel).toStrictEqual('secret.data');
      expect(useServiceAccountSpy).toHaveBeenCalledWith(resource);
      expect(props.value.secretData.serviceAccount).toStrictEqual(serviceAccount);
    });

    it('should return the appropriate props when secret type is SSH', () => {
      const ssh = { type: 'SSH' };
      const useSshSpy = jest.spyOn(authTypes, 'useSsh');

      useSecretInfoSpy.mockImplementation((): any => ({ value: { secretType: SECRET_TYPES.SSH } }));
      useSshSpy.mockImplementation((): any => ({ value: ssh }));

      const props = useSecretDataTabDefaultProps(resource);

      expect(props.value.tabLabel).toStrictEqual('secret.ssh.keys');
      expect(useSshSpy).toHaveBeenCalledWith(resource);
      expect(props.value.secretData.ssh).toStrictEqual(ssh);
    });

    it('should return the appropriate props when secret type is BASIC', () => {
      const basic = { type: 'basic' };
      const useBasicSpy = jest.spyOn(authTypes, 'useBasic');

      useSecretInfoSpy.mockImplementation((): any => ({ value: { secretType: SECRET_TYPES.BASIC } }));
      useBasicSpy.mockImplementation((): any => ({ value: basic }));

      const props = useSecretDataTabDefaultProps(resource);

      expect(props.value.tabLabel).toStrictEqual('secret.data');
      expect(useBasicSpy).toHaveBeenCalledWith(resource);
      expect(props.value.secretData.basicAuth).toStrictEqual(basic);
    });

    it('should return the appropriate props when secret type is anything else', () => {
      const basic = { type: 'basic' };
      const useBasicSpy = jest.spyOn(authTypes, 'useBasic');

      useSecretInfoSpy.mockImplementation((): any => ({ value: { secretType: SECRET_TYPES.FLEET_CLUSTER } }));
      useBasicSpy.mockImplementation((): any => ({ value: basic }));

      const props = useSecretDataTabDefaultProps(resource);

      expect(props.value.tabLabel).toStrictEqual('secret.data');
      expect(useBasicSpy).toHaveBeenCalledWith(resource);
      expect(props.value.secretData.basic).toStrictEqual(basic);
    });
  });
});
