import { controllerReferenceOf, findManager, findReferenced, managementOf } from '@shell/utils/related-resources/management';

const HELM_ANNOTATIONS = { 'meta.helm.sh/release-name': 'traefik', 'meta.helm.sh/release-namespace': 'kube-system' };

const replicaSetOwner = (controller?: boolean) => ({
  apiVersion: 'apps/v1', kind: 'ReplicaSet', name: 'web-1', ...(controller === undefined ? {} : { controller })
});

const SCHEMAS = [
  {
    id:         'apps.replicaset',
    attributes: {
      kind: 'ReplicaSet', group: 'apps', namespaced: true
    }
  },
  {
    id:         'namespace',
    attributes: {
      kind: 'Namespace', group: '', namespaced: false
    }
  },
  {
    id:         'catalog.cattle.io.app',
    attributes: {
      kind: 'App', group: 'catalog.cattle.io', namespaced: true
    }
  },
];

/**
 * A resource in a store with `SCHEMAS`, whose `find` action resolves `find`
 */
const storeResource = (fields: any = {}, find: jest.Mock = jest.fn((payload: any) => Promise.resolve({ id: payload.id }))) => ({
  type:     'pod',
  metadata: { name: 'web-1-abc', namespace: 'ns' },
  ...fields,
  $getters: {
    all:       jest.fn(() => SCHEMAS),
    schemaFor: jest.fn((type: string) => SCHEMAS.find((schema) => schema.id === type) || null),
    byId:      jest.fn(() => undefined),
  },
  $dispatch: jest.fn((_action: string, payload: any) => find(payload)),
});

