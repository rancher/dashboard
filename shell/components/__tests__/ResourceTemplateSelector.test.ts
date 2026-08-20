import { shallowMount, flushPromises } from '@vue/test-utils';
import ResourceTemplateSelector from '@shell/components/ResourceTemplateSelector.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { RcButton } from '@components/RcButton';
import ResourceTemplateUtils from '@shell/utils/resource-template';

jest.mock('@shell/utils/resource-template', () => ({
  __esModule: true,
  default:    { fetchTemplates: jest.fn() },
}));

const schemaFor = jest.fn();
const mockStore = {
  getters: {
    currentStore:        () => 'cluster',
    'cluster/schemaFor': schemaFor,
  },
};

jest.mock('vuex', () => ({ ...jest.requireActual('vuex'), useStore: () => mockStore }));

describe('component: ResourceTemplateSelector', () => {
  const mockTemplates = [
    { id: 'default/tpl-a', metadata: { namespace: 'default', name: 'tpl-a' } },
    { id: 'kube-system/tpl-b', metadata: { namespace: 'kube-system', name: 'tpl-b' } },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mountComponent = async(resourceType = 'apps.deployment', global: Record<string, any> = {}) => {
    const wrapper = shallowMount(ResourceTemplateSelector, { props: { resourceType }, global });

    await flushPromises();

    return wrapper;
  };

  it('should fetch templates matching the resource type on mount', async() => {
    schemaFor.mockReturnValue({ attributes: { namespaced: false } });
    (ResourceTemplateUtils.fetchTemplates as jest.Mock).mockResolvedValue(mockTemplates);

    await mountComponent('apps.deployment');

    expect(ResourceTemplateUtils.fetchTemplates).toHaveBeenCalledWith(mockStore, 'apps.deployment');
  });

  it('should always render the Save button, even with no matching templates', async() => {
    schemaFor.mockReturnValue({ attributes: { namespaced: false } });
    (ResourceTemplateUtils.fetchTemplates as jest.Mock).mockResolvedValue([]);

    const wrapper = await mountComponent();

    expect(wrapper.find('.resource-template-selector').exists()).toBe(true);
    expect(wrapper.findComponent(RcButton).exists()).toBe(true);
    expect(wrapper.findComponent(LabeledSelect).exists()).toBe(false);
  });

  it('should render the matching templates as flat namespace/name labeled options when the resource type is not namespaced', async() => {
    schemaFor.mockReturnValue({ attributes: { namespaced: false } });
    (ResourceTemplateUtils.fetchTemplates as jest.Mock).mockResolvedValue(mockTemplates);

    const wrapper = await mountComponent();

    expect(schemaFor).toHaveBeenCalledWith('apps.deployment');
    expect(wrapper.findComponent(LabeledSelect).props('options')).toStrictEqual([
      { label: 'default/tpl-a', value: 'default/tpl-a' },
      { label: 'kube-system/tpl-b', value: 'kube-system/tpl-b' },
    ]);
  });

  it('should group the matching templates by namespace, sorted, when the resource type is namespaced', async() => {
    schemaFor.mockReturnValue({ attributes: { namespaced: true } });
    (ResourceTemplateUtils.fetchTemplates as jest.Mock).mockResolvedValue(mockTemplates);

    const wrapper = await mountComponent();

    expect(wrapper.findComponent(LabeledSelect).props('options')).toStrictEqual([
      { kind: 'group', label: 'default' },
      { label: 'tpl-a', value: 'default/tpl-a' },
      { kind: 'group', label: 'kube-system' },
      { label: 'tpl-b', value: 'kube-system/tpl-b' },
    ]);
  });

  it('should emit apply with the selected template as soon as an option is picked', async() => {
    schemaFor.mockReturnValue({ attributes: { namespaced: false } });
    (ResourceTemplateUtils.fetchTemplates as jest.Mock).mockResolvedValue(mockTemplates);

    const wrapper = await mountComponent();

    await wrapper.findComponent(LabeledSelect).vm.$emit('update:value', 'kube-system/tpl-b');

    expect(wrapper.emitted('apply')).toBeTruthy();
    expect(wrapper.emitted('apply')![0]).toStrictEqual([mockTemplates[1]]);
    expect(wrapper.findComponent(LabeledSelect).props('value')).toBe('kube-system/tpl-b');
  });

  it('should not emit apply when the selected id does not match a fetched template', async() => {
    schemaFor.mockReturnValue({ attributes: { namespaced: false } });
    (ResourceTemplateUtils.fetchTemplates as jest.Mock).mockResolvedValue(mockTemplates);

    const wrapper = await mountComponent();

    await wrapper.findComponent(LabeledSelect).vm.$emit('update:value', 'does-not-exist');

    expect(wrapper.emitted('apply')).toBeFalsy();
  });

  it('should emit save when the Save button is clicked', async() => {
    schemaFor.mockReturnValue({ attributes: { namespaced: false } });
    (ResourceTemplateUtils.fetchTemplates as jest.Mock).mockResolvedValue([]);

    const wrapper = await mountComponent();

    await wrapper.findComponent(RcButton).trigger('click');

    expect(wrapper.emitted('save')).toBeTruthy();
    expect(wrapper.emitted('save')![0]).toStrictEqual([]);
  });

  describe('registerTemplateSelector injection', () => {
    it('should register a reset function on mount that clears the current selection back to the placeholder', async() => {
      schemaFor.mockReturnValue({ attributes: { namespaced: false } });
      (ResourceTemplateUtils.fetchTemplates as jest.Mock).mockResolvedValue(mockTemplates);

      const registerTemplateSelector = jest.fn();
      const wrapper = await mountComponent('apps.deployment', { provide: { registerTemplateSelector } });

      expect(registerTemplateSelector).toHaveBeenCalledWith(expect.any(Function));

      await wrapper.findComponent(LabeledSelect).vm.$emit('update:value', 'default/tpl-a');
      expect(wrapper.findComponent(LabeledSelect).props('value')).toBe('default/tpl-a');

      const reset = registerTemplateSelector.mock.calls[0][0];

      reset();
      await wrapper.vm.$nextTick();

      expect(wrapper.findComponent(LabeledSelect).props('value')).toBeNull();
    });

    it('should unregister itself on unmount', async() => {
      schemaFor.mockReturnValue({ attributes: { namespaced: false } });
      (ResourceTemplateUtils.fetchTemplates as jest.Mock).mockResolvedValue([]);

      const registerTemplateSelector = jest.fn();
      const wrapper = await mountComponent('apps.deployment', { provide: { registerTemplateSelector } });

      wrapper.unmount();

      expect(registerTemplateSelector).toHaveBeenLastCalledWith(null);
    });
  });
});
