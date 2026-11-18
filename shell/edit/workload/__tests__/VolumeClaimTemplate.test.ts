import { shallowMount } from '@vue/test-utils';
import VolumeClaimTemplate from '@shell/edit/workload/VolumeClaimTemplate.vue';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped.vue';
import { _CREATE } from '@shell/config/query-params';

describe('component: VolumeClaimTemplate', () => {
  const claim = (name?: string) => ({ metadata: { name }, spec: { accessModes: ['ReadWriteOnce'], resources: { requests: { storage: '1Gi' } } } });

  const createSpec = (removedName?: string) => {
    const kept = claim('a');
    const removed = claim(removedName);

    return {
      kept,
      removed,
      spec: {
        volumeClaimTemplates: [kept, removed],
        template:             {
          spec: {
            containers: [{
              name:         'container-0',
              volumeMounts: [
                { name: 'a', mountPath: '/a' },
                { name: removedName || '', mountPath: '/b' },
                { name: 'config', mountPath: '/config' },
              ]
            }]
          }
        }
      }
    };
  };

  const createWrapper = (value: object) => shallowMount(VolumeClaimTemplate, {
    props:  { mode: _CREATE, value },
    global: { mocks: { $store: { getters: { 'i18n/t': (key: string) => key } } } }
  });

  it('should save the templates left after one is removed', () => {
    const { kept, spec } = createSpec('b');
    const wrapper = createWrapper(spec);

    wrapper.findComponent(ArrayListGrouped).vm.$emit('update:value', [kept]);

    expect(spec.volumeClaimTemplates).toStrictEqual([kept]);
  });

  it.each([
    ['a named template', 'b'],
    ['an unnamed template', undefined],
  ])('should remove the mounts of %p and keep the others', (_, removedName) => {
    const { removed, spec } = createSpec(removedName);
    const wrapper = createWrapper(spec);

    wrapper.findComponent(ArrayListGrouped).vm.$emit('remove', { row: { value: removed }, index: 1 });

    expect(spec.template.spec.containers[0].volumeMounts).toStrictEqual([
      { name: 'a', mountPath: '/a' },
      { name: 'config', mountPath: '/config' },
    ]);
  });
});
