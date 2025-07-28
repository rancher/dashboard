import { computed, toValue } from 'vue';
import { base64Decode } from '@shell/utils/crypto';

export const useSecretInfo = (resource: any) => {
  return computed(() => {
    const resourceValue = toValue(resource);

    return {
      secretType: resourceValue._type,
      secretData: resourceValue.data || {}
    };
  });
};

export const useSecretRows = (resource: any) => {
  return computed(() => {
    const resourceValue = toValue(resource);

    const rows: any[] = [];
    const { data = {} } = resourceValue;

    Object.keys(data).forEach((key) => {
      const value = base64Decode(data[key]);

      rows.push({
        key,
        value
      });
    });

    return rows;
  });
};

export const useDockerAuths = (resource: any) => {
  const secretInfo = useSecretInfo(resource);

  return computed(() => {
    const json = base64Decode(secretInfo.value.secretData['.dockerconfigjson']);

    return JSON.parse(json).auths;
  });
};

export const useDockerRegistry = (resource: any) => {
  const dockerAuths = useDockerAuths(resource);

  return computed(() => {
    return { registryUrl: Object.keys(dockerAuths.value)[0] };
  });
};

export const useDockerBasic = (resource: any) => {
  const dockerAuths = useDockerAuths(resource);
  const dockerRegistry = useDockerRegistry(resource);

  return computed(() => {
    return {
      username: dockerAuths.value[dockerRegistry.value.registryUrl].username,
      password: dockerAuths.value[dockerRegistry.value.registryUrl].password,
    };
  });
};

export const useBasic = (resource: any) => {
  const rows = useSecretRows(resource);
  const secretInfo = useSecretInfo(resource);

  return computed(() => {
    return {
      username: base64Decode(secretInfo.value.secretData.username || ''),
      password: base64Decode(secretInfo.value.secretData.password || ''),
      rows:     rows.value
    };
  });
};

export const useSsh = (resource: any) => {
  const secretInfo = useSecretInfo(resource);

  return computed(() => {
    return {
      username: base64Decode(secretInfo.value.secretData['ssh-publickey'] || ''),
      password: base64Decode(secretInfo.value.secretData['ssh-privatekey'] || ''),
    };
  });
};

export const useServiceAccount = (resource: any) => {
  const secretInfo = useSecretInfo(resource);

  return computed(() => {
    return {
      token: base64Decode(secretInfo.value.secretData['token']),
      crt:   base64Decode(secretInfo.value.secretData['ca.crt']),
    };
  });
};

export const useTls = (resource: any) => {
  const secretInfo = useSecretInfo(resource);

  return computed(() => {
    return {
      token: base64Decode(secretInfo.value.secretData['tls.key']),
      crt:   base64Decode(secretInfo.value.secretData['tls.crt']),
    };
  });
};