describe('utils: related-resources/management', () => {
  describe('controllerReferenceOf', () => {
    it('should find the ownerReference with `controller: true`', () => {
      const resource = { metadata: { ownerReferences: [{ ...replicaSetOwner(false), name: 'other' }, replicaSetOwner(true)] } };

      expect(controllerReferenceOf(resource)).toStrictEqual(replicaSetOwner(true));
    });

    it.each([
      ['an ownerReference with `controller: false`', [replicaSetOwner(false)]],
      ['an ownerReference without `controller`', [replicaSetOwner()]],
      ['no ownerReferences', undefined],
    ])('should find nothing for %s', (_label, ownerReferences) => {
      expect(controllerReferenceOf({ metadata: { ownerReferences } })).toBeUndefined();
    });

    it('should find nothing for a resource without metadata', () => {
      expect(controllerReferenceOf({})).toBeUndefined();
    });
  });

  describe('managementOf', () => {
    // a controller copies its annotations to what it controls, e.g. a Deployment's helm annotations to its ReplicaSet
    it('should name the controller before any annotation', () => {
      const resource = { metadata: { ownerReferences: [replicaSetOwner(true)], annotations: { ...HELM_ANNOTATIONS, 'objectset.rio.cattle.io/owner-gvk': '/v1, Kind=Namespace' } } };

      expect(managementOf(resource)).toStrictEqual({ by: 'controller', owner: replicaSetOwner(true) });
    });

    it.each([
      ['core', '/v1, Kind=Namespace', '', {
        apiVersion: 'v1', kind: 'Namespace', name: 'fleet-local'
      }],
      ['named', 'fleet.cattle.io/v1alpha1, Kind=Bundle', 'fleet-local', {
        apiVersion: 'fleet.cattle.io/v1alpha1', kind: 'Bundle', name: 'fleet-local', namespace: 'fleet-local'
      }],
    ])('should name the owner of a rancher apply, from an owner-gvk in the %s group', (_label, gvk, namespace, owner) => {
      const resource = {
        metadata: {
          annotations: {
            'objectset.rio.cattle.io/id':              'fleet-manage-agent',
            'objectset.rio.cattle.io/owner-gvk':       gvk,
            'objectset.rio.cattle.io/owner-name':      'fleet-local',
            'objectset.rio.cattle.io/owner-namespace': namespace,
          }
        }
      };

      expect(managementOf(resource)).toStrictEqual({ by: 'rancher', owner });
    });

    // the ownerReference of a fleet Bundle to its namespace only has the Bundle deleted with it
    it('should name the owner of a rancher apply whose ownerReference is not a controller', () => {
      const resource = {
        metadata: {
          ownerReferences: [{
            apiVersion: 'v1', kind: 'Namespace', name: 'fleet-local', controller: false
          }],
          annotations: { 'objectset.rio.cattle.io/owner-gvk': '/v1, Kind=Namespace', 'objectset.rio.cattle.io/owner-name': 'fleet-local' }
        }
      };

      expect(managementOf(resource)?.by).toBe('rancher');
    });

    it('should name the release of a resource fleet deployed, from helm annotations and an objectset id', () => {
      const resource = { metadata: { annotations: { ...HELM_ANNOTATIONS, 'objectset.rio.cattle.io/id': 'default-autoscaler-fleet-default-nancy-dev' } } };

      expect(managementOf(resource)).toStrictEqual({ by: 'fleet', release: { name: 'traefik', namespace: 'kube-system' } });
    });

    it('should name the release of a resource helm installed, from helm annotations alone', () => {
      const resource = { metadata: { namespace: 'other', annotations: HELM_ANNOTATIONS } };

      expect(managementOf(resource)).toStrictEqual({ by: 'helm', release: { name: 'traefik', namespace: 'kube-system' } });
    });

    it('should take the namespace of a helm release from the resource when the annotation is missing', () => {
      const resource = { metadata: { namespace: 'kube-system', annotations: { 'meta.helm.sh/release-name': 'traefik' } } };

      expect(managementOf(resource)).toStrictEqual({ by: 'helm', release: { name: 'traefik', namespace: 'kube-system' } });
    });

    it('should name the release held by a helm release Secret', () => {
      const resource = {
        type:     'secret',
        metadata: {
          name: 'sh.helm.release.v1.rancher-backup.v1', namespace: 'cattle-resources-system', labels: { owner: 'helm', name: 'rancher-backup' }
        }
      };

      expect(managementOf(resource)).toStrictEqual({
        by: 'helm', release: { name: 'rancher-backup', namespace: 'cattle-resources-system' }, record: true
      });
    });

    it.each([
      // import yaml applies once, through steve's apply with a random id and no owner
      ['the objectset keys import yaml writes', { annotations: { 'objectset.rio.cattle.io/id': '5a03e9a7-fef5-4cb0-a6ae-8220191d4dc5' }, labels: { 'objectset.rio.cattle.io/hash': 'c3258db3' } }],
      // pods copy it from the template of their workload
      ['the helm label from a chart template alone', { labels: { 'app.kubernetes.io/managed-by': 'Helm' } }],
      ['a Secret named as a helm release without its labels', { name: 'sh.helm.release.v1.x.v1' }],
      ['nothing', {}],
    ])('should find nothing for %s', (_label, metadata) => {
      expect(managementOf({ type: 'secret', metadata })).toBeNull();
    });

    it('should find nothing for a resource other than a Secret named and labelled as a helm release', () => {
      const resource = { type: 'configmap', metadata: { name: 'sh.helm.release.v1.x.v1', labels: { owner: 'helm', name: 'x' } } };

      expect(managementOf(resource)).toBeNull();
    });

    it('should find nothing for a resource without metadata', () => {
      expect(managementOf({})).toBeNull();
    });
  });

  describe('findReferenced', () => {
    it('should fetch a namespaced resource in the namespace of the resource holding the reference', async() => {
      const find = jest.fn((payload: any) => Promise.resolve({ id: payload.id }));
      const resource = storeResource({}, find);

      expect(await findReferenced(resource, replicaSetOwner(true))).toStrictEqual({ id: 'ns/web-1' });
      expect(find).toHaveBeenCalledWith({
        type: 'apps.replicaset', id: 'ns/web-1', opt: { watch: false }
      });
    });

    it('should fetch a namespaced resource in the namespace the reference names', async() => {
      const find = jest.fn((payload: any) => Promise.resolve({ id: payload.id }));

      await findReferenced(storeResource({}, find), { ...replicaSetOwner(), namespace: 'other' });

      expect(find).toHaveBeenCalledWith({
        type: 'apps.replicaset', id: 'other/web-1', opt: { watch: false }
      });
    });

    it('should fetch a cluster-scoped resource by name', async() => {
      const find = jest.fn((payload: any) => Promise.resolve({ id: payload.id }));

      await findReferenced(storeResource({}, find), {
        apiVersion: 'v1', kind: 'Namespace', name: 'fleet-local'
      });

      expect(find).toHaveBeenCalledWith({
        type: 'namespace', id: 'fleet-local', opt: { watch: false }
      });
    });

    it.each([
      ['a kind with no schema', {
        apiVersion: 'v1', kind: 'Unknown', name: 'x'
      }, {}],
      ['no name', { ...replicaSetOwner(), name: '' }, {}],
      ['a namespaced kind, held by a resource with no namespace', replicaSetOwner(), { metadata: { name: 'x' } }],
    ])('should resolve to null without a request for %s', async(_label, reference, fields) => {
      const find = jest.fn();

      expect(await findReferenced(storeResource(fields, find), reference)).toBeNull();
      expect(find).toHaveBeenCalledTimes(0);
    });

    it('should resolve to null where the resource is not found', async() => {
      const find = jest.fn(() => Promise.reject({ _status: 404 })); // eslint-disable-line prefer-promise-reject-errors

      expect(await findReferenced(storeResource({}, find), replicaSetOwner(true))).toBeNull();
    });
  });

  describe('findManager', () => {
    it.each([
      ['the controller', { by: 'controller' as const, owner: replicaSetOwner(true) }, { type: 'apps.replicaset', id: 'ns/web-1' }],
      ['the owner of a rancher apply', {
        by:    'rancher' as const,
        owner: {
          apiVersion: 'v1', kind: 'Namespace', name: 'fleet-local'
        }
      }, { type: 'namespace', id: 'fleet-local' }],
      ['the rancher App of a helm release', { by: 'helm' as const, release: { name: 'traefik', namespace: 'kube-system' } }, { type: 'catalog.cattle.io.app', id: 'kube-system/traefik' }],
    ])('should fetch %s', async(_label, management, payload) => {
      const find = jest.fn((found: any) => Promise.resolve({ id: found.id }));

      expect(await findManager(storeResource({}, find), management)).toStrictEqual({ id: payload.id });
      expect(find).toHaveBeenCalledWith({ ...payload, opt: { watch: false } });
    });

    it('should resolve to null without a request for a release fleet deployed', async() => {
      const find = jest.fn();

      expect(await findManager(storeResource({}, find), { by: 'fleet', release: { name: 'traefik', namespace: 'kube-system' } })).toBeNull();
      expect(find).toHaveBeenCalledTimes(0);
    });
  });
});
