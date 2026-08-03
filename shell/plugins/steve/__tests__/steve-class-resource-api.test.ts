import {
  describe, it, expect, jest, beforeEach, afterEach
} from '@jest/globals';
import Steve from '@shell/plugins/steve/steve-class.js';

describe('class: Steve — ResourceInstanceApi methods', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  function createSteveModel(overrides: Record<string, any> = {}) {
    const dispatch = jest.fn<any, any[]>();

    dispatch.mockResolvedValue(undefined);

    // @ts-expect-error - JS class without TS declarations
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

  describe('update', () => {
    it('should send a merge-patch request and load the response into the store', async() => {
      const patchResponse = {
        type: 'configmap', id: 'default/my-config', kind: 'ConfigMap', data: { key: 'patched' }
      };
      const { model, dispatch } = createSteveModel();

      dispatch
        .mockResolvedValueOnce(patchResponse)
        .mockResolvedValueOnce(undefined);

      const result = await model.update({ data: { key: 'patched' } });

      expect(result).toStrictEqual(model);
      expect(dispatch).toHaveBeenCalledWith('request', {
        opt: expect.objectContaining({
          url:     'https://rancher/v1/configmaps/default/my-config',
          method:  'patch',
          headers: expect.objectContaining({ 'content-type': 'application/strategic-merge-patch+json' }),
          data:    { data: { key: 'patched' } },
        }),
        type: 'configmap'
      });
      expect(dispatch).toHaveBeenCalledWith('load', expect.objectContaining({
        data:                patchResponse,
        invalidatePageCache: false,
      }));
    });

    it('should not call load when response is a Table', async() => {
      const tableResponse = { kind: 'Table', rows: [] };
      const { model, dispatch } = createSteveModel();

      dispatch.mockResolvedValueOnce(tableResponse);

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
