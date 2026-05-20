import {
  describe, it, expect, jest, beforeEach, afterEach
} from '@jest/globals';
import { ResourceInstanceImpl } from '../resource-instance-class';

describe('resourceInstanceImpl', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  function createMockModel(overrides: Record<string, any> = {}) {
    return {
      type:      'configmap',
      id:        'default/my-config',
      metadata:  { name: 'my-config', namespace: 'default' },
      spec:      {},
      canEdit:   true,
      canDelete: true,
      linkFor:   jest.fn().mockImplementation((name: string) => `https://rancher/v1/configmaps/default/my-config`),
      $dispatch: jest.fn().mockResolvedValue(undefined),
      save:      jest.fn().mockResolvedValue(undefined),
      remove:    jest.fn().mockResolvedValue(undefined),
      toJSON:    jest.fn().mockReturnValue({ type: 'configmap', id: 'default/my-config' }),
      ...overrides,
    };
  }

  describe('constructor', () => {
    it('should proxy data properties from the model', () => {
      // Arrange
      const model = createMockModel({ metadata: { name: 'test', namespace: 'default' } });

      // Act
      const instance = new ResourceInstanceImpl(model);

      // Assert
      expect(instance.type).toStrictEqual('configmap');
      expect(instance.id).toStrictEqual('default/my-config');
      expect(instance.metadata).toStrictEqual({ name: 'test', namespace: 'default' });
    });

    it('should make _model non-enumerable', () => {
      // Arrange & Act
      const instance = new ResourceInstanceImpl(createMockModel());
      const descriptor = Object.getOwnPropertyDescriptor(instance, '_model');

      // Assert
      expect(descriptor).toBeDefined();
      expect(descriptor?.enumerable).toStrictEqual(false);
    });

    it('should not proxy keys starting with underscore', () => {
      // Arrange
      const model = createMockModel({ _internal: 'secret' });

      // Act
      const instance = new ResourceInstanceImpl(model);

      // Assert
      expect(Object.keys(instance)).not.toContain('_internal');
    });

    it('should not proxy function properties', () => {
      // Arrange & Act
      const instance = new ResourceInstanceImpl(createMockModel());

      // Assert
      expect(Object.keys(instance)).not.toContain('save');
      expect(Object.keys(instance)).not.toContain('remove');
      expect(Object.keys(instance)).not.toContain('linkFor');
    });

    it('should reflect model changes through proxied getters', () => {
      // Arrange
      const model = createMockModel();
      const instance = new ResourceInstanceImpl(model);

      // Act
      model.metadata = { name: 'updated', namespace: 'other' };

      // Assert
      expect(instance.metadata).toStrictEqual({ name: 'updated', namespace: 'other' });
    });

    it('should write through to the model via proxied setters', () => {
      // Arrange
      const model = createMockModel();
      const instance = new ResourceInstanceImpl(model) as any;

      // Act
      instance.metadata = { name: 'changed', namespace: 'new-ns' };

      // Assert
      expect(model.metadata).toStrictEqual({ name: 'changed', namespace: 'new-ns' });
    });
  });

  describe('patch', () => {
    it('should send a PATCH request and load the response into the store', async() => {
      // Arrange
      const patchResponse = {
        type: 'configmap', id: 'default/my-config', kind: 'ConfigMap', data: { key: 'patched' }
      };
      const model = createMockModel();

      model.$dispatch
        .mockResolvedValueOnce(patchResponse)
        .mockResolvedValueOnce(undefined);

      const instance = new ResourceInstanceImpl(model);

      // Act
      const result = await instance.patch({ data: { key: 'patched' } });

      // Assert
      expect(result).toStrictEqual(instance);
      expect(model.$dispatch).toHaveBeenCalledWith('request', {
        opt: {
          url:     'https://rancher/v1/configmaps/default/my-config',
          method:  'patch',
          headers: { 'content-type': 'application/merge-patch+json' },
          data:    { data: { key: 'patched' } },
        },
        type: 'configmap'
      });
      expect(model.$dispatch).toHaveBeenCalledWith('load', {
        data:                patchResponse,
        existing:            model,
        invalidatePageCache: false,
      });
    });

    it('should not call load when response is a Table', async() => {
      // Arrange
      const tableResponse = { kind: 'Table', rows: [] };
      const model = createMockModel();

      model.$dispatch.mockResolvedValueOnce(tableResponse);

      const instance = new ResourceInstanceImpl(model);

      // Act
      await instance.patch({ data: { key: 'value' } });

      // Assert
      expect(model.$dispatch).toHaveBeenCalledTimes(1);
      expect(model.$dispatch).not.toHaveBeenCalledWith('load', expect.anything());
    });

    it('should use update link first, then fall back to self link', async() => {
      // Arrange
      const model = createMockModel();

      model.linkFor.mockImplementation((name: string) => {
        if (name === 'update') {
          return null;
        }

        return 'https://rancher/v1/configmaps/default/my-config';
      });
      model.$dispatch.mockResolvedValueOnce(null);

      const instance = new ResourceInstanceImpl(model);

      // Act
      await instance.patch({ data: {} });

      // Assert
      expect(model.linkFor).toHaveBeenCalledWith('update');
      expect(model.linkFor).toHaveBeenCalledWith('self');
    });

    it('should throw when canEdit is false', async() => {
      // Arrange
      const model = createMockModel({ canEdit: false });
      const instance = new ResourceInstanceImpl(model);

      // Act & Assert
      await expect(instance.patch({ data: {} })).rejects.toThrow(
        'ResourceInstance API error - configmap/default/my-config - Cannot patch: permission denied'
      );
      expect(model.$dispatch).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should call model.save() and return the instance', async() => {
      // Arrange
      const model = createMockModel();
      const instance = new ResourceInstanceImpl(model);

      // Act
      const result = await instance.update();

      // Assert
      expect(result).toStrictEqual(instance);
      expect(model.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when canEdit is false', async() => {
      // Arrange
      const model = createMockModel({ canEdit: false });
      const instance = new ResourceInstanceImpl(model);

      // Act & Assert
      await expect(instance.update()).rejects.toThrow(
        'ResourceInstance API error - configmap/default/my-config - Cannot update: permission denied'
      );
      expect(model.save).not.toHaveBeenCalled();
    });

    it('should propagate errors from model.save()', async() => {
      // Arrange
      const model = createMockModel();

      model.save.mockRejectedValue(new Error('Conflict'));

      const instance = new ResourceInstanceImpl(model);

      // Act & Assert
      await expect(instance.update()).rejects.toThrow('Conflict');
    });
  });

  describe('delete', () => {
    it('should call model.remove()', async() => {
      // Arrange
      const model = createMockModel();
      const instance = new ResourceInstanceImpl(model);

      // Act
      await instance.delete();

      // Assert
      expect(model.remove).toHaveBeenCalledTimes(1);
    });

    it('should throw when canDelete is false', async() => {
      // Arrange
      const model = createMockModel({ canDelete: false });
      const instance = new ResourceInstanceImpl(model);

      // Act & Assert
      await expect(instance.delete()).rejects.toThrow(
        'ResourceInstance API error - configmap/default/my-config - Cannot delete: permission denied'
      );
      expect(model.remove).not.toHaveBeenCalled();
    });

    it('should propagate errors from model.remove()', async() => {
      // Arrange
      const model = createMockModel();

      model.remove.mockRejectedValue(new Error('Not Found'));

      const instance = new ResourceInstanceImpl(model);

      // Act & Assert
      await expect(instance.delete()).rejects.toThrow('Not Found');
    });
  });

  describe('toJSON', () => {
    it('should delegate to model.toJSON()', () => {
      // Arrange
      const jsonData = {
        type: 'configmap', id: 'default/my-config', metadata: { name: 'my-config' }
      };
      const model = createMockModel();

      model.toJSON.mockReturnValue(jsonData);

      const instance = new ResourceInstanceImpl(model);

      // Act
      const result = instance.toJSON();

      // Assert
      expect(result).toStrictEqual(jsonData);
      expect(model.toJSON).toHaveBeenCalledTimes(1);
    });
  });
});
