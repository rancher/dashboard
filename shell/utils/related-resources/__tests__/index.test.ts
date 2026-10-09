import {
  ALL_RELATED_RESOURCES,
  apiGroupOf,
  capiBootstrapDataSecret,
  findAllOf,
  findIfExists,
  ingressBackends,
  ingressServiceNames,
  isClaimFromTemplate,
  isExpectedFetchError,
  podSpecReferences,
  relatedEntry,
  selectsLabels,
  workloadsInNamespace,
} from '@shell/utils/related-resources';
import {
  CONFIG_MAP, POD, PVC, SECRET, SERVICE_ACCOUNT, WORKLOAD_TYPES
} from '@shell/config/types';

// the options of every list request: no watch, and the type is not marked as loaded
const LIST_OPTIONS = { watch: false, load: 'multi' };

/**
 * A model to fetch through, in a store holding `cached` and with a schema for each of `types`
 *
 * `find` and `findAll` resolve the `find` and `findAll` actions of the store
 */
const storeModel = ({
  types = [] as string[],
  cached = {} as { [key: string]: any },
  find = jest.fn() as jest.Mock,
  findAll = jest.fn() as jest.Mock,
} = {}) => ({
  $getters: {
    schemaFor: jest.fn((type: string) => (types.includes(type) ? { id: type } : null)),
    byId:      jest.fn((type: string, id: string) => cached[`${ type }:${ id }`]),
  },
  $dispatch: jest.fn((action: string, payload: any) => (action === 'find' ? find(payload) : findAll(payload))),
});

