import * as authTypes from '@shell/components/Resource/Detail/ResourceTabs/SecretDataTab/auth-types';
import * as crypto from '@shell/utils/crypto';

jest.mock('@shell/utils/crypto');
jest.mock('vuex', () => ({ useStore: jest.fn() }));

describe('composables: SecretDataTab/auth-types', () => {
  const resource = { _type: 'RESOURCE', data: { type: 'data' } };
  const base64 = '64 decoded string';
  const base64DecodeSpy = jest.spyOn(crypto, 'base64Decode');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useSecretInfo', () => {
    it('should return the secret type and data set in resource', () => {
      const info = authTypes.useSecretInfo(resource);

      expect(info.value.secretType).toStrictEqual(resource._type);
      expect(info.value.secretData).toStrictEqual(resource.data);
    });

    it('should return the an empty object for secretData if not set on resource', () => {
      const info = authTypes.useSecretInfo({ _type: 'RESOURCE' });

      expect(info.value.secretType).toStrictEqual(resource._type);
      expect(info.value.secretData).toStrictEqual({});
    });
  });

  describe('useSecretRows', () => {
    it('should return empty array if data is not set', () => {
      const rows = authTypes.useSecretRows({});

      expect(rows.value).toStrictEqual([]);
    });

    it('should return a base64Decoded key/value if data is set', () => {
      base64DecodeSpy.mockReturnValue(base64);
      const row = { mockKey: 'value' };
      const rows = authTypes.useSecretRows({ data: row });

      expect(rows.value[0].key).toStrictEqual('mockKey');
      expect(rows.value[0].value).toStrictEqual(base64);
      expect(base64DecodeSpy).toHaveBeenCalledWith(row.mockKey);
    });
  });

  describe('decodeDockerAuthEntry', () => {
    it('should return the username and password when they are set explicitly', () => {
      const entry = { username: 'USERNAME', password: 'PASSWORD' };

      expect(authTypes.decodeDockerAuthEntry(entry)).toStrictEqual({ username: 'USERNAME', password: 'PASSWORD' });
      expect(base64DecodeSpy).not.toHaveBeenCalled();
    });

    it('should decode the base64 `auth` field (username:password) when username/password are not set', () => {
      base64DecodeSpy.mockReturnValue('USERNAME:PASSWORD');

      expect(authTypes.decodeDockerAuthEntry({ auth: 'base64Auth' })).toStrictEqual({ username: 'USERNAME', password: 'PASSWORD' });
      expect(base64DecodeSpy).toHaveBeenCalledWith('base64Auth');
    });

    it('should only split on the first colon so passwords may contain colons', () => {
      base64DecodeSpy.mockReturnValue('USERNAME:PASS:WORD');

      expect(authTypes.decodeDockerAuthEntry({ auth: 'base64Auth' })).toStrictEqual({ username: 'USERNAME', password: 'PASS:WORD' });
    });

    it.each([
      ['undefined entry', undefined],
      ['empty entry', {}],
      ['auth without a colon', { auth: 'base64Auth' }],
    ])('should return empty strings for %s', (_label, entry) => {
      base64DecodeSpy.mockReturnValue('nocolon');

      expect(authTypes.decodeDockerAuthEntry(entry as any)).toStrictEqual({ username: '', password: '' });
    });
  });

  describe('useDockerAuths', () => {
    it('should return the auths field from a base64decoded json object in the `.dockerconfigjson` data field', () => {
      const data = { '.dockerconfigjson': 'base64Json' };
      const json = { auths: { 'registry-url.com': { username: 'u' } } };

      base64DecodeSpy.mockReturnValue(JSON.stringify(json));
      const dockerAuths = authTypes.useDockerAuths({ data });

      expect(dockerAuths.value).toStrictEqual(json.auths);
      expect(base64DecodeSpy).toHaveBeenCalledWith(data['.dockerconfigjson']);
    });

    it('should return an empty object when the json is invalid', () => {
      const data = { '.dockerconfigjson': 'base64Json' };

      base64DecodeSpy.mockReturnValue('not-valid-json');
      const dockerAuths = authTypes.useDockerAuths({ data });

      expect(dockerAuths.value).toStrictEqual({});
    });

    it('should return an empty object when there is no auths key', () => {
      const data = { '.dockerconfigjson': 'base64Json' };

      base64DecodeSpy.mockReturnValue(JSON.stringify({ someOtherKey: true }));
      const dockerAuths = authTypes.useDockerAuths({ data });

      expect(dockerAuths.value).toStrictEqual({});
    });
  });

  describe('useDockerRegistry', () => {
    it('should return the first value from the docker auths', () => {
      const data = { '.dockerconfigjson': 'base64Json' };
      const registryUrl = 'registry-url.com';
      const json = { auths: { [registryUrl]: { something: 'test' } } };

      base64DecodeSpy.mockReturnValue(JSON.stringify(json));
      const registry = authTypes.useDockerRegistry({ data });

      expect(registry.value.registryUrl).toStrictEqual(registryUrl);
      expect(base64DecodeSpy).toHaveBeenCalledWith(data['.dockerconfigjson']);
    });

    it('should return an undefined registryUrl without throwing when there are no auths', () => {
      const data = { '.dockerconfigjson': 'base64Json' };

      base64DecodeSpy.mockReturnValue('not-valid-json');
      const registry = authTypes.useDockerRegistry({ data });

      expect(registry.value.registryUrl).toBeUndefined();
    });
  });

  describe('useDockerBasic', () => {
    it('should return the username and password from the docker auths', () => {
      const data = { '.dockerconfigjson': 'base64Json' };
      const registryUrl = 'registry-url.com';
      const username = 'USERNAME';
      const password = 'PASSWORD';
      const json = { auths: { [registryUrl]: { username, password } } };

      base64DecodeSpy.mockReturnValue(JSON.stringify(json));
      const dockerBasic = authTypes.useDockerBasic({ data });

      expect(dockerBasic.value.username).toStrictEqual(username);
      expect(dockerBasic.value.password).toStrictEqual(password);
      expect(base64DecodeSpy).toHaveBeenCalledWith(data['.dockerconfigjson']);
    });

    it('should decode the base64 `auth` field when username/password are not present', () => {
      const data = { '.dockerconfigjson': 'base64Json' };
      const registryUrl = 'registry-url.com';
      const json = { auths: { [registryUrl]: { auth: 'base64Auth' } } };

      base64DecodeSpy
        .mockReturnValueOnce(JSON.stringify(json)) // dockerAuths.value
        .mockReturnValueOnce(JSON.stringify(json)) // dockerRegistry -> dockerAuths.value
        .mockReturnValueOnce('USERNAME:PASSWORD'); // decodeDockerAuthEntry(auth)

      const dockerBasic = authTypes.useDockerBasic({ data });

      expect(dockerBasic.value.username).toStrictEqual('USERNAME');
      expect(dockerBasic.value.password).toStrictEqual('PASSWORD');
    });

    it('should return empty strings without throwing when there are no auths', () => {
      const data = { '.dockerconfigjson': 'base64Json' };

      base64DecodeSpy.mockReturnValue('not-valid-json');
      const dockerBasic = authTypes.useDockerBasic({ data });

      expect(dockerBasic.value).toStrictEqual({ username: '', password: '' });
    });
  });

  describe('useBasic', () => {
    it('should return the username, password, rows from the docker auths', () => {
      const username = 'USERNAME';
      const password = 'PASSWORD';
      const data = { username, password };

      base64DecodeSpy
        .mockReturnValueOnce(username)
        .mockReturnValueOnce(password)
        .mockReturnValueOnce(username)
        .mockReturnValueOnce(password);

      const basic = authTypes.useBasic({ data });

      expect(basic.value.username).toStrictEqual(username);
      expect(basic.value.password).toStrictEqual(password);
      expect(basic.value.rows).toStrictEqual([{ key: 'username', value: username }, { key: 'password', value: password }]);
      expect(base64DecodeSpy).toHaveBeenCalledWith(username);
      expect(base64DecodeSpy).toHaveBeenCalledWith(password);
      expect(base64DecodeSpy).toHaveBeenCalledWith(username);
      expect(base64DecodeSpy).toHaveBeenCalledWith(password);
    });
  });

  describe('useSsh', () => {
    it('should return the username, password from data fields ssh-publickey/privatekey', () => {
      const username = 'USERNAME';
      const password = 'PASSWORD';
      const data = {
        'ssh-publickey':  username,
        'ssh-privatekey': password
      };

      base64DecodeSpy
        .mockReturnValueOnce(username)
        .mockReturnValueOnce(password);

      const ssh = authTypes.useSsh({ data });

      expect(ssh.value.username).toStrictEqual(username);
      expect(ssh.value.password).toStrictEqual(password);

      expect(base64DecodeSpy).toHaveBeenCalledWith(username);
      expect(base64DecodeSpy).toHaveBeenCalledWith(password);
    });
  });

  describe('useServiceAccount', () => {
    it('should return the token, crt from data fields token, ca.crt', () => {
      const token = 'TOKEN';
      const crt = 'CRT';
      const data = {
        token,
        'ca.crt': crt
      };

      base64DecodeSpy
        .mockReturnValueOnce(token)
        .mockReturnValueOnce(crt);

      const serviceAccount = authTypes.useServiceAccount({ data });

      expect(serviceAccount.value.token).toStrictEqual(token);
      expect(serviceAccount.value.crt).toStrictEqual(crt);

      expect(base64DecodeSpy).toHaveBeenCalledWith(token);
      expect(base64DecodeSpy).toHaveBeenCalledWith(crt);
    });
  });

  describe('useTls', () => {
    it('should return the token, crt from data fields token, ca.crt', () => {
      const token = 'TOKEN';
      const crt = 'CRT';
      const data = {
        'tls.key': token,
        'tls.crt': crt
      };

      base64DecodeSpy
        .mockReturnValueOnce(token)
        .mockReturnValueOnce(crt);

      const serviceAccount = authTypes.useTls({ data });

      expect(serviceAccount.value.token).toStrictEqual(token);
      expect(serviceAccount.value.crt).toStrictEqual(crt);

      expect(base64DecodeSpy).toHaveBeenCalledWith(token);
      expect(base64DecodeSpy).toHaveBeenCalledWith(crt);
    });
  });
});
