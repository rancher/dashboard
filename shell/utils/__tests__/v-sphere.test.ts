import vSphereUtils, { VMWARE_VSPHERE } from '@shell/utils/v-sphere';

type MockSecret = {
  setData: jest.Mock,
  save: jest.Mock,
};

function makeStore(overrides: Record<string, any> = {}) {
  return {
    getters: {
      'management/urlOptions': jest.fn((path: string, opts: any) => `${ path }?filter=${ JSON.stringify(opts.filter) }`),
      'features/get':          jest.fn(() => true),
      ...overrides.getters,
    },
    dispatch: jest.fn(),
    ...overrides,
  };
}

function makeSecret(): MockSecret {
  return {
    setData: jest.fn(),
    save:    jest.fn().mockResolvedValue(undefined),
  };
}

function makeRke2Component(overrides: Record<string, any> = {}) {
  return {
    versionInfo:     {},
    userChartValues: {},
    chartVersionKey: (chartName: string) => chartName,
    value:           { metadata: { name: 'upstream-cluster', namespace: 'fleet-default' } },
    isEdit:          false,
    provider:        VMWARE_VSPHERE,
    $store:          makeStore(),
    ...overrides,
  };
}

describe('vSphereUtils handleVsphereCpiSecret', () => {
  it('does nothing when provider is not vmwarevsphere', async() => {
    const rke2Component = makeRke2Component({ provider: 'other-provider' });

    await vSphereUtils.handleVsphereCpiSecret(rke2Component);

    expect(rke2Component.$store.dispatch).not.toHaveBeenCalled();
  });

  it('does nothing when pre-bootstrap feature flag is disabled', async() => {
    const $store = makeStore({ getters: { 'features/get': jest.fn(() => false) } });
    const rke2Component = makeRke2Component({ $store });

    await vSphereUtils.handleVsphereCpiSecret(rke2Component);

    expect($store.dispatch).not.toHaveBeenCalled();
  });

  it('clears username/password and skips secret creation when generate checkbox is off', async() => {
    const userChartValues: any = { 'rancher-vsphere-cpi': { vCenter: { username: 'user1', password: 'pass1' } } };
    const rke2Component = makeRke2Component({
      userChartValues,
      versionInfo: { 'rancher-vsphere-cpi': { values: { vCenter: { credentialsSecret: { generate: false } } } } },
    });

    await vSphereUtils.handleVsphereCpiSecret(rke2Component);

    expect(userChartValues['rancher-vsphere-cpi'].vCenter.username).toStrictEqual('');
    expect(userChartValues['rancher-vsphere-cpi'].vCenter.password).toStrictEqual('');
    expect(rke2Component.$store.dispatch).not.toHaveBeenCalled();
  });

  it('throws when generate is enabled but username/password/host are missing', async() => {
    const userChartValues: any = { 'rancher-vsphere-cpi': { vCenter: {} } };
    const rke2Component = makeRke2Component({
      userChartValues,
      versionInfo: {
        'rancher-vsphere-cpi': {
          values: {
            vCenter: {
              credentialsSecret: { generate: true }, username: '', password: '', host: ''
            }
          }
        },
      },
    });

    await expect(vSphereUtils.handleVsphereCpiSecret(rke2Component)).rejects.toThrow('vSphere CPI username, password and host are all required when generating a new secret');
  });

  it('creates a new secret, populates data and resets chart values when no existing secret matches', async() => {
    const secret = makeSecret();
    const userChartValues: any = { 'rancher-vsphere-cpi': { vCenter: { username: 'user1', password: 'pass1' } } };
    const $store = makeStore();

    (($store.dispatch as jest.Mock))
      .mockResolvedValueOnce({ data: [] }) // findSecret: management/request
      .mockResolvedValueOnce(secret); // findOrCreateSecret: management/create

    const rke2Component = makeRke2Component({
      $store,
      userChartValues,
      versionInfo: {
        'rancher-vsphere-cpi': {
          values: {
            vCenter: {
              credentialsSecret: { generate: true }, username: 'user1', password: 'pass1', host: 'vcenter.local'
            }
          }
        },
      },
    });

    await vSphereUtils.handleVsphereCpiSecret(rke2Component);

    expect(secret.setData).toHaveBeenCalledWith('vcenter.local.username', 'user1');
    expect(secret.setData).toHaveBeenCalledWith('vcenter.local.password', 'pass1');
    expect(secret.save).toHaveBeenCalledWith();
    expect(userChartValues['rancher-vsphere-cpi'].vCenter.credentialsSecret).toStrictEqual({
      generate: false,
      name:     'rancher-vsphere-cpi-credentials',
    });
    expect(userChartValues['rancher-vsphere-cpi'].vCenter.username).toStrictEqual('');
    expect(userChartValues['rancher-vsphere-cpi'].vCenter.password).toStrictEqual('');
  });

  it('passes the matched existing secret json into management/create when one is found', async() => {
    const secret = makeSecret();
    const userChartValues: any = { 'rancher-vsphere-cpi': { vCenter: { username: 'user1', password: 'pass1' } } };
    const $store = makeStore();
    const existingSecret = {
      metadata: {
        annotations: {
          'provisioning.cattle.io/sync-target-namespace': 'kube-system',
          'provisioning.cattle.io/sync-target-name':      'rancher-vsphere-cpi-credentials',
          'rke.cattle.io/object-authorized-for-clusters': 'upstream-cluster',
        },
      },
    };

    (($store.dispatch as jest.Mock))
      .mockResolvedValueOnce({ data: [existingSecret] }) // findSecret: management/request
      .mockResolvedValueOnce(secret); // findOrCreateSecret: management/create

    const rke2Component = makeRke2Component({
      $store,
      userChartValues,
      versionInfo: {
        'rancher-vsphere-cpi': {
          values: {
            vCenter: {
              credentialsSecret: { generate: true }, username: 'user1', password: 'pass1', host: 'vcenter.local'
            }
          }
        },
      },
    });

    await vSphereUtils.handleVsphereCpiSecret(rke2Component);

    expect($store.dispatch).toHaveBeenCalledWith('management/create', existingSecret);
    expect(secret.setData).toHaveBeenCalledWith('vcenter.local.username', 'user1');
    expect(secret.save).toHaveBeenCalledWith();
  });

  it('rejects when multiple matching secrets are found', async() => {
    const userChartValues: any = { 'rancher-vsphere-cpi': { vCenter: { username: 'user1', password: 'pass1' } } };
    const $store = makeStore();
    const matchingSecret = {
      metadata: {
        annotations: {
          'provisioning.cattle.io/sync-target-namespace': 'kube-system',
          'provisioning.cattle.io/sync-target-name':      'rancher-vsphere-cpi-credentials',
          'rke.cattle.io/object-authorized-for-clusters': 'upstream-cluster',
        },
      },
    };

    (($store.dispatch as jest.Mock)).mockResolvedValueOnce({ data: [matchingSecret, matchingSecret] });

    const rke2Component = makeRke2Component({
      $store,
      userChartValues,
      versionInfo: {
        'rancher-vsphere-cpi': {
          values: {
            vCenter: {
              credentialsSecret: { generate: true }, username: 'user1', password: 'pass1', host: 'vcenter.local'
            }
          }
        },
      },
    });

    await expect(vSphereUtils.handleVsphereCpiSecret(rke2Component)).rejects.toThrow('this will cause synchronizing mishaps');
  });
});

