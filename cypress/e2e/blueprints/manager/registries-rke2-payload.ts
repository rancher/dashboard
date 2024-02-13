export function machineSelectorConfigPayload(registryHost: string):Array<object> {
  return [
    {
      config: {
        'protect-kernel-defaults': false,
        'system-default-registry': registryHost,
      },
    },
  ];
}

export function registriesWithSecretPayload(registryAuthHost: string, registrySecret: string):object {
  return {
    configs: {
      [registryAuthHost]: {
        authConfigSecretName: registrySecret,
        caBundle:             '',
        insecureSkipVerify:   false,
        tlsSecretName:        null
      },
    },
    mirrors: {},
  };
}
