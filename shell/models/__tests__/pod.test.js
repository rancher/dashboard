import Pod from '@shell/models/pod.js';

describe('model: pod openShell', () => {
  it('should send permission check request', async() => {
    const dispatch = jest.fn();
    const pod = new Pod({}, { dispatch });

    const endpoint = '/k8s/clusters/test';
    const namespace = 'namespace';
    const name = 'name';

    const url = `${ endpoint }/apis/authorization.k8s.io/v1/selfsubjectaccessreviews`;
    const params = {
      spec: {
        resourceAttributes: {
          namespace,
          resource:    'pods',
          verb:        'create',
          name,
          subresource: 'exec',
        }
      }
    };

    await pod.hasExecShellPermission(endpoint, namespace, name);
    expect(dispatch).toHaveBeenCalledWith('cluster/request', {
      url,
      method: 'POST',
      data:   params,
    }, { root: true });
  });

  it('should check permission if user is readonly admin', async() => {
    const rootGetters = { clusterId: 'clusterId', 'auth/isReadOnlyAdmin': true };
    const dispatch = jest.fn();
    const hasExecShellPermission = jest.fn(() => ({ status: { allowed: true } }));

    const pod = new Pod({
      metadata: {
        namespace: 'namespace',
        name:      'name'
      },
      hasExecShellPermission
    }, { rootGetters, dispatch });

    await pod.openShell('containerName');
    expect(hasExecShellPermission).toHaveBeenCalledWith('/k8s/clusters/clusterId', 'namespace', 'name');
    expect(dispatch.mock.calls[0][0]).toBe('wm/open');
  });

  it('should show error message if no permission', async() => {
    const t = jest.fn();
    const rootGetters = {
      clusterId: 'clusterId', 'auth/isReadOnlyAdmin': true, 'i18n/t': t
    };
    const dispatch = jest.fn();

    const hasExecShellPermission = jest.fn(() => ({ status: { allowed: false } }));

    const pod = new Pod({
      metadata: {
        namespace: 'namespace',
        name:      'name'
      },
      hasExecShellPermission
    }, { rootGetters, dispatch });

    await pod.openShell('containerName');
    expect(hasExecShellPermission).toHaveBeenCalledWith('/k8s/clusters/clusterId', 'namespace', 'name');
    expect(dispatch.mock.calls[0][0]).toBe('growl/error');
    expect(t).toHaveBeenCalledWith('wm.containerShell.permissionDenied.message');
  });

  it('should show error message if check permission failed', async() => {
    const t = jest.fn();
    const rootGetters = {
      clusterId: 'clusterId', 'auth/isReadOnlyAdmin': true, 'i18n/t': t
    };
    const dispatch = jest.fn();

    const hasExecShellPermission = jest.fn(() => Promise.reject(new Error('error')));

    const pod = new Pod({
      metadata: {
        namespace: 'namespace',
        name:      'name'
      },
      hasExecShellPermission
    }, { rootGetters, dispatch });

    await pod.openShell('containerName');
    expect(hasExecShellPermission).toHaveBeenCalledWith('/k8s/clusters/clusterId', 'namespace', 'name');
    expect(dispatch.mock.calls[0][0]).toBe('growl/error');
    expect(t).toHaveBeenCalledWith('wm.containerShell.permissionDenied.title');
  });
});
