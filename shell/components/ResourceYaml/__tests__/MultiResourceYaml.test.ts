import { shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import MultiResourceYaml from '@shell/components/ResourceYaml/MultiResourceYaml.vue';
import { EditableRelatedResource } from '@shell/core/types';
import { Banner } from '@components/Banner';

describe.skip('component: MultiResourceYaml', () => {
  const mountComponent = (relatedResources: EditableRelatedResource[], value: any = { type: 'cluster', id: 'ns/primary' }) => shallowMount(MultiResourceYaml, { props: { value, relatedResources } });

  describe('banner', () => {
    it('should show no banner for a related resource that provides none', () => {
      const wrapper = mountComponent([{ resource: { type: 'config', id: 'ns/a' } }]);

      expect(wrapper.findComponent(Banner).exists()).toBe(false);
    });

    it('should show the banner a related resource provides when it is selected', async() => {
      const wrapper = mountComponent([{
        resource: { type: 'config', id: 'ns/a' },
        banner:   () => ({
          color: 'warning', label: 'Careful', icon: 'icon-warning'
        })
      }]);

      wrapper.vm.editorState.selected = 'config:ns/a';
      await nextTick();

      const banner = wrapper.findComponent(Banner);

      expect(banner.props('color')).toBe('warning');
      expect(banner.props('label')).toBe('Careful');
      expect(banner.props('icon')).toBe('icon-warning');
    });

    it('should default the color of a banner that provides none', async() => {
      const wrapper = mountComponent([{ resource: { type: 'config', id: 'ns/a' }, banner: () => ({ labelKey: 'some.key' }) }]);

      wrapper.vm.editorState.selected = 'config:ns/a';
      await nextTick();

      const banner = wrapper.findComponent(Banner);

      expect(banner.props('color')).toBe('info');
      expect(banner.props('labelKey')).toBe('some.key');
    });

    it('should provide the resources and the editor state to the banner', async() => {
      const banner = jest.fn(() => null);
      const resource = { type: 'config', id: 'ns/a' };
      const primaryResource = { type: 'cluster', id: 'ns/primary' };
      const relatedResources = [{ resource, banner }];

      const wrapper = mountComponent(relatedResources, primaryResource);

      wrapper.vm.editorState.selected = 'config:ns/a';
      await nextTick();

      const [ctx] = (banner.mock.calls as any[]).at(-1);

      expect(ctx.resource).toStrictEqual(resource);
      expect(ctx.relatedResources).toStrictEqual(relatedResources);
      expect(ctx.primaryResource).toStrictEqual(primaryResource);
      expect(ctx.editorState.selected).toBe('config:ns/a');
      expect(ctx.nodeId).toBe('config:ns/a');
      expect(ctx.primaryNodeId).toBe('cluster:ns/primary');
      expect(Object.keys(ctx.initialYaml)).toStrictEqual(['cluster:ns/primary', 'config:ns/a']);
    });

    it('should re-resolve the banner when the editor state changes', async() => {
      const wrapper = mountComponent([{
        resource: { type: 'config', id: 'ns/a' },
        banner:   ({ resource, editorState }) => (editorState.selected === `config:${ resource.id }` ? { label: 'Selected' } : null)
      }]);

      expect(wrapper.findComponent(Banner).exists()).toBe(false);

      wrapper.vm.editorState.selected = 'config:ns/a';
      await nextTick();

      expect(wrapper.findComponent(Banner).props('label')).toBe('Selected');
    });

    it('should re-resolve the banner when the related resources change', async() => {
      const wrapper = mountComponent([{ resource: { type: 'config', id: 'ns/a' }, banner: () => ({ label: 'A' }) }]);

      wrapper.vm.editorState.selected = 'config:ns/a';
      await nextTick();

      expect(wrapper.findComponent(Banner).props('label')).toBe('A');

      await wrapper.setProps({ relatedResources: [{ resource: { type: 'config', id: 'ns/b' }, banner: () => ({ label: 'B' }) }] });
      wrapper.vm.editorState.selected = 'config:ns/b';
      await nextTick();

      expect(wrapper.findComponent(Banner).props('label')).toBe('B');
    });

    it('should show the banner of the selected related resource', async() => {
      const wrapper = mountComponent([
        { resource: { type: 'config', id: 'ns/a' }, banner: () => ({ label: 'A' }) },
        { resource: { type: 'config', id: 'ns/b' } },
        { resource: { type: 'config', id: 'ns/c' }, banner: () => ({ label: 'C' }) },
      ]);

      wrapper.vm.editorState.selected = 'config:ns/a';
      await nextTick();
      expect(wrapper.findComponent(Banner).props('label')).toBe('A');

      wrapper.vm.editorState.selected = 'config:ns/b';
      await nextTick();
      expect(wrapper.findComponent(Banner).exists()).toBe(false);

      wrapper.vm.editorState.selected = 'config:ns/c';
      await nextTick();
      expect(wrapper.findComponent(Banner).props('label')).toBe('C');
    });

    it('should show no banner when resolving it throws', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      const wrapper = mountComponent([{
        resource: { type: 'config', id: 'ns/a' },
        banner:   () => {
          throw new Error('nope');
        }
      }]);

      expect(wrapper.findComponent(Banner).exists()).toBe(false);
    });

    it.each([
      ['a non-function', 'nope'],
      ['a falsy result', () => null],
      ['an undefined result', () => undefined],
    ])('should show no banner for %s', (_label, banner) => {
      const wrapper = mountComponent([{ resource: { type: 'config', id: 'ns/a' }, banner } as EditableRelatedResource]);

      expect(wrapper.findComponent(Banner).exists()).toBe(false);
    });
  });
});