describe('utils: related-resources', () => {
  describe('options for the primary resource', () => {
    it('should ask for both dependencies and dependents', () => {
      expect(ALL_RELATED_RESOURCES).toStrictEqual({ dependencies: true, dependents: true });
    });
  });

  describe('relatedEntry', () => {
    const resource = { type: 'configmap', typeDisplay: 'ConfigMap' };

    it('should group the resource under its `typeDisplay`', () => {
      expect(relatedEntry(resource)).toStrictEqual({ resource, group: 'ConfigMap' });
    });

    it('should set `dependent` only when it is true', () => {
      expect(relatedEntry(resource, { dependent: true })).toStrictEqual({
        resource, group: 'ConfigMap', dependent: true
      });
      expect(relatedEntry(resource, { dependent: false })).toStrictEqual({ resource, group: 'ConfigMap' });
    });

    it('should set `banner` only when one is given', () => {
      const banner = () => ({ label: 'Shared' });

      expect(relatedEntry(resource, { banner })).toStrictEqual({
        resource, group: 'ConfigMap', banner
      });
    });
  });

  describe('findIfExists', () => {
    it.each([
      ['type', '', 'ns/a'],
      ['id', 'configmap', ''],
    ])('should resolve to null without a request when there is no %s', async(_label, type, id) => {
      const model = storeModel({ types: ['configmap'] });

      expect(await findIfExists(model, type, id)).toBeNull();
      expect(model.$dispatch).toHaveBeenCalledTimes(0);
    });

    it('should resolve to null without a request when the user has no schema for the type', async() => {
      const model = storeModel();

      expect(await findIfExists(model, 'configmap', 'ns/a')).toBeNull();
      expect(model.$dispatch).toHaveBeenCalledTimes(0);
    });

    it('should resolve to the resource in the store without a request', async() => {
      const cachedResource = { id: 'ns/a' };
      const model = storeModel({ types: ['configmap'], cached: { 'configmap:ns/a': cachedResource } });

      expect(await findIfExists(model, 'configmap', 'ns/a')).toBe(cachedResource);
      expect(model.$dispatch).toHaveBeenCalledTimes(0);
    });

    it('should fetch a resource that is not in the store, without starting a watch', async() => {
      const fetched = { id: 'ns/a' };
      const model = storeModel({ types: ['configmap'], find: jest.fn(() => Promise.resolve(fetched)) });

      expect(await findIfExists(model, 'configmap', 'ns/a')).toBe(fetched);
      expect(model.$dispatch).toHaveBeenCalledWith('find', {
        type: 'configmap', id: 'ns/a', opt: { watch: false }
      });
    });

    // a schema's resourceMethods cover every namespace, so a type the user can get can still be forbidden in one namespace
    it.each([
      ['does not exist', 404],
      ['is forbidden in its namespace', 403],
    ])('should resolve to null, without a warning, when the resource %s', async(_label, status) => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const model = storeModel({ types: ['configmap'], find: jest.fn(() => Promise.reject({ _status: status })) }); // eslint-disable-line prefer-promise-reject-errors

      expect(await findIfExists(model, 'configmap', 'ns/a')).toBeNull();
      expect(warn).toHaveBeenCalledTimes(0);

      warn.mockRestore();
    });

    it('should resolve to null, with a warning, when the request fails for another reason', async() => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const error = { _status: 500 };
      const model = storeModel({ types: ['configmap'], find: jest.fn(() => Promise.reject(error)) });

      expect(await findIfExists(model, 'configmap', 'ns/a')).toBeNull();
      expect(warn).toHaveBeenCalledWith('Failed to fetch configmap ns/a', error);

      warn.mockRestore();
    });
  });

  describe('findAllOf', () => {
    it('should resolve to no resources without a request when the user has no schema for the type', async() => {
      const model = storeModel();

      expect(await findAllOf(model, 'configmap')).toStrictEqual([]);
      expect(model.$dispatch).toHaveBeenCalledTimes(0);
    });

    it('should fetch every resource of the type when no namespace is given', async() => {
      const all = [{ metadata: { namespace: 'a' } }, { metadata: { namespace: 'b' } }];
      const model = storeModel({ types: ['configmap'], findAll: jest.fn(() => Promise.resolve(all)) });

      expect(await findAllOf(model, 'configmap')).toStrictEqual(all);
      expect(model.$dispatch).toHaveBeenCalledWith('findAll', { type: 'configmap', opt: LIST_OPTIONS });
    });

    it('should fetch the resources of the namespace, and drop any the store returns from other namespaces', async() => {
      const inNamespace = { metadata: { namespace: 'a' } };
      const model = storeModel({ types: ['configmap'], findAll: jest.fn(() => Promise.resolve([inNamespace, { metadata: { namespace: 'b' } }])) });

      expect(await findAllOf(model, 'configmap', 'a')).toStrictEqual([inNamespace]);
      expect(model.$dispatch).toHaveBeenCalledWith('findAll', { type: 'configmap', opt: { ...LIST_OPTIONS, namespaced: 'a' } });
    });

    // a watch outlives the editor, and a type marked as loaded without one makes a later list page miss changes
    it.each([
      ['every namespace', undefined],
      ['one namespace', 'a'],
    ])('should start no watch and leave the type unmarked as loaded, for %s', async(_label, namespace) => {
      const model = storeModel({ types: ['configmap'], findAll: jest.fn(() => Promise.resolve([])) });

      await findAllOf(model, 'configmap', namespace);

      const [[, { opt }]] = model.$dispatch.mock.calls;

      expect(opt.watch).toBe(false);
      expect(opt.load).toBe('multi');
    });

    it('should resolve to no resources when the store resolves to nothing', async() => {
      const model = storeModel({ types: ['configmap'], findAll: jest.fn(() => Promise.resolve(undefined)) });

      expect(await findAllOf(model, 'configmap')).toStrictEqual([]);
    });

    it('should resolve to no resources, with a warning, when the request fails', async() => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const error = new Error('forbidden');
      const model = storeModel({ types: ['configmap'], findAll: jest.fn(() => Promise.reject(error)) });

      expect(await findAllOf(model, 'configmap', 'a')).toStrictEqual([]);
      expect(warn).toHaveBeenCalledWith('Failed to fetch configmap in namespace a', error);

      warn.mockRestore();
    });
  });

  describe('isExpectedFetchError', () => {
    it.each([
      [404, true],
      [403, true],
      [500, false],
      [undefined, false],
    ])('should treat a status of %p as expected: %p', (status, expected) => {
      expect(isExpectedFetchError({ _status: status })).toBe(expected);
    });

    it('should not treat a missing error as expected', () => {
      expect(isExpectedFetchError(undefined)).toBe(false);
    });
  });

  describe('workloadsInNamespace', () => {
    it('should fetch every workload type in the namespace', async() => {
      const types = Object.values(WORKLOAD_TYPES);
      const model = storeModel({ types, findAll: jest.fn(() => Promise.resolve([])) });

      await workloadsInNamespace(model, 'a');

      expect(model.$dispatch.mock.calls.map(([, { type }]) => type)).toStrictEqual(types);
    });

    it('should fetch the pods in the namespace too', async() => {
      const types = [...Object.values(WORKLOAD_TYPES), POD];
      const model = storeModel({ types, findAll: jest.fn(() => Promise.resolve([])) });

      await workloadsInNamespace(model, 'a');

      expect(model.$dispatch.mock.calls.map(([, { type }]) => type)).toStrictEqual(types);
    });

    it('should return a pod no workload owns', async() => {
      const pod = { metadata: { namespace: 'a' }, ownedByWorkload: false };
      const findAll = jest.fn(({ type }) => Promise.resolve(type === POD ? [pod] : []));
      const model = storeModel({ types: [...Object.values(WORKLOAD_TYPES), POD], findAll });

      expect(await workloadsInNamespace(model, 'a')).toStrictEqual([pod]);
    });

    it('should drop a pod a workload owns', async() => {
      const pod = { metadata: { namespace: 'a' }, ownedByWorkload: true };
      const findAll = jest.fn(({ type }) => Promise.resolve(type === POD ? [pod] : []));
      const model = storeModel({ types: [...Object.values(WORKLOAD_TYPES), POD], findAll });

      expect(await workloadsInNamespace(model, 'a')).toStrictEqual([]);
    });

    it('should drop the workloads another workload owns', async() => {
      const deployment = { metadata: { namespace: 'a' } };
      const replicaSet = { metadata: { namespace: 'a' }, ownedByWorkload: true };
      const findAll = jest.fn(({ type }) => Promise.resolve({ [WORKLOAD_TYPES.DEPLOYMENT]: [deployment], [WORKLOAD_TYPES.REPLICA_SET]: [replicaSet] }[type as string] || []));
      const model = storeModel({ types: Object.values(WORKLOAD_TYPES), findAll });

      expect(await workloadsInNamespace(model, 'a')).toStrictEqual([deployment]);
    });

    it('should skip the workload types the user can not see', async() => {
      const model = storeModel({ types: [WORKLOAD_TYPES.DEPLOYMENT], findAll: jest.fn(() => Promise.resolve([])) });

      await workloadsInNamespace(model, 'a');

      expect(model.$dispatch.mock.calls.map(([, { type }]) => type)).toStrictEqual([WORKLOAD_TYPES.DEPLOYMENT]);
    });
  });

  describe('apiGroupOf', () => {
    it.each([
      ['apps/v1', 'apps'],
      ['networking.k8s.io/v1', 'networking.k8s.io'],
      ['v1', ''],
      ['', ''],
      [undefined, ''],
    ])('should read the group of %p as %p', (apiVersion, expected) => {
      expect(apiGroupOf(apiVersion)).toBe(expected);
    });
  });

  describe('capiBootstrapDataSecret', () => {
    it('should resolve to the Secret `bootstrap.dataSecretName` names, in the given namespace', async() => {
      const secret = { id: 'capi/bootstrap-data' };
      const model = storeModel({ types: [SECRET], cached: { [`${ SECRET }:capi/bootstrap-data`]: secret } });

      expect(await capiBootstrapDataSecret(model, { bootstrap: { dataSecretName: 'bootstrap-data' } }, 'capi')).toBe(secret);
    });

    it('should resolve to null, without a request, when the machine spec names a bootstrap config', async() => {
      const model = storeModel({ types: [SECRET] });
      const machineSpec = { bootstrap: { configRef: { kind: 'KubeadmConfigTemplate', name: 'workers' }, dataSecretName: 'bootstrap-data' } };

      expect(await capiBootstrapDataSecret(model, machineSpec, 'capi')).toBeNull();
      expect(model.$getters.byId).toHaveBeenCalledTimes(0);
    });

    it.each([
      ['no machine spec', undefined],
      ['no bootstrap', {}],
      ['no `dataSecretName`', { bootstrap: {} }],
    ])('should resolve to null for %s', async(_label, machineSpec) => {
      expect(await capiBootstrapDataSecret(storeModel({ types: [SECRET] }), machineSpec, 'capi')).toBeNull();
    });
  });

  describe('selectsLabels', () => {
    const labels = { app: 'web', tier: 'frontend' };

    it.each([
      ['matching `matchLabels`', { matchLabels: { app: 'web' } }, true],
      ['`matchLabels` with a different value', { matchLabels: { app: 'db' } }, false],
      ['`matchLabels` naming a label the resource does not have', { matchLabels: { team: 'a' } }, false],
      ['an `In` expression holding the value', {
        matchExpressions: [{
          key: 'tier', operator: 'In', values: ['frontend', 'edge']
        }]
      }, true],
      ['a `NotIn` expression holding the value', {
        matchExpressions: [{
          key: 'tier', operator: 'NotIn', values: ['frontend']
        }]
      }, false],
      ['an `Exists` expression', { matchExpressions: [{ key: 'app', operator: 'Exists' }] }, true],
      ['a `DoesNotExist` expression for a label it has', { matchExpressions: [{ key: 'app', operator: 'DoesNotExist' }] }, false],
      ['`matchLabels` and an expression that both match', { matchLabels: { app: 'web' }, matchExpressions: [{ key: 'tier', operator: 'Exists' }] }, true],
      ['`matchLabels` that match and an expression that does not', { matchLabels: { app: 'web' }, matchExpressions: [{ key: 'team', operator: 'Exists' }] }, false],
    ])('should apply a selector with %s', (_label, selector, expected) => {
      expect(selectsLabels(selector, labels)).toBe(expected);
    });

    it.each([
      ['an empty selector', {}],
      ['no selector', undefined],
    ])('should select nothing with %s', (_label, selector) => {
      expect(selectsLabels(selector, labels)).toBe(false);
    });

    it('should select nothing when the resource has no labels', () => {
      expect(selectsLabels({ matchLabels: { app: 'web' } })).toBe(false);
    });

    it('should not change the `matchExpressions` of the selector', () => {
      const matchExpressions = [{
        key: 'tier', operator: 'In', values: ['frontend']
      }];

      selectsLabels({ matchLabels: { app: 'web' }, matchExpressions }, labels);

      expect(matchExpressions).toStrictEqual([{
        key: 'tier', operator: 'In', values: ['frontend']
      }]);
    });
  });

  describe('podSpecReferences', () => {
    const namesOf = (podSpec: any) => Object.fromEntries(Object.entries(podSpecReferences(podSpec)).map(([type, set]) => [type, [...set]]));

    it('should find the ConfigMaps, Secrets and claims mounted as volumes', () => {
      const podSpec = {
        volumes: [
          { name: 'a', configMap: { name: 'config' } },
          { name: 'b', secret: { secretName: 'certs' } },
          { name: 'c', csi: { driver: 'd', nodePublishSecretRef: { name: 'csi-credentials' } } },
          { name: 'd', persistentVolumeClaim: { claimName: 'data' } },
          { name: 'e', projected: { sources: [{ configMap: { name: 'projected-config' } }, { secret: { name: 'projected-secret' } }] } },
        ]
      };

      expect(namesOf(podSpec)).toStrictEqual({
        [CONFIG_MAP]:      ['config', 'projected-config'],
        [SECRET]:          ['certs', 'csi-credentials', 'projected-secret'],
        [PVC]:             ['data'],
        [SERVICE_ACCOUNT]: [],
      });
    });

    it('should find the ConfigMaps and Secrets read into the environment of containers and init containers', () => {
      const podSpec = {
        initContainers: [{ name: 'init', envFrom: [{ configMapRef: { name: 'init-env' } }] }],
        containers:     [{
          name:    'app',
          env:     [{ name: 'A', valueFrom: { configMapKeyRef: { name: 'settings', key: 'a' } } }, { name: 'B', valueFrom: { secretKeyRef: { name: 'credentials', key: 'b' } } }],
          envFrom: [{ secretRef: { name: 'app-secrets' } }],
        }],
      };

      expect(namesOf(podSpec)).toStrictEqual({
        [CONFIG_MAP]:      ['init-env', 'settings'],
        [SECRET]:          ['credentials', 'app-secrets'],
        [PVC]:             [],
        [SERVICE_ACCOUNT]: [],
      });
    });

    it('should find `imagePullSecrets`', () => {
      expect(namesOf({ imagePullSecrets: [{ name: 'registry-pull' }] })[SECRET]).toStrictEqual(['registry-pull']);
    });

    it.each([
      ['`serviceAccountName`', { serviceAccountName: 'app' }, ['app']],
      ['the deprecated `serviceAccount`', { serviceAccount: 'legacy' }, ['legacy']],
      ['`serviceAccountName` over `serviceAccount`', { serviceAccountName: 'app', serviceAccount: 'legacy' }, ['app']],
      ['neither, leaving out the `default` ServiceAccount the pod runs as', {}, []],
    ])('should find the ServiceAccount from %s', (_label, podSpec, expected) => {
      expect(namesOf(podSpec)[SERVICE_ACCOUNT]).toStrictEqual(expected);
    });

    it('should list a name once however many times it is referred to', () => {
      const podSpec = {
        volumes:    [{ name: 'a', configMap: { name: 'config' } }],
        containers: [{ name: 'app', envFrom: [{ configMapRef: { name: 'config' } }] }],
      };

      expect(namesOf(podSpec)[CONFIG_MAP]).toStrictEqual(['config']);
    });

    it.each([
      ['no pod spec', undefined],
      ['an empty pod spec', {}],
    ])('should find nothing for %s', (_label, podSpec) => {
      expect(namesOf(podSpec)).toStrictEqual({
        [CONFIG_MAP]: [], [SECRET]: [], [PVC]: [], [SERVICE_ACCOUNT]: []
      });
    });
  });

  describe('isClaimFromTemplate', () => {
    it.each([
      ['data-db-0', 'data', 'db', true],
      ['data-db-12', 'data', 'db', true],
      ['data-db-', 'data', 'db', false],
      ['data-db-x', 'data', 'db', false],
      ['data-db-0-extra', 'data', 'db', false],
      ['logs-db-0', 'data', 'db', false],
      ['data-other-0', 'data', 'db', false],
    ])('should read %p, for template %p of StatefulSet %p, as %p', (claimName, templateName, setName, expected) => {
      expect(isClaimFromTemplate(claimName, templateName, setName)).toBe(expected);
    });

    it.each([
      ['claim', undefined, 'data', 'db'],
      ['template', 'data-db-0', undefined, 'db'],
      ['StatefulSet', 'data-db-0', 'data', undefined],
    ])('should be false with no %s name', (_label, claimName, templateName, setName) => {
      expect(isClaimFromTemplate(claimName, templateName, setName)).toBe(false);
    });
  });

  describe('ingressBackends', () => {
    it('should list the default backend, then the backend of each path of each rule', () => {
      const defaultBackend = { service: { name: 'default' } };
      const first = { service: { name: 'first' } };
      const second = { resource: { kind: 'StorageBucket', name: 'assets' } };
      const ingress = {
        spec: {
          defaultBackend,
          rules: [{ http: { paths: [{ backend: first }] } }, { http: { paths: [{ backend: second }] } }],
        }
      };

      expect(ingressBackends(ingress)).toStrictEqual([defaultBackend, first, second]);
    });

    it('should skip a rule with no `http`, and a path with no backend', () => {
      const backend = { service: { name: 'web' } };
      const ingress = { spec: { rules: [{ host: 'example.com' }, { http: { paths: [{ path: '/' }, { backend }] } }] } };

      expect(ingressBackends(ingress)).toStrictEqual([backend]);
    });

    it('should list nothing for an Ingress with no spec', () => {
      expect(ingressBackends({})).toStrictEqual([]);
    });
  });

  describe('ingressServiceNames', () => {
    it('should list the Service of each backend, skipping the resource backends', () => {
      const ingress = {
        spec: {
          defaultBackend: { service: { name: 'default' } },
          rules:          [{ http: { paths: [{ backend: { service: { name: 'web' } } }, { backend: { resource: { kind: 'StorageBucket', name: 'assets' } } }] } }],
        }
      };

      expect(ingressServiceNames(ingress)).toStrictEqual(['default', 'web']);
    });
  });
});
