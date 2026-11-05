import Secret from '@shell/models/secret';
import { SECRET_TYPES as TYPES } from '@shell/config/secret';
import { VIRTUAL_TYPES, SERVICE_ACCOUNT } from '@shell/config/types';
import { UI_PROJECT_SECRET, UI_PROJECT_SECRET_CLUSTER, UI_PROJECT_SECRET_COPY } from '@shell/config/labels-annotations';
import { SECRET_SCOPE, SECRET_QUERY_PARAMS } from '@shell/config/query-params';
import { NAME as MANAGER } from '@shell/config/product/manager';

// Tests in this file exercise Secret's overrides of SteveModel/Resource behaviour
// (permissions, save/download cleanup, done routing) rather than Secret's own
// certificate/PSS/data-preview domain logic - see secret.test.ts for those.
describe('class Secret (SteveModel/Resource overrides)', () => {
  describe('detailLocation', () => {
    it('should return correct route for project scoped secret', () => {
      const secret = new Secret({
        metadata: {
          namespace: 'c-cluster-p-project',
          labels:    { [UI_PROJECT_SECRET]: 'p-project' }
        },
        id: 'c-cluster-p-project/my-secret'
      });

      // Mock $rootGetters
      Object.defineProperty(secret, '$rootGetters', {
        value: {
          productId: 'explorer',
          clusterId: 'c-cluster',
          isRancher: true
        }
      });

      const location = secret.detailLocation;

      expect(location.name).toBe(`c-cluster-product-${ VIRTUAL_TYPES.PROJECT_SECRETS }-namespace-id`);
      expect(location.params.resource).toBe(VIRTUAL_TYPES.PROJECT_SECRETS);
      expect(location.params.product).toBe('explorer');
      expect(location.params.cluster).toBe('c-cluster');
      expect(location.params.namespace).toBe('c-cluster-p-project');
      expect(location.params.id).toBe('my-secret');
    });

    it('should return default detailLocation for non-project scoped secret', () => {
      const secret = new Secret({
        metadata: { namespace: 'default' },
        id:       'default/my-secret'
      });

      // Mock $rootGetters
      Object.defineProperty(secret, '$rootGetters', {
        value: {
          productId: 'explorer',
          clusterId: 'c-cluster',
          isRancher: true
        }
      });

      const expectedLocation = { name: 'some-route' };

      // Mock _detailLocation (the parent class implementation or default behavior)
      Object.defineProperty(secret, '_detailLocation', { value: expectedLocation });

      expect(secret.detailLocation).toBe(expectedLocation);
    });
  });

  describe('listLocation', () => {
    const rootGetters = {
      productId: 'explorer',
      clusterId: 'c-cluster',
      isRancher: true
    };

    it('points at the project secrets list when the project-scoped query param is set', () => {
      const secret = new Secret({}, { rootGetters });

      jest.spyOn(secret, 'currentRoute').mockReturnValue({ query: { [SECRET_SCOPE]: SECRET_QUERY_PARAMS.PROJECT_SCOPED } } as any);

      const location = secret.listLocation;

      expect(location.name).toBe('c-cluster-product-resource');
      expect(location.params.resource).toBe(VIRTUAL_TYPES.PROJECT_SECRETS);
    });

    it('points at the project secrets list when the secret is project scoped', () => {
      const secret = new Secret({ metadata: { labels: { [UI_PROJECT_SECRET]: 'p-project', [UI_PROJECT_SECRET_CLUSTER]: 'c-cluster' } } }, { rootGetters });

      jest.spyOn(secret, 'currentRoute').mockReturnValue({ query: {} } as any);

      const location = secret.listLocation;

      expect(location.params.resource).toBe(VIRTUAL_TYPES.PROJECT_SECRETS);
    });

    it('falls back to the default secret list location otherwise', () => {
      const secret = new Secret({ type: SERVICE_ACCOUNT, metadata: {} }, {
        rootGetters,
        rootState: { $extension: { getPlugins: () => ({}) } }
      });

      jest.spyOn(secret, 'currentRoute').mockReturnValue({ query: {} } as any);

      const location = secret.listLocation;

      expect(location.params.resource).toBe(SERVICE_ACCOUNT);
    });
  });

  describe('parentNameOverride / parentLocationOverride', () => {
    it('override to the project secrets label/location when project scoped via query param', () => {
      const t = jest.fn().mockReturnValue('Project Secrets ');
      const secret = new Secret({}, {
        rootGetters: {
          productId: 'explorer', clusterId: 'c-cluster', isRancher: true, 'i18n/t': t
        }
      });

      jest.spyOn(secret, 'currentRoute').mockReturnValue({ query: { [SECRET_SCOPE]: SECRET_QUERY_PARAMS.PROJECT_SCOPED } } as any);

      expect(secret.parentNameOverride).toBe('Project Secrets');
      expect(secret.parentLocationOverride).toStrictEqual(secret.listLocation);
    });

    it('fall back to undefined (no base override) otherwise', () => {
      const secret = new Secret({ metadata: {} });

      jest.spyOn(secret, 'currentRoute').mockReturnValue({ query: {} } as any);

      expect(secret.parentNameOverride).toBeUndefined();
      expect(secret.parentLocationOverride).toBeUndefined();
    });
  });

  describe('cleanForDownload', () => {
    it('should contains the type attribute if cleanForDownload', async() => {
      const secret = new Secret({});
      const yaml = `apiVersion: v1
kind: Secret
metadata:
  name: my-secret
type: Opaque
`;
      const cleanYaml = await secret.cleanForDownload(yaml);

      expect(cleanYaml).toBe(yaml);
    });

    it('should remove id, links and actions keys if cleanForDownload', async() => {
      const secret = new Secret({});
      const expectedYamlStr = `apiVersion: v1
kind: Secret
metadata:
  name: my-secret
  namespace: default
type: Opaque
`;
      const part = `id: test_id
links:
  view: https://example.com
actions:
  remove: https://example.com`;
      const yaml = `${ expectedYamlStr }
${ part }`;
      const cleanYaml = await secret.cleanForDownload(yaml);

      expect(cleanYaml).toBe(expectedYamlStr);
    });
  });

  describe('cleanForSave', () => {
    it('removes _type when creating a new secret', () => {
      const secret = new Secret({ _type: TYPES.OPAQUE, metadata: { name: 'my-secret' } });

      const val = secret.cleanForSave({ _type: TYPES.OPAQUE, metadata: { name: 'my-secret' } }, true);

      expect(val._type).toBeUndefined();
    });

    it('keeps _type when updating an existing secret', () => {
      const secret = new Secret({ _type: TYPES.OPAQUE, metadata: { name: 'my-secret' } });

      const val = secret.cleanForSave({ _type: TYPES.OPAQUE, metadata: { name: 'my-secret' } }, false);

      expect(val._type).toBe(TYPES.OPAQUE);
    });
  });

  describe('isHelmRelease', () => {
    it.each([
      [true, 'the helm release type', { _type: TYPES.HELM_RELEASE }],
      [true, 'an opaque secret with the helm owner label', { _type: TYPES.OPAQUE, metadata: { labels: { owner: 'helm' } } }],
      [false, 'an opaque secret without labels', { _type: TYPES.OPAQUE, metadata: {} }],
      [false, 'an opaque secret without an owner label', { _type: TYPES.OPAQUE, metadata: { labels: { app: 'helm' } } }],
      [false, 'an opaque secret with another owner', { _type: TYPES.OPAQUE, metadata: { labels: { owner: 'flux' } } }],
      [false, 'an opaque secret with a helm owner in another case', { _type: TYPES.OPAQUE, metadata: { labels: { owner: 'Helm' } } }],
      [false, 'a tls secret with another owner', { _type: TYPES.TLS, metadata: { labels: { owner: 'cert-manager' } } }],
    ])('is %p for %s', (expected, _, data) => {
      const secret = new Secret(data, { getters: { schemaFor: () => undefined } });

      expect(secret.isHelmRelease).toBe(expected);
    });
  });

  describe('save', () => {
    const makeSecret = (data: any) => {
      const dispatch = jest.fn().mockResolvedValue(undefined);
      const secret = new Secret(data, {
        dispatch,
        getters: { schemaFor: () => undefined },
      });

      return { secret, dispatch };
    };

    it('patches only the labels and annotations of an existing helm release secret', async() => {
      const { secret, dispatch } = makeSecret({
        id:       'default/sh.helm.release.v1.app.v1',
        _type:    TYPES.HELM_RELEASE,
        links:    { update: 'update-url' },
        metadata: { labels: { owner: 'helm' }, annotations: { a: 'b' } },
        data:     {},
      });

      await secret.save();

      expect(dispatch).toHaveBeenCalledWith('request', {
        opt: {
          url:     'update-url',
          method:  'patch',
          headers: { 'content-type': 'application/json-patch+json', accept: 'application/json' },
          data:    [
            {
              op: 'add', path: '/metadata/labels', value: { owner: 'helm' }
            },
            {
              op: 'add', path: '/metadata/annotations', value: { a: 'b' }
            },
          ]
        },
        type: undefined
      });
    });

    it('patches empty labels and annotations when the helm release secret has none', async() => {
      const { secret, dispatch } = makeSecret({
        id: 'default/sh.helm.release.v1.app.v1', _type: TYPES.HELM_RELEASE, links: { update: 'update-url' }, metadata: {}
      });

      await secret.save();

      expect(dispatch.mock.calls[0][1].opt.data).toStrictEqual([
        {
          op: 'add', path: '/metadata/labels', value: {}
        },
        {
          op: 'add', path: '/metadata/annotations', value: {}
        },
      ]);
    });

    it.each([
      ['a new helm release secret', { _type: TYPES.HELM_RELEASE }, 'post'],
      ['an existing secret of another type', { id: 'default/my-secret', _type: TYPES.OPAQUE }, 'put'],
    ])('sends the whole secret for %s', async(_, data, method) => {
      const { secret, dispatch } = makeSecret({
        ...data, links: { update: 'update-url' }, metadata: { name: 'my-secret' }, data: { foo: 'YmFy' }
      });

      await secret.save({ url: 'save-url' });

      const { opt } = dispatch.mock.calls[0][1];

      expect(opt.method).toBe(method);
      expect(opt.data.data).toStrictEqual({ foo: 'YmFy' });
    });

    it('keeps an explicitly requested method for helm release secrets', async() => {
      const { secret, dispatch } = makeSecret({
        id: 'default/sh.helm.release.v1.app.v1', _type: TYPES.HELM_RELEASE, links: { update: 'update-url' }, metadata: {}
      });
      const data = { metadata: { labels: { foo: 'bar' } } };

      await secret.save({
        data, method: 'patch', headers: { 'content-type': 'application/merge-patch+json' }
      });

      expect(dispatch.mock.calls[0][1].opt.data).toStrictEqual(data);
      expect(dispatch.mock.calls[0][1].opt.headers['content-type']).toBe('application/merge-patch+json');
    });
  });

  describe('doneRoute', () => {
    it('returns the manager route when the current product is the manager', () => {
      const secret = new Secret({}, { rootGetters: { currentProduct: { name: MANAGER } } });

      expect(secret.doneRoute).toBe('c-cluster-manager-secret');
    });

    it('returns the generic resource route otherwise', () => {
      const secret = new Secret({}, { rootGetters: { currentProduct: { name: 'explorer' } } });

      expect(secret.doneRoute).toBe('c-cluster-product-resource');
    });
  });

  describe('permissions (canUpdate, canDelete, canCreate, canEditYaml)', () => {
    const makeSecret = (data: any, { isEditable = true, isRemovable = true, isCreatable = true } = {}) => {
      return new Secret(data, {
        getters:     { schemaFor: () => undefined },
        rootGetters: {
          'type-map/optionsFor': () => ({
            isEditable, isRemovable, isCreatable
          })
        }
      });
    };

    it('are all false when the secret is a project scoped secret copy', () => {
      const secret = makeSecret({
        links:    { update: 'u', remove: 'r' },
        metadata: { annotations: { [UI_PROJECT_SECRET_COPY]: 'true' } }
      });

      expect(secret.canUpdate).toBe(false);
      expect(secret.canDelete).toBe(false);
      expect(secret.canCreate).toBe(false);
      expect(secret.canEditYaml).toBe(false);
    });

    it('canUpdate is false without an update link', () => {
      const secret = makeSecret({ links: {} });

      expect(secret.canUpdate).toBe(false);
    });

    it('canUpdate is false for service account secrets even with an update link and edit permission', () => {
      const secret = makeSecret({ links: { update: 'u' }, _type: TYPES.SERVICE_ACCT });

      expect(secret.canUpdate).toBe(false);
    });

    it.each([
      ['the helm release type', { _type: TYPES.HELM_RELEASE }],
      ['the helm owner label', { _type: TYPES.OPAQUE, metadata: { labels: { owner: 'helm' } } }],
    ])('canUpdate is true but canEditYaml is false for helm release secrets identified by %s', (_, data) => {
      const secret = makeSecret({ links: { update: 'u' }, ...data });

      expect(secret.canUpdate).toBe(true);
      expect(secret.canEditYaml).toBe(false);
    });

    it('canUpdate delegates to the update link and edit permission for other types', () => {
      const secret = makeSecret({ links: { update: 'u' }, _type: TYPES.OPAQUE });

      expect(secret.canUpdate).toBe(true);
    });

    it('canDelete delegates to the remove link and remove permission', () => {
      const canDeleteSecret = makeSecret({ links: { remove: 'r' } });
      const cannotDeleteSecret = makeSecret({ links: {} });

      expect(canDeleteSecret.canDelete).toBe(true);
      expect(cannotDeleteSecret.canDelete).toBe(false);
    });

    it('canCreate delegates to the create permission', () => {
      const canCreateSecret = makeSecret({ links: {} }, { isCreatable: true });
      const cannotCreateSecret = makeSecret({ links: {} }, { isCreatable: false });

      expect(canCreateSecret.canCreate).toBe(true);
      expect(cannotCreateSecret.canCreate).toBe(false);
    });

    it('canEditYaml mirrors canUpdate', () => {
      const secret = makeSecret({ links: { update: 'u' }, _type: TYPES.OPAQUE });

      expect(secret.canEditYaml).toBe(secret.canUpdate);
      expect(secret.canEditYaml).toBe(true);
    });
  });
});
