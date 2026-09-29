import { shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import ResourceYaml from '@shell/components/ResourceYaml/index.vue';
import SingleResourceYaml from '@shell/components/ResourceYaml/SingleResourceYaml.vue';
import MultiResourceYaml from '@shell/components/ResourceYaml/MultiResourceYaml.vue';
import Loading from '@shell/components/Loading.vue';
import { _EDIT } from '@shell/config/query-params';

jest.mock('@shell/core/plugin-helpers', () => ({ getApplicableExtensionEnhancements: jest.fn(() => []) }));

describe.skip('component: ResourceYaml', () => {
  const props = {
    mode:               _EDIT,
    yaml:               'YAML',
    value:              { type: 'pod' },
    initialYamlForDiff: 'INITIAL',
    doneRoute:          'done',
    offerPreview:       false,
    parentParams:       { a: 1 },
    doneOverride:       null,
    showFooter:         false,
    showErrors:         false,
    applyHooks:         null,
  };

  const mountComponent = ({
    pending = false, related = [] as any[], slots = {}, stubs = {}
  } = {}) => {
    const wrapper = shallowMount(ResourceYaml, {
      props,
      slots,
      global: {
        mocks: {
          $router:     { applyQuery: jest.fn(), replace: jest.fn() },
          $route:      { query: {} },
          $fetchState: { pending },
          $store:      { getters: {} }
        },
        stubs
      }
    });

    wrapper.vm.editableRelatedResources = related;

    return wrapper;
  };

  describe('rendering', () => {
    it('should show the loading indicator while the related resources are fetched', async() => {
      const wrapper = mountComponent({ pending: true });

      await nextTick();

      expect(wrapper.findComponent(Loading).exists()).toBe(true);
      expect(wrapper.findComponent(SingleResourceYaml).exists()).toBe(false);
      expect(wrapper.findComponent(MultiResourceYaml).exists()).toBe(false);
    });

    it('should show SingleResourceYaml, with all of its props, when there are no related resources', async() => {
      const wrapper = mountComponent();

      await nextTick();

      expect(wrapper.findComponent(MultiResourceYaml).exists()).toBe(false);
      expect(wrapper.findComponent(SingleResourceYaml).props()).toStrictEqual(props);
    });

    it('should show MultiResourceYaml with `value` and the related resources when there are some', async() => {
      const related = [{ resource: { type: 'service', id: 'ns/a' } }];
      const wrapper = mountComponent({ related });

      await nextTick();

      const multi = wrapper.findComponent(MultiResourceYaml);

      expect(wrapper.findComponent(SingleResourceYaml).exists()).toBe(false);
      expect(multi.props('value')).toStrictEqual(props.value);
      expect(multi.props('relatedResources')).toStrictEqual(related);
    });

    it('should emit `error` when SingleResourceYaml emits `error`', async() => {
      const wrapper = mountComponent();

      await nextTick();
      wrapper.findComponent(SingleResourceYaml).vm.$emit('error', ['nope']);

      expect(wrapper.emitted('error')).toStrictEqual([[['nope']]]);
    });

    it('should emit `error` when MultiResourceYaml emits `error`', async() => {
      const wrapper = mountComponent({ related: [{ resource: { type: 'service', id: 'ns/a' } }] });

      await nextTick();
      wrapper.findComponent(MultiResourceYaml).vm.$emit('error', ['nope']);

      expect(wrapper.emitted('error')).toStrictEqual([[['nope']]]);
    });

    it('should pass its slots, with their slot props, to SingleResourceYaml', async() => {
      const wrapper = mountComponent({
        slots: { yamlFooter: '<template #yamlFooter="{ currentYaml }"><span class="footer-slot">{{ currentYaml }}</span></template>' },
        stubs: { SingleResourceYaml: { template: '<div><slot name="yamlFooter" currentYaml="CURRENT" /></div>' } },
      });

      await nextTick();

      expect(wrapper.find('.footer-slot').text()).toBe('CURRENT');
    });

    it('should load the related resources again when `value` changes', async() => {
      const wrapper = mountComponent();
      const fetchEditableRelatedResources = jest.fn(() => Promise.resolve([]));

      await wrapper.setProps({ value: { type: 'pod', fetchEditableRelatedResources } });

      expect(fetchEditableRelatedResources).toHaveBeenCalledWith();
    });
  });
});
