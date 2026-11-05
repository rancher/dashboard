import { shallowMount } from '@vue/test-utils';
import ResourceLabeledSelect from '@shell/components/form/ResourceLabeledSelect.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { RESOURCE_LABEL_SELECT_MODE } from '@shell/types/components/resourceLabeledSelect';

const mockStore = {
  getters: {
    currentStore:                jest.fn().mockReturnValue('cluster'),
    'cluster/paginationEnabled': jest.fn().mockReturnValue(true),
    'cluster/all':               jest.fn().mockReturnValue([{ id: 'foo', name: 'Foo' }]),
  },
  dispatch: jest.fn().mockResolvedValue(undefined),
};

const requiredSetup = () => {
  return {
    global: {
      components: { LabeledSelect },
      mocks:      { $store: mockStore, $fetchState: {} }
    }
  };
};

describe('component: ResourceLabeledSelect.vue', () => {
  it('should render LabeledSelect', async() => {
    const wrapper = shallowMount(ResourceLabeledSelect, {
      ...requiredSetup(),
      props: { resourceType: 'testResource' }
    });

    expect(wrapper.findComponent(LabeledSelect).exists()).toBe(true);
  });

  it('should call paginateType with overrideRequest if provided', async() => {
    const overrideRequest = jest.fn().mockResolvedValue({ page: [{ id: 'bar', name: 'Bar' }], total: 1 });
    const wrapper = shallowMount(ResourceLabeledSelect, {
      ...requiredSetup(),
      props: {
        resourceType:              'testResource',
        paginateMode:              RESOURCE_LABEL_SELECT_MODE.DYNAMIC,
        paginatedResourceSettings: { overrideRequest }
      }
    });

    const result = await wrapper.vm.paginateType({
      filter:      'bar',
      page:        1,
      pageSize:    10,
      pageContent: [],
      resetPage:   false
    });

    expect(overrideRequest).toHaveBeenCalledWith({
      filter:      'bar',
      page:        1,
      pageSize:    10,
      pageContent: [],
      resetPage:   false
    });
    expect(result.page[0].name).toBe('Bar');
  });

  it('should emit update:value when LabeledSelect emits update:value', async() => {
    const wrapper = shallowMount(ResourceLabeledSelect, {
      ...requiredSetup(),
      props: { resourceType: 'testResource' }
    });

    wrapper.findComponent(LabeledSelect).vm.$emit('update:value', 'baz');

    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')?.[0]).toStrictEqual(['baz']);
  });

  it('should only offer the paginate fn to LabeledSelect while actually paginating', async() => {
    // LabeledSelect's `canPaginate` re-enables server-side pagination whenever it is handed a
    // paginate fn for an SSP-registered type, so the wrapper must withhold it once it has decided
    // not to paginate (e.g. paginateMode ALL_RESOURCES) - otherwise the mapped `allOfType` options
    // are ignored in favour of raw pages.
    const wrapper = shallowMount(ResourceLabeledSelect, {
      ...requiredSetup(),
      props: { resourceType: 'testResource' }
    });

    await wrapper.setData({ paginate: false });
    // A withheld fn falls through to LabeledSelect's `paginate` prop default (null), which is what
    // switches its `canPaginate` off.
    expect(wrapper.findComponent(LabeledSelect).props('paginate')).toBeNull();

    await wrapper.setData({ paginate: true });
    expect(typeof wrapper.findComponent(LabeledSelect).props('paginate')).toBe('function');
  });

  it('should pass correct props and attrs to LabeledSelect', async() => {
    const wrapper = shallowMount(ResourceLabeledSelect, {
      ...requiredSetup(),
      props: {
        resourceType:         'testResource',
        allResourcesSettings: { labelSelectOptions: { placeholder: 'Select a resource' } }
      },
      attrs: { multiple: true }
    });

    const labeledSelect = wrapper.findComponent(LabeledSelect);

    expect(labeledSelect.attributes('placeholder')).toBe('Select a resource');
    expect(labeledSelect.attributes('multiple')).toBe('true');
  });
});
