import { shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import ResourceYaml from '@shell/components/ResourceYaml/index.vue';
import SingleResourceYaml from '@shell/components/ResourceYaml/SingleResourceYaml.vue';
import MultiResourceYaml from '@shell/components/ResourceYaml/MultiResourceYaml.vue';
import Loading from '@shell/components/Loading.vue';
import { _CREATE, _EDIT, _VIEW } from '@shell/config/query-params';

jest.mock('@shell/core/plugin-helpers', () => ({ getApplicableExtensionEnhancements: jest.fn(() => []) }));

describe('component: ResourceYaml', () => {
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
    pending = false, related = [] as any[], slots = {}, stubs = {}, mode = props.mode, query = {}
  } = {}) => {
    const wrapper = shallowMount(ResourceYaml, {
      props:  { ...props, mode },
      slots,
      global: {
        mocks: {
          $router:     { applyQuery: jest.fn(), replace: jest.fn() },
          $route:      { query },
          $fetchState: { pending },
          $store:      { getters: {} }
        },
        stubs
      }
    });

    wrapper.vm.relatedResources = related;

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

    // edit as yaml from a form: without these the form's edits are not marked modified and its save hooks do not run
    it('should pass MultiResourceYaml the yaml, the yaml to compare it with and the save hooks of the parent', async() => {
      const applyHooks = jest.fn();
      const wrapper = shallowMount(ResourceYaml, {
        props: {
          ...props, applyHooks, showEditAsForm: true
        },
        global: {
          mocks: {
            $router: { applyQuery: jest.fn(), replace: jest.fn() }, $route: { query: {} }, $fetchState: { pending: false }, $store: { getters: {} }
          }
        }
      });

      wrapper.vm.relatedResources = [{ resource: { type: 'service', id: 'ns/a' } }];
      await nextTick();

      const multi = wrapper.findComponent(MultiResourceYaml);

      expect(multi.props('yaml')).toBe('YAML');
      expect(multi.props('initialYamlForDiff')).toBe('INITIAL');
      expect(multi.props('applyHooks')).toBe(applyHooks);
      expect(multi.props('showEditAsForm')).toBe(true);
    });

    it('should emit `edit-as-form` when MultiResourceYaml emits it', async() => {
      const wrapper = mountComponent({ related: [{ resource: { type: 'service', id: 'ns/a' } }] });

      await nextTick();
      wrapper.findComponent(MultiResourceYaml).vm.$emit('edit-as-form');

      expect(wrapper.emitted('edit-as-form')).toStrictEqual([[]]);
    });

    // SingleResourceYaml does not declare it, so it would fall through to its root element as an attribute
    it('should not pass `showEditAsForm` to SingleResourceYaml', async() => {
      const wrapper = shallowMount(ResourceYaml, {
        props:  { ...props, showEditAsForm: true },
        global: {
          mocks: {
            $router: { applyQuery: jest.fn(), replace: jest.fn() }, $route: { query: {} }, $fetchState: { pending: false }, $store: { getters: {} }
          }
        }
      });

      await nextTick();

      const single = wrapper.findComponent(SingleResourceYaml);

      expect(single.props()).toStrictEqual(props);
      expect(single.attributes()).not.toHaveProperty('show-edit-as-form');
    });

    it.each([_VIEW, _CREATE])('should show SingleResourceYaml in %s mode, even with related resources', async(mode) => {
      const wrapper = mountComponent({ mode, related: [{ resource: { type: 'service', id: 'ns/a' } }] });

      await nextTick();

      expect(wrapper.findComponent(MultiResourceYaml).exists()).toBe(false);
      expect(wrapper.findComponent(SingleResourceYaml).props('mode')).toBe(mode);
    });

    it('should show SingleResourceYaml in edit mode when the route query mode is view, even with related resources', async() => {
      const wrapper = mountComponent({ query: { mode: _VIEW }, related: [{ resource: { type: 'service', id: 'ns/a' } }] });

      await nextTick();

      expect(wrapper.findComponent(MultiResourceYaml).exists()).toBe(false);
      expect(wrapper.findComponent(SingleResourceYaml).exists()).toBe(true);
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
      const fetchRelatedResources = jest.fn(() => Promise.resolve([]));

      await wrapper.setProps({ value: { type: 'pod', fetchRelatedResources } });

      expect(fetchRelatedResources).toHaveBeenCalledWith({ dependencies: true, dependents: true });
    });
  });
});
