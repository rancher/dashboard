import Steve from '@shell/plugins/steve/steve-class.js';
import { OpenApiV3, PATCH_CONTENT_TYPE } from '@shell/apis/resources/open-api-v3';

const CLUSTER_ID = 'c-m-abcde';
const OPEN_API_URL = `/k8s/clusters/${ CLUSTER_ID }/openapi/v3/api/v1`;
const CONFIG_MAP_PATH = '/api/v1/namespaces/{namespace}/configmaps/{name}';

/**
 * Build the OpenAPI v3 core group document, describing what a ConfigMap accepts for PATCH
 */
const openApiDoc = (patchContentTypes: string[]) => ({ paths: { [CONFIG_MAP_PATH]: { patch: { requestBody: { content: patchContentTypes.reduce((acc, type) => ({ ...acc, [type]: {} }), {}) } } } } });

describe('class: Steve — ResourceInstanceApi methods', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    OpenApiV3.clearCache();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  function createSteveModel(overrides: Record<string, any> = {}) {
    const dispatch = jest.fn();

    dispatch.mockResolvedValue(undefined);

    const model = new Steve({
      type:     'configmap',
      id:       'default/my-config',
      metadata: { name: 'my-config', namespace: 'default' },
      links:    { update: 'https://rancher/v1/configmaps/default/my-config', self: 'https://rancher/v1/configmaps/default/my-config' },
      ...overrides,
    }, {
      getters: {
        schemaFor: () => ({
          linkFor:    jest.fn(),
          attributes: {
            group: '', version: 'v1', resource: 'configmaps', namespaced: true
          }
        }),
        keyFieldForType: () => 'id',
        storeName:       'cluster',
      },
      dispatch,
      rootGetters: {
        clusterId:             CLUSTER_ID,
        'i18n/t':              jest.fn(),
        'type-map/optionsFor': () => ({
          isEditable: true, isRemovable: true, isCreatable: true
        }),
        'type-map/hasCustomEdit': () => true,
      },
    });

    return { model: model as any, dispatch };
  }

  /**
   * Answer the OpenAPI request `update` makes before it sends the patch, and the patch itself
   */
  function mockUpdateDispatch(dispatch: jest.Mock, patchContentTypes: string[], patchResponse: any) {
    dispatch.mockImplementation((action: string, payload: any) => {
      if (payload?.opt?.url === OPEN_API_URL) {
        return Promise.resolve(openApiDoc(patchContentTypes));
      }

      return Promise.resolve(action === 'request' ? patchResponse : undefined);
    });
  }

  describe('update', () => {
    it('should send a strategic-merge-patch request and load the response into the store', async() => {
      const patchResponse = {
        type: 'configmap', id: 'default/my-config', kind: 'ConfigMap', data: { key: 'patched' }
      };
      const { model, dispatch } = createSteveModel();

      mockUpdateDispatch(dispatch, [PATCH_CONTENT_TYPE.MERGE, PATCH_CONTENT_TYPE.STRATEGIC_MERGE], patchResponse);

      const result = await model.update({ data: { key: 'patched' } });

      expect(result).toStrictEqual(model);
      expect(dispatch).toHaveBeenCalledWith('request', {
        opt: expect.objectContaining({
          url:     'https://rancher/v1/configmaps/default/my-config',
          method:  'patch',
          headers: expect.objectContaining({ 'content-type': PATCH_CONTENT_TYPE.STRATEGIC_MERGE }),
          data:    { data: { key: 'patched' } },
        }),
        type: 'configmap'
      });
      expect(dispatch).toHaveBeenCalledWith('load', expect.objectContaining({
        data:                patchResponse,
        invalidatePageCache: false,
      }));
    });

    it('should send a merge-patch request when the resource is a CRD', async() => {
      const { model, dispatch } = createSteveModel();

      // CRDs don't advertise support for strategic merge patch
      mockUpdateDispatch(dispatch, [PATCH_CONTENT_TYPE.MERGE], { kind: 'Table', rows: [] });

      await model.update({ data: { key: 'patched' } });

      expect(dispatch).toHaveBeenCalledWith('request', {
        opt: expect.objectContaining({
          url:     'https://rancher/v1/configmaps/default/my-config',
          method:  'patch',
          headers: expect.objectContaining({ 'content-type': PATCH_CONTENT_TYPE.MERGE }),
          data:    { data: { key: 'patched' } },
        }),
        type: 'configmap'
      });
    });

    it('should send a merge-patch request when the OpenAPI spec cannot be read', async() => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { model, dispatch } = createSteveModel();

      dispatch.mockImplementation((_action: string, payload: any) => {
        return payload?.opt?.url === OPEN_API_URL ? Promise.reject(new Error('Forbidden')) : Promise.resolve({ kind: 'Table', rows: [] });
      });

      await model.update({ data: { key: 'patched' } });

      expect(dispatch).toHaveBeenCalledWith('request', {
        opt: expect.objectContaining({
          url:     'https://rancher/v1/configmaps/default/my-config',
          method:  'patch',
          headers: expect.objectContaining({ 'content-type': PATCH_CONTENT_TYPE.MERGE }),
          data:    { data: { key: 'patched' } },
        }),
        type: 'configmap'
      });

      consoleWarnSpy.mockRestore();
    });

    it('should not call load when response is a Table', async() => {
      const tableResponse = { kind: 'Table', rows: [] };
      const { model, dispatch } = createSteveModel();

      mockUpdateDispatch(dispatch, [PATCH_CONTENT_TYPE.STRATEGIC_MERGE], tableResponse);

      await model.update({ data: { key: 'value' } });

      // One request for the OpenAPI spec, one for the patch itself
      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).not.toHaveBeenCalledWith('load', expect.anything());
    });

    it('should throw when canEdit is false', async() => {
      const { model, dispatch } = createSteveModel({ links: {} });

      await expect(model.update({ data: {} })).rejects.toThrow(
        'ResourceInstance API error - configmap/default/my-config - Cannot patch: permission denied'
      );
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('replace', () => {
    it('should call save() and return the instance', async() => {
      const { model, dispatch } = createSteveModel();

      dispatch.mockResolvedValueOnce(undefined);

      const result = await model.replace();

      expect(result).toStrictEqual(model);
      expect(dispatch).toHaveBeenCalledWith('request', expect.objectContaining({ opt: expect.objectContaining({ method: 'put' }) }));
    });

    it('should throw when canEdit is false', async() => {
      const { model, dispatch } = createSteveModel({ links: {} });

      await expect(model.replace()).rejects.toThrow(
        'ResourceInstance API error - configmap/default/my-config - Cannot update: permission denied'
      );
      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should call remove()', async() => {
      const { model, dispatch } = createSteveModel({
        links: {
          update: 'https://rancher/v1/configmaps/default/my-config',
          self:   'https://rancher/v1/configmaps/default/my-config',
          remove: 'https://rancher/v1/configmaps/default/my-config',
        }
      });

      dispatch.mockResolvedValueOnce({ _status: 204 });
      dispatch.mockResolvedValueOnce(undefined);

      await model.delete();

      expect(dispatch).toHaveBeenCalledWith('request', expect.objectContaining({ opt: expect.objectContaining({ method: 'delete' }) }));
    });

    it('should throw when canDelete is false', async() => {
      const { model, dispatch } = createSteveModel({ links: {} });

      await expect(model.delete()).rejects.toThrow(
        'ResourceInstance API error - configmap/default/my-config - Cannot delete: permission denied'
      );
      expect(dispatch).not.toHaveBeenCalled();
    });
  });
});
