import Steve from '@shell/plugins/steve/steve-class.js';
import { PATCH_CONTENT_TYPE, clearPatchStrategyCache } from '@shell/apis/resources/patch-content-type';

/**
 * A Steve error - the response body, with the status attached by the store's `request` action
 */
const steveError = (status: number, message: string) => {
  const error: Record<string, any> = {
    type: 'error', status, message
  };

  Object.defineProperty(error, '_status', { value: status });

  return error;
};

/**
 * The error the Kubernetes API returns when a resource is sent a patch media type it doesn't
 * accept, which is what happens to a CRD sent a strategic merge patch
 */
const unsupportedMediaType = () => steveError(415, 'the body of the request was in an unknown format - accepted media types include: application/json-patch+json, application/merge-patch+json, application/apply-patch+yaml');

describe('class: Steve — ResourceInstanceApi methods', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    clearPatchStrategyCache();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    clearPatchStrategyCache();
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
        schemaFor:       () => ({ linkFor: jest.fn() }),
        keyFieldForType: () => 'id',
        storeName:       'cluster',
      },
      dispatch,
      rootGetters: {
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
   * The expected `request` payload for a patch sent with a given media type
   */
  const patchRequest = (contentType: string, data: Record<string, any>) => ['request', {
    opt: expect.objectContaining({
      url:     'https://rancher/v1/configmaps/default/my-config',
      method:  'patch',
      headers: expect.objectContaining({ 'content-type': contentType }),
      data,
    }),
    type: 'configmap'
  }];

  describe('update', () => {
    it('should send a strategic-merge-patch request and load the response into the store', async() => {
      const patchResponse = {
        type: 'configmap', id: 'default/my-config', kind: 'ConfigMap', data: { key: 'patched' }
      };
      const { model, dispatch } = createSteveModel();

      dispatch.mockImplementation((action: string) => Promise.resolve(action === 'request' ? patchResponse : undefined));

      const result = await model.update({ data: { key: 'patched' } });

      expect(result).toStrictEqual(model);
      expect(dispatch).toHaveBeenCalledWith(...patchRequest(PATCH_CONTENT_TYPE.STRATEGIC_MERGE, { data: { key: 'patched' } }));
      expect(dispatch).toHaveBeenCalledWith('load', expect.objectContaining({
        data:                patchResponse,
        invalidatePageCache: false,
      }));
    });

    it('should retry with a merge-patch request when the resource rejects strategic-merge-patch', async() => {
      // CRDs reject strategic merge patch outright
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { model, dispatch } = createSteveModel();

      dispatch
        .mockRejectedValueOnce(unsupportedMediaType())
        .mockResolvedValue({ kind: 'Table', rows: [] });

      await model.update({ data: { key: 'patched' } });

      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenNthCalledWith(1, ...patchRequest(PATCH_CONTENT_TYPE.STRATEGIC_MERGE, { data: { key: 'patched' } }));
      expect(dispatch).toHaveBeenNthCalledWith(2, ...patchRequest(PATCH_CONTENT_TYPE.MERGE, { data: { key: 'patched' } }));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('configmap'), expect.anything());

      consoleWarnSpy.mockRestore();
    });

    it('should go straight to a merge-patch request once the resource has rejected strategic-merge-patch', async() => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { model, dispatch } = createSteveModel();

      dispatch
        .mockRejectedValueOnce(unsupportedMediaType())
        .mockResolvedValue({ kind: 'Table', rows: [] });

      await model.update({ data: { key: 'patched' } });
      dispatch.mockClear();

      await model.update({ data: { key: 'patched-again' } });

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith(...patchRequest(PATCH_CONTENT_TYPE.MERGE, { data: { key: 'patched-again' } }));

      consoleWarnSpy.mockRestore();
    });

    it('should not retry when the PATCH fails for a reason other than the media type', async() => {
      const { model, dispatch } = createSteveModel();
      const error = steveError(403, 'forbidden');

      dispatch.mockRejectedValue(error);

      await expect(model.update({ data: { key: 'patched' } })).rejects.toBe(error);
      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith(...patchRequest(PATCH_CONTENT_TYPE.STRATEGIC_MERGE, { data: { key: 'patched' } }));
    });

    it('should not call load when response is a Table', async() => {
      const tableResponse = { kind: 'Table', rows: [] };
      const { model, dispatch } = createSteveModel();

      dispatch.mockResolvedValue(tableResponse);

      await model.update({ data: { key: 'value' } });

      expect(dispatch).toHaveBeenCalledTimes(1);
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
