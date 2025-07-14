import jsyaml from 'js-yaml';
import Resource from '@shell/plugins/dashboard-store/resource-class.js';
import { resourceClassJunkObject } from '@shell/plugins/dashboard-store/__tests__/utils/store-mocks';

describe('class: Resource', () => {
  describe('given custom resource keys', () => {
    const customResource = resourceClassJunkObject;

    it('should keep internal keys', () => {
      const resource = new Resource(customResource, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': jest.fn() },
      });

      expect({ ...resource }).toStrictEqual(customResource);
    });

    describe('method: save', () => {
      it('should remove all the internal keys', async() => {
        const dispatch = jest.fn();
        const resource = new Resource(customResource, {
          getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
          dispatch,
          rootGetters: { 'i18n/t': jest.fn() },
        });

        const expectation = { type: customResource.type };

        await resource.save();

        const opt = {
          data:    expectation,
          headers: {
            accept:         'application/json',
            'content-type': 'application/json',
          },
          method: 'post',
          url:    undefined,
        };

        // Data sent should have been cleaned
        expect(dispatch).toHaveBeenCalledWith('request', { opt, type: customResource.type });

        // Original workload model should remain unchanged
        expect({ ...resource }).toStrictEqual(customResource);
      });
    });
  });

  describe('method: _saveYaml', () => {
    let mockStore: any;
    let resourceInstance: any;

    beforeEach(() => {
      mockStore = {
        dispatch: jest.fn((action, payload) => {
          if (action.endsWith('/cleanForDiff')) {
            return Promise.resolve(payload);
          }

          return Promise.resolve();
        }),
        rootGetters: {
          currentStore:     jest.fn(() => 'testStore'),
          'testStore/byId': jest.fn((type, id) => {
            if (type === 'testType' && id === 'test-id-conflict-unresolved') {
              return {
                id:       'test-id-conflict-unresolved',
                type:     'testType',
                metadata: {
                  namespace: 'aaa', resourceVersion: 2, name: 'test-id-conflict-unresolved'
                },
                spec: { replicas: 5 },
              };
            }
            if (type === 'testType' && id === 'test-id-auto-resolve') {
              return {
                id:       'test-id-auto-resolve',
                type:     'testType',
                metadata: {
                  namespace: 'aaa', resourceVersion: 2, name: 'test-id-auto-resolve', owner: 'admin'
                },
                spec: { replicas: 3, labels: { env: 'dev' } },
              };
            }
            if (id) {
              return {
                id,
                type,
                metadata: {
                  namespace: 'aaa', resourceVersion: '5', name: id
                },
              };
            }

            return null;
          }),
        },
        getters: {
          'i18n/t':         jest.fn((key, params) => ` ${ key } - ${ JSON.stringify(params) }`),
          currentStore:     jest.fn(() => 'testStore'),
          'testStore/byId': jest.fn((type, id) => {
            if (id) {
              return {
                id,
                type,
              };
            }

            return null;
          }),
          schemaFor: jest.fn((type) => {
            if (type === 'testType' || type === 'namespaced-type') {
              return { attributes: { namespaced: true } };
            }

            return null;
          }),
        },
      };

      resourceInstance = new Resource({
        id:   'default-id',
        type: 'default-type',
      }, mockStore);

      jest.spyOn(resourceInstance, 'followLink').mockImplementation();
    });

    it('should successfully perform a PUT operation and dispatch load', async() => {
      const initialYaml = jsyaml.dump({
        metadata: {
          namespace: 'aaa', name: 'my-resource', resourceVersion: 1
        },
        spec: { replicas: 3 }
      });
      const updatedYaml = jsyaml.dump({
        metadata: {
          namespace: 'aaa', name: 'my-resource', resourceVersion: 1
        },
      });
      const expectedResponseData = {
        id:       'test-id',
        type:     'testType',
        metadata: {
          namespace: 'aaa', name: 'my-resource', resourceVersion: 3
        },
      };

      resourceInstance.followLink.mockResolvedValueOnce(expectedResponseData);

      await resourceInstance._saveYaml(updatedYaml, initialYaml);

      expect(resourceInstance.followLink).toHaveBeenCalledTimes(1);
      expect(resourceInstance.followLink).toHaveBeenCalledWith('update', {
        method:  'PUT',
        headers: {
          'content-type': 'application/yaml',
          accept:         'application/json',
        },
        data: updatedYaml
      });

      expect(mockStore.dispatch).toHaveBeenCalledWith('load', {
        data:     expectedResponseData,
        existing: undefined
      });
    });

    it('should resolve 409 conflict automatically and re-save if no actual conflicts', async() => {
      resourceInstance.id = 'test-id-auto-resolve';
      resourceInstance.type = 'testType';

      const initialYamlAutoResolve = jsyaml.dump({ metadata: { name: 'test-id-auto-resolve', resourceVersion: 1 } });
      const userYamlAutoResolve = jsyaml.dump({
        metadata: {
          namespace: 'aaa', name: 'test-id-auto-resolve', resourceVersion: 1
        },
      });

      resourceInstance.followLink.mockRejectedValueOnce({
        status:   409,
        response: { text: () => Promise.resolve('Conflict: Resource changed in background') }
      });

      const finalExpectedResponseAutoResolve = {
        id:       'test-id-auto-resolve',
        type:     'testType',
        metadata: {
          namespace: 'aaa', name: 'test-id-auto-resolve', resourceVersion: 'final-v3', owner: 'admin'
        },
      };

      resourceInstance.followLink.mockResolvedValueOnce(finalExpectedResponseAutoResolve);

      await resourceInstance._saveYaml(userYamlAutoResolve, initialYamlAutoResolve);

      expect(resourceInstance.followLink).toHaveBeenCalledTimes(2);

      expect(resourceInstance.followLink).toHaveBeenCalledWith('update', {
        method:  'PUT',
        headers: expect.any(Object),
        data:    userYamlAutoResolve
      });

      expect(mockStore.dispatch).toHaveBeenCalledWith('load', {
        data:     finalExpectedResponseAutoResolve,
        existing: undefined
      });
    });

    it('should throw error on 409 conflict if handleConflict returns errors', async() => {
      resourceInstance.id = 'test-id-conflict-unresolved';
      resourceInstance.type = 'testType';

      const initialYaml = jsyaml.dump({
        metadata: {
          namespace: 'aaa', name: 'test-id-conflict-unresolved', resourceVersion: 1
        },
      });
      const userYaml = jsyaml.dump({
        metadata: {
          namespace: 'aaa', name: 'test-id-conflict-unresolved', resourceVersion: 1
        },
        spec: { replicas: 4 }
      });

      resourceInstance.followLink.mockRejectedValueOnce({
        _status:  409,
        response: { text: () => Promise.resolve('Conflict: Replicas changed') }
      });

      await expect(resourceInstance._saveYaml(userYaml, initialYaml)).rejects.toBeDefined();

      expect(resourceInstance.followLink).toHaveBeenCalledTimes(1);
      expect(mockStore.dispatch).not.toHaveBeenCalledWith('load', expect.any(Object));
    });
  });
});