describe('vSphereUtils handleVsphereCsiSecret', () => {
  it('does nothing when provider is not vmwarevsphere', async() => {
    const rke2Component = makeRke2Component({ provider: 'other-provider' });

    await vSphereUtils.handleVsphereCsiSecret(rke2Component);

    expect(rke2Component.$store.dispatch).not.toHaveBeenCalled();
  });

  it('clears username/password and skips secret creation when generate checkbox is off', async() => {
    const userChartValues: any = { 'rancher-vsphere-csi': { vCenter: { username: 'user1', password: 'pass1' } } };
    const rke2Component = makeRke2Component({
      userChartValues,
      versionInfo: { 'rancher-vsphere-csi': { values: { vCenter: { configSecret: { generate: false } } } } },
    });

    await vSphereUtils.handleVsphereCsiSecret(rke2Component);

    expect(userChartValues['rancher-vsphere-csi'].vCenter.username).toStrictEqual('');
    expect(userChartValues['rancher-vsphere-csi'].vCenter.password).toStrictEqual('');
    expect(rke2Component.$store.dispatch).not.toHaveBeenCalled();
  });

  it('throws when generate is enabled but username/password/host/datacenters are missing', async() => {
    const userChartValues: any = { 'rancher-vsphere-csi': { vCenter: {} } };
    const rke2Component = makeRke2Component({
      userChartValues,
      versionInfo: {
        'rancher-vsphere-csi': {
          values: {
            vCenter: {
              configSecret: { generate: true }, username: '', password: '', host: '', datacenters: ''
            }
          }
        },
      },
    });

    await expect(vSphereUtils.handleVsphereCsiSecret(rke2Component)).rejects.toThrow('vSphere CSI username, password, host and datacenters are all required when generating a new secret');
  });

  it('creates a new secret with the csi config file rendered from chart values', async() => {
    const secret = makeSecret();
    const userChartValues: any = { 'rancher-vsphere-csi': { vCenter: { username: 'user1', password: 'pass1' } } };
    const $store = makeStore();

    (($store.dispatch as jest.Mock))
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce(secret);

    const rke2Component = makeRke2Component({
      $store,
      userChartValues,
      versionInfo: {
        'rancher-vsphere-csi': {
          values: {
            vCenter: {
              configSecret: { generate: true },
              username:     'user1',
              password:     'pass1',
              host:         'vcenter.local',
              datacenters:  'dc1',
              port:         443,
              insecureFlag: false,
            }
          }
        },
      },
    });

    await vSphereUtils.handleVsphereCsiSecret(rke2Component);

    expect(secret.setData).toHaveBeenCalledWith('csi-vsphere.conf', expect.stringContaining('user = "user1"'));
    expect(secret.setData).toHaveBeenCalledWith('csi-vsphere.conf', expect.stringContaining('password = "pass1"'));
    expect(secret.setData).toHaveBeenCalledWith('csi-vsphere.conf', expect.stringContaining('cluster-id = "{{clusterId}}"'));
    expect(secret.save).toHaveBeenCalledWith();
    expect(userChartValues['rancher-vsphere-csi'].vCenter.configSecret).toStrictEqual({
      generate: false,
      name:     'rancher-vsphere-csi-credentials',
    });
    expect(userChartValues['rancher-vsphere-csi'].vCenter.username).toStrictEqual('');
    expect(userChartValues['rancher-vsphere-csi'].vCenter.host).toStrictEqual('');
    expect(userChartValues['rancher-vsphere-csi'].vCenter.datacenters).toStrictEqual('');
  });
});
