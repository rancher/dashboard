export function machineSelectorConfigPayload(registryHost: string) {
  return [
    {
      config: {
        "protect-kernel-defaults": false,
        "system-default-registry": registryHost,
      },
    },
  ];
}

export function registriesWithSecretPayload(registryAuthHost: string, registrySecret: string) {
  return {
    configs: {
      [registryAuthHost]: {
        authConfigSecretName: registrySecret,
        caBundle: "",
        insecureSkipVerify: false,
        tlsSecretName: null,
      },
    },
    mirrors: {},
  };
}
