import { shallowMount } from '@vue/test-utils';
import FleetSecretSelector from '@shell/components/fleet/FleetSecretSelector.vue';
import { _EDIT } from '@shell/config/query-params';

describe('component: FleetSecretSelector.vue', () => {
  const secretsMock = [
    {
      id: '1', name: 'secret1', namespace: 'fleet-default', _type: 'Opaque'
    },
    {
      id: '2', name: 'secret2', namespace: 'fleet-default', _type: 'Opaque'
    },
    {
      id: '3', name: 'secret3', namespace: 'other', _type: 'Opaque'
    },
  ];

  const props = {
    value:     {},
    namespace: 'fleet-default',
    inStore:   'management',
    mode:      _EDIT,
  };

  const global = { mocks: { $fetchState: { pending: false, error: false } } };

  it('should emit update:value when update is called', async() => {
    const wrapper = shallowMount(FleetSecretSelector, { props, global });

    await (wrapper.vm as any).update('secret1');

    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')?.[0]).toStrictEqual(['secret1']);
  });

  it('should correctly map secrets', () => {
    const wrapper = shallowMount(FleetSecretSelector, { props, global });
    const mapped = (wrapper.vm as any).mapSecrets(secretsMock);

    expect(mapped).toStrictEqual([
      { label: 'secret1', value: 'secret1' },
      { label: 'secret2', value: 'secret2' },
      { label: 'secret3', value: 'secret3' }
    ]);
  });

  it('should filter and sort secrets by namespace and type', () => {
    const wrapper = shallowMount(FleetSecretSelector, { props, global });

    const result = (wrapper.vm as any).allSecretsSettings.updateResources(secretsMock);

    expect(result).toStrictEqual([
      { label: 'secret1', value: 'secret1' },
      { label: 'secret2', value: 'secret2' }
    ]);
    expect((wrapper.vm as any).secrets).toStrictEqual([
      {
        id: '1', name: 'secret1', namespace: 'fleet-default', _type: 'Opaque'
      },
      {
        id: '2', name: 'secret2', namespace: 'fleet-default', _type: 'Opaque'
      }
    ]);
  });

  it('should return correct filter structure from paginatePageOptions', () => {
    const wrapper = shallowMount(FleetSecretSelector, { props, global });

    const opts = { opts: { filter: 'secret' } };
    const result = (wrapper.vm as any).paginatePageOptions(opts);

    expect(result.filters).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({ fields: expect.arrayContaining([expect.objectContaining({ field: 'metadata.name' })]) }),
        expect.objectContaining({ fields: expect.arrayContaining([expect.objectContaining({ field: 'metadata.namespace' })]) }),
        expect.objectContaining({ fields: expect.arrayContaining([expect.objectContaining({ field: 'metadata.fields.1' })]) }),
      ])
    );

    expect(result.sort).toStrictEqual([{ asc: true, field: 'metadata.name' }]);
  });
});
