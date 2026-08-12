import { shallowMount, flushPromises } from '@vue/test-utils';
import ResourceTemplateSelector from '@shell/components/ResourceTemplateSelector.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { RcButton } from '@components/RcButton';
import ResourceTemplateUtils from '@shell/utils/resource-template';

jest.mock('@shell/utils/resource-template', () => ({
  __esModule: true,
  default:    { fetchTemplates: jest.fn() },
}));

const mockStore = {};

jest.mock('vuex', () => ({ ...jest.requireActual('vuex'), useStore: () => mockStore }));

describe('component: ResourceTemplateSelector', () => {
  const mockTemplates = [
    { id: 'default/tpl-a', metadata: { namespace: 'default', name: 'tpl-a' } },
    { id: 'kube-system/tpl-b', metadata: { namespace: 'kube-system', name: 'tpl-b' } },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mountComponent = async(resourceType = 'apps.deployment') => {
    const wrapper = shallowMount(ResourceTemplateSelector, { props: { resourceType } });

    await flushPromises();

    return wrapper;
  };

  it('should fetch templates matching the resource type on mount', async() => {
    (ResourceTemplateUtils.fetchTemplates as jest.Mock).mockResolvedValue(mockTemplates);

    await mountComponent('apps.deployment');

    expect(ResourceTemplateUtils.fetchTemplates).toHaveBeenCalledWith(mockStore, 'apps.deployment');
  });

  it('should not render anything when there are no matching templates', async() => {
    (ResourceTemplateUtils.fetchTemplates as jest.Mock).mockResolvedValue([]);

    const wrapper = await mountComponent();

    expect(wrapper.find('.resource-template-selector').exists()).toBe(false);
  });

  it('should render the matching templates as namespace/name labeled options', async() => {
    (ResourceTemplateUtils.fetchTemplates as jest.Mock).mockResolvedValue(mockTemplates);

    const wrapper = await mountComponent();

    expect(wrapper.findComponent(LabeledSelect).props('options')).toStrictEqual([
      { label: 'default/tpl-a', value: 'default/tpl-a' },
      { label: 'kube-system/tpl-b', value: 'kube-system/tpl-b' },
    ]);
  });

  it('should emit apply with the selected template when Apply is clicked', async() => {
    (ResourceTemplateUtils.fetchTemplates as jest.Mock).mockResolvedValue(mockTemplates);

    const wrapper = await mountComponent();

    await wrapper.findComponent(LabeledSelect).vm.$emit('update:value', 'kube-system/tpl-b');
    await wrapper.findComponent(RcButton).trigger('click');

    expect(wrapper.emitted('apply')).toBeTruthy();
    expect(wrapper.emitted('apply')![0]).toStrictEqual([mockTemplates[1]]);
  });

  it('should not emit apply when nothing is selected', async() => {
    (ResourceTemplateUtils.fetchTemplates as jest.Mock).mockResolvedValue(mockTemplates);

    const wrapper = await mountComponent();

    await wrapper.findComponent(RcButton).trigger('click');

    expect(wrapper.emitted('apply')).toBeFalsy();
  });
});
