import { shallowMount } from '@vue/test-utils';
import digitalocean from '@shell/machine-config/digitalocean.vue';
import ArrayList from '@shell/components/form/ArrayList';
import { _CREATE, _EDIT } from '@shell/config/query-params';

describe('component: digitalocean', () => {
  const createWrapper = (propsData: Record<string, unknown> = {}) => shallowMount(digitalocean, {
    propsData: {
      credentialId: 'credentialId',
      mode:         _CREATE,
      value:        { tags: 'existing-tag' },
      ...propsData,
    },
    global: {
      mocks: {
        $fetchState: { pending: false },
        $store:      { getters: { 'i18n/t': (key: string) => key } },
      },
    },
  });

  const findTagsList = (wrapper: ReturnType<typeof createWrapper>) => wrapper.findComponent(ArrayList);

  describe('droplet tags', () => {
    it.each([
      ['a new cluster', _CREATE, true],
      ['a new pool on an existing cluster', _EDIT, true],
      ['an existing pool', _EDIT, false],
    ])('should only allow editing tags on a new pool: %s', (_, mode, poolCreateMode) => {
      const tagsList = findTagsList(createWrapper({ mode, poolCreateMode }));

      expect(tagsList.props()).toStrictEqual(expect.objectContaining({
        value:         ['existing-tag'],
        disabled:      !poolCreateMode,
        addAllowed:    poolCreateMode,
        removeAllowed: poolCreateMode,
      }));
    });

    it('should write the emitted tags to the machine config', async() => {
      const value = { tags: 'existing-tag' };
      const tagsList = findTagsList(createWrapper({ value }));

      await tagsList.vm.$emit('update:value', ['existing-tag', 'new-tag']);

      expect(value.tags).toStrictEqual('existing-tag,new-tag');
    });

    it('should clear the machine config tags when every tag is removed', async() => {
      const value = { tags: 'existing-tag' };
      const tagsList = findTagsList(createWrapper({ value }));

      await tagsList.vm.$emit('update:value', []);

      expect(value.tags).toStrictEqual('');
    });
  });
});
