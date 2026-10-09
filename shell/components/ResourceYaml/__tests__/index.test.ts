import { flushPromises, shallowMount } from '@vue/test-utils';
import ResourceYaml from '@shell/components/ResourceYaml/index.vue';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';
import { RelatedResource } from '@shell/core/types';
import { keyForResource } from '@shell/utils/resource-key';

jest.mock('@shell/core/plugin-helpers', () => ({ getApplicableExtensionEnhancements: jest.fn(() => []) }));

const mockedEnhancements = getApplicableExtensionEnhancements as jest.Mock;

/**
 * The entry as it appears once flattened at the top of the tree, gathered for the primary resource
 *
 * `nodeId` defaults to the resource's key, pass it for a resource that has no id
 */
const atTop = (entry: any, nodeId: string = keyForResource(entry.resource)) => ({
  ...entry, depth: 1, nodeId
});

/** The entry as it appears once flattened below the entry with `parentId` */
const below = (entry: any, parentId: string, depth: number, nodeId: string = keyForResource(entry.resource)) => ({
  ...entry, depth, parentId, nodeId
});

describe('component: ResourceYaml', () => {
  const mountComponent = (value: any, { withExtensionSupport = true, route = { query: {} } as any, mode = _EDIT } = {}) => shallowMount(ResourceYaml, {
    props: {
      mode,
      yaml: 'YAML',
      value
    },
    global: {
      mocks: {
        $router:     { applyQuery: jest.fn(), replace: jest.fn() },
        $route:      route,
        $fetchState: { pending: false },
        $store:      {
          getters:    { currentStore: () => 'cluster', 'cluster/schemaFor': () => ({}) },
          $extension: withExtensionSupport ? { getUIConfig: jest.fn(() => []) } : undefined
        }
      },
      stubs: { YamlEditor: true }
    }
  });

  beforeEach(() => {
    mockedEnhancements.mockReset();
    mockedEnhancements.mockReturnValue([]);
  });

  describe('relatedResources', () => {
    it('should be empty when the model provides no related resources', async() => {
      const wrapper = mountComponent({ type: 'pod' });

      await wrapper.vm.loadRelatedResources();

      expect(wrapper.vm.relatedResources).toStrictEqual([]);
      expect(wrapper.vm.needsMultiEdit).toBe(false);
    });

    it('should resolve the async list from the model', async() => {
      const related = { resource: { type: 'service' } };
      const wrapper = mountComponent({
        type:                  'pod',
        fetchRelatedResources: () => Promise.resolve([related])
      });

      await wrapper.vm.loadRelatedResources();

      expect(wrapper.vm.relatedResources).toStrictEqual([atTop(related, 'related-0')]);
      expect(wrapper.vm.needsMultiEdit).toBe(true);
    });

    it('should keep the configuration supplied with each related resource', async() => {
      const beforeSaveHook = jest.fn();
      const afterSaveHook = jest.fn();
      const save = jest.fn();
      const entry: RelatedResource = {
        resource: { type: 'service' }, beforeSaveHook, afterSaveHook, save
      };

      const wrapper = mountComponent({
        type:                  'pod',
        fetchRelatedResources: () => Promise.resolve([entry])
      });

      await wrapper.vm.loadRelatedResources();

      const [resolved] = wrapper.vm.relatedResources;

      expect(resolved.beforeSaveHook).toBe(beforeSaveHook);
      expect(resolved.afterSaveHook).toBe(afterSaveHook);
      expect(resolved.save).toBe(save);
    });

    it('should allow extensions to resolve their additions asynchronously', async() => {
      const fromModel = { resource: { type: 'service' } };
      const fromExtension = { resource: { type: 'secret' } };

      mockedEnhancements.mockReturnValue([{ fetchExtensionRelatedResources: (_resource: any, res: RelatedResource[]) => Promise.resolve([...res, fromExtension]) }]);

      const wrapper = mountComponent({
        type:                  'pod',
        fetchRelatedResources: () => Promise.resolve([fromModel])
      });

      await wrapper.vm.loadRelatedResources();

      expect(wrapper.vm.relatedResources).toStrictEqual([atTop(fromModel, 'related-0'), atTop(fromExtension, 'related-1')]);
    });

    it('should apply extensions in order, each seeing the previous result', async() => {
      const a = { resource: { type: 'a' } };
      const b = { resource: { type: 'b' } };

      mockedEnhancements.mockReturnValue([
        { fetchExtensionRelatedResources: (_resource: any, res: RelatedResource[]) => [...res, a] },
        { fetchExtensionRelatedResources: async(_resource: any, res: RelatedResource[]) => [...res, b] },
      ]);

      const wrapper = mountComponent({ type: 'pod' });

      await wrapper.vm.loadRelatedResources();

      expect(wrapper.vm.relatedResources).toStrictEqual([atTop(a, 'related-0'), atTop(b, 'related-1')]);
    });

    it.each([
      ['a non-function', { fetchExtensionRelatedResources: 'nope' }],
      ['a non-array result', { fetchExtensionRelatedResources: () => 'nope' }],
      ['an async non-array result', { fetchExtensionRelatedResources: () => Promise.resolve(undefined) }],
    ])('should ignore an extension providing %s', async(_label, extension) => {
      const fromModel = { resource: { type: 'service' } };

      mockedEnhancements.mockReturnValue([extension]);

      const wrapper = mountComponent({
        type:                  'pod',
        fetchRelatedResources: () => Promise.resolve([fromModel])
      });

      await wrapper.vm.loadRelatedResources();

      expect(wrapper.vm.relatedResources).toStrictEqual([atTop(fromModel, 'related-0')]);
    });

    it.each([
      ['no resource', { beforeSaveHook: () => {} }],
      ['a falsy resource', { resource: null }],
      ['a bare resource', { type: 'service' }],
      ['a non-function beforeSaveHook', { resource: { type: 'service' }, beforeSaveHook: 'nope' }],
      ['a non-function afterSaveHook', { resource: { type: 'service' }, afterSaveHook: 'nope' }],
      ['a non-function save', { resource: { type: 'service' }, save: 'nope' }],
      ['a non-function banner', { resource: { type: 'service' }, banner: 'nope' }],
    ])('should drop an entry with %s', async(_label, entry) => {
      const valid = { resource: { type: 'secret' } };

      jest.spyOn(console, 'warn').mockImplementation(() => {});

      const wrapper = mountComponent({
        type:                  'pod',
        fetchRelatedResources: () => Promise.resolve([entry, valid])
      });

      await wrapper.vm.loadRelatedResources();

      expect(wrapper.vm.relatedResources).toStrictEqual([atTop(valid, 'related-1')]);
    });

    describe('tree expansion', () => {
      it('should fetch and append the related resources of each related resource', async() => {
        const grandchild = { resource: { id: 'ns/grandchild', type: 'secret' } };
        const child: RelatedResource = {
          resource: {
            id:                    'ns/child',
            type:                  'service',
            fetchRelatedResources: () => Promise.resolve([grandchild]),
          }
        };

        const wrapper = mountComponent({
          type:                  'pod',
          fetchRelatedResources: () => Promise.resolve([child])
        });

        await wrapper.vm.loadRelatedResources();

        expect(wrapper.vm.relatedResources).toStrictEqual([atTop(child), below(grandchild, 'service:ns/child', 2)]);
      });

      it('should not add the same resource (by id) more than once', async() => {
        const shared: RelatedResource = { resource: { id: 'ns/shared', type: 'service' } };
        const childA: RelatedResource = {
          resource: {
            id:                    'ns/a',
            type:                  'pod',
            fetchRelatedResources: () => Promise.resolve([shared]),
          }
        };
        const childB: RelatedResource = {
          resource: {
            id:                    'ns/b',
            type:                  'pod',
            fetchRelatedResources: () => Promise.resolve([shared]),
          }
        };

        const wrapper = mountComponent({
          type:                  'pod',
          fetchRelatedResources: () => Promise.resolve([childA, childB])
        });

        await wrapper.vm.loadRelatedResources();

        // `shared` is reached from both children, and is kept under the first one to reach it
        expect(wrapper.vm.relatedResources).toStrictEqual([atTop(childA), atTop(childB), below(shared, 'pod:ns/a', 2)]);
      });

      it('should not loop on a circular reference', async() => {
        const resourceB: any = { id: 'ns/b', type: 'service' };
        const entryB: RelatedResource = { resource: resourceB };
        const resourceA: any = {
          id:                    'ns/a',
          type:                  'pod',
          fetchRelatedResources: () => Promise.resolve([entryB]),
        };

        // B → A creates the cycle
        resourceB.fetchRelatedResources = () => Promise.resolve([{ resource: resourceA }]);

        const wrapper = mountComponent({
          type:                  'pod',
          fetchRelatedResources: () => Promise.resolve([{ resource: resourceA }])
        });

        await wrapper.vm.loadRelatedResources();

        // A and B, but not a third entry from the cycle
        expect(wrapper.vm.relatedResources).toHaveLength(2);
      });

      it('should preserve the groupKey from transitively fetched entries', async() => {
        const grandchild: RelatedResource = {
          resource: { id: 'ns/gc', type: 'secret' },
          groupKey: 'some.group.key',
        };
        const child: RelatedResource = {
          resource: {
            id:                    'ns/child',
            type:                  'service',
            fetchRelatedResources: () => Promise.resolve([grandchild]),
          }
        };

        const wrapper = mountComponent({
          type:                  'pod',
          fetchRelatedResources: () => Promise.resolve([child])
        });

        await wrapper.vm.loadRelatedResources();

        expect(wrapper.vm.relatedResources[1].groupKey).toBe('some.group.key');
      });

      it('should record the depth and parent of each resource in the tree', async() => {
        const greatGrandchild: RelatedResource = { resource: { id: 'ns/ggc', type: 'configmap' } };
        const grandchild: RelatedResource = {
          resource: {
            id:                    'ns/gc',
            type:                  'secret',
            fetchRelatedResources: () => Promise.resolve([greatGrandchild]),
          }
        };
        const child: RelatedResource = {
          resource: {
            id:                    'ns/child',
            type:                  'service',
            fetchRelatedResources: () => Promise.resolve([grandchild]),
          }
        };

        const wrapper = mountComponent({
          id:                    'ns/primary',
          type:                  'pod',
          fetchRelatedResources: () => Promise.resolve([child])
        });

        await wrapper.vm.loadRelatedResources();

        expect(wrapper.vm.relatedResources.map(({ resource, depth, parentId }: any) => ({
          id: resource.id, depth, parentId
        }))).toStrictEqual([
          {
            id: 'ns/child', depth: 1, parentId: undefined
          },
          {
            id: 'ns/gc', depth: 2, parentId: 'service:ns/child'
          },
          {
            id: 'ns/ggc', depth: 3, parentId: 'secret:ns/gc'
          },
        ]);
      });

      it('should not set a parentId on the resources gathered for the primary resource', async() => {
        const child: RelatedResource = { resource: { id: 'ns/child', type: 'service' } };

        const wrapper = mountComponent({
          id:                    'ns/primary',
          type:                  'pod',
          fetchRelatedResources: () => Promise.resolve([child])
        });

        await wrapper.vm.loadRelatedResources();

        expect(wrapper.vm.relatedResources[0]).not.toHaveProperty('parentId');
      });

      it('should still point a resource at its parent when that parent has no id of its own', async() => {
        const grandchild: RelatedResource = { resource: { id: 'ns/gc', type: 'secret' } };
        const child: RelatedResource = {
          // No id, so the parent is identified by the nodeId generated for it
          resource: {
            type:                  'service',
            fetchRelatedResources: () => Promise.resolve([grandchild]),
          }
        };

        const wrapper = mountComponent({
          type:                  'pod',
          fetchRelatedResources: () => Promise.resolve([child])
        });

        await wrapper.vm.loadRelatedResources();

        const [resolvedChild, resolvedGrandchild] = wrapper.vm.relatedResources;

        expect(resolvedGrandchild.depth).toBe(2);
        expect(resolvedGrandchild.parentId).toBe(resolvedChild.nodeId);
      });

      it('should replace a depth and parentId supplied by a model rather than trust them', async() => {
        const child: RelatedResource = {
          resource: { id: 'ns/child', type: 'service' },
          depth:    99,
          parentId: 'ns/nonsense',
        };

        const wrapper = mountComponent({
          id:                    'ns/primary',
          type:                  'pod',
          fetchRelatedResources: () => Promise.resolve([child])
        });

        await wrapper.vm.loadRelatedResources();

        expect(wrapper.vm.relatedResources[0].depth).toBe(1);
      });

      it('should not mutate the entries handed over by the model', async() => {
        const grandchild: RelatedResource = { resource: { id: 'ns/gc', type: 'secret' } };
        const child: RelatedResource = {
          resource: {
            id:                    'ns/child',
            type:                  'service',
            fetchRelatedResources: () => Promise.resolve([grandchild]),
          }
        };

        const wrapper = mountComponent({
          id:                    'ns/primary',
          type:                  'pod',
          fetchRelatedResources: () => Promise.resolve([child])
        });

        await wrapper.vm.loadRelatedResources();

        expect(child).not.toHaveProperty('depth');
        expect(child).not.toHaveProperty('nodeId');
        expect(grandchild).not.toHaveProperty('depth');
        expect(grandchild).not.toHaveProperty('parentId');
        expect(grandchild).not.toHaveProperty('nodeId');
      });

      it('should ask the primary resource for both dependencies and dependents', async() => {
        const fetchRelatedResources = jest.fn(() => Promise.resolve([]));
        const wrapper = mountComponent({ type: 'pod', fetchRelatedResources });

        await wrapper.vm.loadRelatedResources();

        expect(fetchRelatedResources).toHaveBeenCalledWith({ dependencies: true, dependents: true });
      });

      it('should ask a related resource for its dependencies only', async() => {
        const fetchRelatedResources = jest.fn(() => Promise.resolve([]));
        const wrapper = mountComponent({
          type:                  'pod',
          fetchRelatedResources: () => Promise.resolve([{
            resource: {
              id: 'ns/child', type: 'service', fetchRelatedResources
            }
          }])
        });

        await wrapper.vm.loadRelatedResources();

        expect(fetchRelatedResources).toHaveBeenCalledWith({ dependencies: true, dependents: false });
      });

      it('should not expand a `dependent` entry', async() => {
        const fetchRelatedResources = jest.fn(() => Promise.resolve([{ resource: { id: 'ns/gc', type: 'secret' } }]));
        const wrapper = mountComponent({
          type:                  'pod',
          fetchRelatedResources: () => Promise.resolve([{
            resource: {
              id: 'ns/child', type: 'service', fetchRelatedResources
            },
            dependent: true
          }])
        });

        await wrapper.vm.loadRelatedResources();

        expect(fetchRelatedResources).toHaveBeenCalledTimes(0);
        expect(wrapper.vm.relatedResources.map((e: any) => e.resource.id)).toStrictEqual(['ns/child']);
      });

      it('should drop the entries of a kind that was not asked for, from a model or an extension that returns them anyway', async() => {
        // adds a dependent of every resource it is asked about
        mockedEnhancements.mockReturnValue([{
          fetchExtensionRelatedResources: (resource: any, res: RelatedResource[]) => [
            ...res,
            { resource: { id: `ns/extension-dependent-of-${ resource.metadata.name }`, type: 'secret' }, dependent: true },
          ]
        }]);

        const child = {
          id:                    'ns/child',
          type:                  'service',
          metadata:              { name: 'child', namespace: 'ns' },
          fetchRelatedResources: () => Promise.resolve([
            { resource: { id: 'ns/model-dependent', type: 'pod' }, dependent: true },
            { resource: { id: 'ns/model-dependency', type: 'secret' } },
          ]),
        };
        const wrapper = mountComponent({
          id:                    'ns/primary',
          type:                  'pod',
          metadata:              { name: 'primary', namespace: 'ns' },
          fetchRelatedResources: () => Promise.resolve([{ resource: child }]),
        });

        await wrapper.vm.loadRelatedResources();

        expect(wrapper.vm.relatedResources.map((e: any) => e.resource.id)).toStrictEqual([
          'ns/child',
          'ns/extension-dependent-of-primary',
          'ns/model-dependency',
        ]);
      });

      describe('read-only entries', () => {
        const controlledBy = (controller: boolean) => ({
          metadata: {
            ownerReferences: [{
              apiVersion: 'apps/v1', kind: 'ReplicaSet', name: 'web-1', controller
            }]
          }
        });

        // a StorageClass for a standard user fails on save, a ReplicaSet's controller rewrites it
        it.each([
          ['the user can not edit its yaml', { canEditYaml: false }, true],
          ['another resource controls it', controlledBy(true), true],
          ['its owner is not its controller', controlledBy(false), false],
          ['the user can edit its yaml and nothing controls it', { canEditYaml: true }, false],
        ])('should set `readOnly` on an entry where %s: %p', async(_label, fields, readOnly) => {
          const wrapper = mountComponent({
            type:                  'pod',
            fetchRelatedResources: () => Promise.resolve([{
              resource: {
                id: 'ns/related', type: 'apps.replicaset', ...fields
              }
            }])
          });

          await wrapper.vm.loadRelatedResources();

          expect(!!wrapper.vm.relatedResources[0].readOnly).toBe(readOnly);
        });

        it('should keep `readOnly` set by the source of an entry', async() => {
          const wrapper = mountComponent({
            type:                  'pod',
            fetchRelatedResources: () => Promise.resolve([{
              resource: {
                id: 'ns/related', type: 'service', canEditYaml: true
              },
              readOnly: true
            }])
          });

          await wrapper.vm.loadRelatedResources();

          expect(wrapper.vm.relatedResources[0].readOnly).toBe(true);
        });

        it('should mark a resource found below another resource read-only where the user can not edit its yaml', async() => {
          const wrapper = mountComponent({
            type:                  'pod',
            fetchRelatedResources: () => Promise.resolve([{
              resource: {
                id:                    'ns/claim',
                type:                  'persistentvolumeclaim',
                fetchRelatedResources: () => Promise.resolve([{
                  resource: {
                    id: 'sc', type: 'storage.k8s.io.storageclass', canEditYaml: false
                  }
                }])
              }
            }])
          });

          await wrapper.vm.loadRelatedResources();

          expect(wrapper.vm.relatedResources.map((e: any) => [e.resource.id, !!e.readOnly])).toStrictEqual([['ns/claim', false], ['sc', true]]);
        });

        it.each([
          ['its source set `readOnly`', { readOnly: true }, {}],
          ['the user can not edit its yaml', {}, { canEditYaml: false }],
          ['another resource controls it', {}, controlledBy(true)],
        ])('should not expand an entry where %s', async(_label, entryFields, resourceFields) => {
          const fetchRelatedResources = jest.fn(() => Promise.resolve([{ resource: { id: 'ns/below', type: 'secret' } }]));
          const wrapper = mountComponent({
            type:                  'pod',
            fetchRelatedResources: () => Promise.resolve([{
              resource: {
                id: 'ns/related', type: 'service', fetchRelatedResources, ...resourceFields
              },
              ...entryFields
            }])
          });

          await wrapper.vm.loadRelatedResources();

          expect(fetchRelatedResources).toHaveBeenCalledTimes(0);
          expect(wrapper.vm.relatedResources.map((e: any) => e.resource.id)).toStrictEqual(['ns/related']);
        });

        it('should not expand a read-only entry found below another resource', async() => {
          const fetchRelatedResources = jest.fn(() => Promise.resolve([{ resource: { id: 'driver', type: 'storage.k8s.io.csidriver' } }]));
          const wrapper = mountComponent({
            type:                  'pod',
            fetchRelatedResources: () => Promise.resolve([{
              resource: {
                id:                    'ns/claim',
                type:                  'persistentvolumeclaim',
                fetchRelatedResources: () => Promise.resolve([{
                  resource: {
                    id: 'sc', type: 'storage.k8s.io.storageclass', canEditYaml: false, fetchRelatedResources
                  }
                }])
              }
            }])
          });

          await wrapper.vm.loadRelatedResources();

          expect(fetchRelatedResources).toHaveBeenCalledTimes(0);
          expect(wrapper.vm.relatedResources.map((e: any) => e.resource.id)).toStrictEqual(['ns/claim', 'sc']);
        });
      });

      describe('requests', () => {
        // a promise to resolve from the test
        const deferred = () => {
          let resolve: (value: any) => void = () => {};
          const promise = new Promise<any>((_resolve) => {
            resolve = _resolve;
          });

          return { promise, resolve };
        };

        // the tree is as deep as the longest chain, not as long as the number of resources
        it('should ask every entry of one depth for its related resources before any of them answers', async() => {
          const fromA = deferred();
          const fromB = deferred();
          const fetchA = jest.fn(() => fromA.promise);
          const fetchB = jest.fn(() => fromB.promise);
          const wrapper = mountComponent({
            type:                  'pod',
            fetchRelatedResources: () => Promise.resolve([
              {
                resource: {
                  id: 'ns/a', type: 'service', fetchRelatedResources: fetchA
                }
              },
              {
                resource: {
                  id: 'ns/b', type: 'service', fetchRelatedResources: fetchB
                }
              },
            ])
          });

          const loading = wrapper.vm.loadRelatedResources();

          await flushPromises();

          expect(fetchA).toHaveBeenCalledTimes(1);
          expect(fetchB).toHaveBeenCalledTimes(1);

          fromA.resolve([]);
          fromB.resolve([]);
          await loading;
        });

        it('should add the resources found at one depth in the order of the entries, whichever answers first', async() => {
          const fromA = deferred();
          const fromB = deferred();
          const wrapper = mountComponent({
            type:                  'pod',
            fetchRelatedResources: () => Promise.resolve([
              {
                resource: {
                  id: 'ns/a', type: 'service', fetchRelatedResources: () => fromA.promise
                }
              },
              {
                resource: {
                  id: 'ns/b', type: 'service', fetchRelatedResources: () => fromB.promise
                }
              },
            ])
          });

          const loading = wrapper.vm.loadRelatedResources();

          await flushPromises();
          fromB.resolve([{ resource: { id: 'ns/from-b', type: 'secret' } }]);
          await flushPromises();
          fromA.resolve([{ resource: { id: 'ns/from-a', type: 'secret' } }]);
          await loading;

          expect(wrapper.vm.relatedResources.map((e: any) => e.resource.id)).toStrictEqual(['ns/a', 'ns/b', 'ns/from-a', 'ns/from-b']);
        });

        it('should keep a resource found from two entries of one depth below the first entry, whichever answers first', async() => {
          const fromA = deferred();
          const fromB = deferred();
          const shared = { resource: { id: 'ns/shared', type: 'secret' } };
          const wrapper = mountComponent({
            type:                  'pod',
            fetchRelatedResources: () => Promise.resolve([
              {
                resource: {
                  id: 'ns/a', type: 'service', fetchRelatedResources: () => fromA.promise
                }
              },
              {
                resource: {
                  id: 'ns/b', type: 'service', fetchRelatedResources: () => fromB.promise
                }
              },
            ])
          });

          const loading = wrapper.vm.loadRelatedResources();

          await flushPromises();
          fromB.resolve([shared]);
          await flushPromises();
          fromA.resolve([shared]);
          await loading;

          expect(wrapper.vm.relatedResources.find((e: any) => e.resource.id === 'ns/shared').parentId).toBe('service:ns/a');
        });
      });

      it('should not add the primary resource below a related resource that refers back to it', async() => {
        const wrapper = mountComponent({
          id:                    'ns/primary',
          type:                  'pod',
          fetchRelatedResources: () => Promise.resolve([{
            resource: {
              id: 'ns/child', type: 'service', fetchRelatedResources: () => Promise.resolve([{ resource: { id: 'ns/primary', type: 'pod' } }])
            }
          }])
        });

        await wrapper.vm.loadRelatedResources();

        expect(wrapper.vm.relatedResources.map((e: any) => e.nodeId)).toStrictEqual(['service:ns/child']);
      });

      it('should treat resources of different types that share an id as different resources', async() => {
        const wrapper = mountComponent({
          type:                  'pod',
          fetchRelatedResources: () => Promise.resolve([{
            resource: {
              id: 'ns/same', type: 'service', fetchRelatedResources: () => Promise.resolve([{ resource: { id: 'ns/same', type: 'secret' } }])
            }
          }])
        });

        await wrapper.vm.loadRelatedResources();

        expect(wrapper.vm.relatedResources.map((e: any) => e.nodeId)).toStrictEqual(['service:ns/same', 'secret:ns/same']);
      });

      it('should match the extension location config of a related resource against the route with `resource`, `namespace` and `id` set to that resource', async() => {
        const route = {
          query:  { as: 'yaml' },
          params: {
            cluster: 'local', resource: 'pod', namespace: 'ns'
          }
        };
        const wrapper = mountComponent({
          type:                  'pod',
          fetchRelatedResources: () => Promise.resolve([{
            resource: {
              id: 'other/s', type: 'secret', metadata: { name: 's', namespace: 'other' }
            }
          }])
        }, { route });

        await wrapper.vm.loadRelatedResources();

        const [forPrimary, forRelated] = mockedEnhancements.mock.calls.map((call: any[]) => call[3]);

        expect(forPrimary).toBe(route);
        expect(forRelated).toStrictEqual({
          query:  { as: 'yaml' },
          params: {
            cluster: 'local', resource: 'secret', namespace: 'other', id: 's'
          }
        });
      });

      it('should drop `namespace` from that route for a cluster-scoped related resource', async() => {
        const route = {
          query:  {},
          params: {
            cluster: 'local', resource: 'pod', namespace: 'ns'
          }
        };
        const wrapper = mountComponent({
          type:                  'persistentvolumeclaim',
          fetchRelatedResources: () => Promise.resolve([{
            resource: {
              id: 'fast', type: 'storage.k8s.io.storageclass', metadata: { name: 'fast' }
            }
          }])
        }, { route });

        await wrapper.vm.loadRelatedResources();

        expect(mockedEnhancements.mock.calls[1][3]).toStrictEqual({
          query:  {},
          params: {
            cluster: 'local', resource: 'storage.k8s.io.storageclass', id: 'fast'
          }
        });
      });
    });

    it('should keep the related resources found before a model throws, and warn', async() => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const error = new Error('model failed');
      const wrapper = mountComponent({
        type:                  'pod',
        fetchRelatedResources: () => Promise.resolve([
          {
            resource: {
              id: 'ns/fails', type: 'service', fetchRelatedResources: () => Promise.reject(error)
            }
          },
          { resource: { id: 'ns/after', type: 'secret' } },
        ])
      });

      await wrapper.vm.loadRelatedResources();

      expect(wrapper.vm.relatedResources.map((e: any) => e.resource.id)).toStrictEqual(['ns/fails', 'ns/after']);
      expect(warn).toHaveBeenCalledWith('Failed to fetch related resources for', 'ns/fails', error);
    });

    it('should keep the related resources found before an extension throws, and warn', async() => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const error = new Error('extension failed');

      mockedEnhancements.mockReturnValue([
        { fetchExtensionRelatedResources: (_resource: any, res: RelatedResource[]) => [...res, { resource: { id: 'ns/from-extension', type: 'secret' } }] },
        {
          fetchExtensionRelatedResources: () => {
            throw error;
          }
        },
      ]);

      const wrapper = mountComponent({ id: 'ns/primary', type: 'pod' });

      await wrapper.vm.loadRelatedResources();

      expect(wrapper.vm.relatedResources.map((e: any) => e.resource.id)).toStrictEqual(['ns/from-extension']);
      expect(warn).toHaveBeenCalledWith('Extension failed to fetch related resources for', 'ns/primary', error);
    });

    it('should not apply extensions when the older dashboard has no extension config support', async() => {
      mockedEnhancements.mockReturnValue([{ fetchExtensionRelatedResources: (_resource: any, res: RelatedResource[]) => [...res, { resource: { type: 'a' } }] }]);

      const wrapper = mountComponent({ type: 'pod' }, { withExtensionSupport: false });

      await wrapper.vm.loadRelatedResources();

      expect(wrapper.vm.relatedResources).toStrictEqual([]);
      expect(mockedEnhancements).toHaveBeenCalledTimes(0);
    });

    it('should not let a slow load for a previous resource overwrite the current resource result', async() => {
      let resolveSlow: (res: RelatedResource[]) => void = () => {};
      const slow = {
        type:                  'pod',
        fetchRelatedResources: () => new Promise<RelatedResource[]>((resolve) => {
          resolveSlow = resolve;
        })
      };
      const wrapper = mountComponent(slow);

      const pending = wrapper.vm.loadRelatedResources();

      await wrapper.setProps({ value: { type: 'pod' } });

      resolveSlow([{ resource: { type: 'stale' } }]);
      await pending;

      expect(wrapper.vm.relatedResources).toStrictEqual([]);
    });
  });

  describe('mode', () => {
    const withRelated = () => ({ type: 'pod', fetchRelatedResources: jest.fn(() => Promise.resolve([{ resource: { type: 'service', id: 'ns/a' } }])) });

    it.each([_VIEW, _CREATE])('should not fetch related resources in %s mode', async(mode) => {
      const value = withRelated();
      const wrapper = mountComponent(value, { mode });

      await wrapper.vm.loadRelatedResources();

      expect(value.fetchRelatedResources).toHaveBeenCalledTimes(0);
      expect(wrapper.vm.relatedResources).toStrictEqual([]);
      expect(wrapper.vm.needsMultiEdit).toBe(false);
    });

    it('should not fetch related resources in edit mode when the route query mode is view', async() => {
      const value = withRelated();
      const wrapper = mountComponent(value, { route: { query: { mode: _VIEW } } });

      await wrapper.vm.loadRelatedResources();

      expect(value.fetchRelatedResources).toHaveBeenCalledTimes(0);
      expect(wrapper.vm.needsMultiEdit).toBe(false);
    });

    it('should fetch the related resources when the mode changes from view to edit', async() => {
      const value = withRelated();
      const wrapper = mountComponent(value, { mode: _VIEW });

      await wrapper.setProps({ mode: _EDIT });
      await flushPromises();

      expect(value.fetchRelatedResources).toHaveBeenCalledWith({ dependencies: true, dependents: true });
      expect(wrapper.vm.needsMultiEdit).toBe(true);
    });

    it('should not let a load started in edit mode overwrite the result once the mode is view', async() => {
      let resolveSlow: (res: RelatedResource[]) => void = () => {};
      const value = {
        type:                  'pod',
        fetchRelatedResources: () => new Promise<RelatedResource[]>((resolve) => {
          resolveSlow = resolve;
        })
      };
      const wrapper = mountComponent(value);

      const pending = wrapper.vm.loadRelatedResources();

      await wrapper.setProps({ mode: _VIEW });

      resolveSlow([{ resource: { type: 'service', id: 'ns/a' } }]);
      await pending;

      expect(wrapper.vm.relatedResources).toStrictEqual([]);
    });

    it('should drop the related resources when the mode changes from edit to view', async() => {
      const value = withRelated();
      const wrapper = mountComponent(value);

      await wrapper.vm.loadRelatedResources();
      await wrapper.setProps({ mode: _VIEW });
      await flushPromises();

      expect(wrapper.vm.relatedResources).toStrictEqual([]);
      expect(wrapper.vm.needsMultiEdit).toBe(false);
    });
  });
});
