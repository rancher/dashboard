import jsyaml from 'js-yaml';
import Resource from '@shell/plugins/dashboard-store/resource-class.js';
import { resourceClassJunkObject } from '@shell/plugins/dashboard-store/__tests__/utils/store-mocks';
import { EVENT } from '@shell/config/types';

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

  describe('getter: resourceConditions', () => {
    it('should return empty array when status.conditions is undefined', () => {
      const resource = new Resource({ type: 'test' }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': jest.fn() },
      });

      expect(resource.resourceConditions).toStrictEqual([]);
    });

    it('should return empty array when status is undefined', () => {
      const resource = new Resource({ type: 'test', status: {} }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': jest.fn() },
      });

      expect(resource.resourceConditions).toStrictEqual([]);
    });

    it('should map conditions correctly', () => {
      const resource = new Resource({
        type:   'test',
        status: {
          conditions: [
            {
              type: 'Ready', status: 'True', message: 'Resource is ready', lastTransitionTime: '2024-01-01T00:00:00Z'
            },
          ]
        }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': jest.fn() },
      });

      const conditions = resource.resourceConditions;

      expect(conditions).toHaveLength(1);
      expect(conditions[0].condition).toBe('Ready');
      expect(conditions[0].status).toBe('True');
      expect(conditions[0].message).toBe('Resource is ready');
      expect(conditions[0].stateSimpleColor).toBe('disabled');
      expect(conditions[0].time).toBe('2024-01-01T00:00:00Z');
    });

    it('should set error color when condition has error', () => {
      const resource = new Resource({
        type:   'test',
        status: {
          conditions: [
            {
              type: 'Ready', status: 'False', error: true, message: 'Something failed'
            },
          ]
        }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': jest.fn() },
      });

      const conditions = resource.resourceConditions;

      expect(conditions[0].stateSimpleColor).toBe('error');
      expect(conditions[0].error).toBe(true);
    });

    it('should prepend reason to message when present', () => {
      const resource = new Resource({
        type:   'test',
        status: {
          conditions: [
            {
              type: 'Ready', status: 'False', reason: 'MinimumReplicasUnavailable', message: 'Deployment does not have minimum availability.'
            },
          ]
        }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': jest.fn() },
      });

      const conditions = resource.resourceConditions;

      expect(conditions[0].message).toBe('[MinimumReplicasUnavailable] Deployment does not have minimum availability.');
    });

    it('should use Unknown for missing type and status', () => {
      const resource = new Resource({
        type:   'test',
        status: {
          conditions: [
            { message: 'Some message' },
          ]
        }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': jest.fn() },
      });

      const conditions = resource.resourceConditions;

      expect(conditions[0].condition).toBe('Unknown');
      expect(conditions[0].status).toBe('Unknown');
    });

    it('should prioritize time fields correctly', () => {
      const resource = new Resource({
        type:   'test',
        status: {
          conditions: [
            {
              type: 'Test', lastProbeTime: 'probe-time', lastUpdateTime: 'update-time', lastTransitionTime: 'transition-time'
            },
          ]
        }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': jest.fn() },
      });

      const conditions = resource.resourceConditions;

      expect(conditions[0].time).toBe('probe-time');
    });
  });

  describe('getter: resourceEvents', () => {
    it('should return events from the store', () => {
      const mockEvents = [{ type: 'Normal', reason: 'Test' }];
      const resource = new Resource({ type: 'test' }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': jest.fn(), 'cluster/all': (type: string) => (type === EVENT ? mockEvents : []) },
      });

      expect(resource.resourceEvents).toStrictEqual(mockEvents);
    });
  });

  describe('getter: cards', () => {
    it('should return an array containing the insight card', () => {
      const resource = new Resource({ type: 'test' }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':      (key: string) => key,
          'cluster/all': () => []
        },
      });

      const cards = resource.cards;

      expect(cards).toHaveLength(0);
    });
  });

  describe('getter: insightCardProps', () => {
    it('should return props with title and rows', () => {
      const resource = new Resource({
        type:   'test',
        status: {
          conditions: [
            { type: 'Ready', status: 'True' }
          ]
        }
      }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: {
          'i18n/t':      (key: string) => key,
          'cluster/all': () => []
        },
      });

      const props = resource.insightCardProps;

      expect(props.title).toBe('component.resource.detail.card.insightsCard.title');
      expect(props.rows).toHaveLength(2);
      expect(props.rows[0].label).toBe('component.resource.detail.card.insightsCard.rows.conditions');
      expect(props.rows[1].label).toBe('component.resource.detail.card.insightsCard.rows.events');
    });
  });

  describe('getter: detailPageAdditionalActions', () => {
    it('should return undefined by default', () => {
      const resource = new Resource({ type: 'test-type' }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': jest.fn() },
      });

      expect(resource.detailPageAdditionalActions).toBeUndefined();
    });

    it('should allow subclasses to override and return button props array', () => {
      class CustomResource extends Resource {
        get detailPageAdditionalActions() {
          return [
            {
              label: 'Action 1', variant: 'secondary', onClick: () => {}
            },
            {
              label: 'Action 2', variant: 'primary', onClick: () => {}
            }
          ];
        }
      }

      const resource = new CustomResource({ type: 'test-type' }, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': jest.fn() },
      });

      const actions = resource.detailPageAdditionalActions;

      expect(Array.isArray(actions)).toBe(true);
      expect(actions).toHaveLength(2);
      expect(actions[0].label).toBe('Action 1');
      expect(actions[0].variant).toBe('secondary');
      expect(actions[1].label).toBe('Action 2');
      expect(actions[1].variant).toBe('primary');
    });
  });
});
