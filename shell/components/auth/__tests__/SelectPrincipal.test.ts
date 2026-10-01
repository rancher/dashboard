import { shallowMount, type VueWrapper } from '@vue/test-utils';
import SelectPrincipal from '@shell/components/auth/SelectPrincipal.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';

describe('component: SelectPrincipal', () => {
  const mockStore = { dispatch: jest.fn().mockResolvedValue([]) };

  const defaultMountOptions = {
    global: {
      mocks: {
        $fetchState: { pending: false },
        $store:      mockStore,
        t:           (key: string, opts?: any) => opts?.count ? `${ key } ${ opts.count }` : key,
      },
      stubs: {
        LabeledSelect: {
          template: '<div class="labeled-select-stub"><slot name="no-options" :searching="searching" /></div>',
          props:    ['options', 'searchable', 'filterable'],
          data() {
            return { searching: false };
          }
        },
        Principal: true,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.dispatch.mockResolvedValue([]);
  });

  describe('onSearch', () => {
    it('should set hasSearchTooShort to true when search string is less than minSearchLength', async() => {
      const wrapper: VueWrapper<any> = shallowMount(SelectPrincipal, defaultMountOptions);

      // Set principals to an empty array to avoid null errors
      wrapper.vm.principals = [];
      await wrapper.vm.$nextTick();

      const loadingFn = jest.fn();

      wrapper.vm.onSearch('a', loadingFn);

      expect(wrapper.vm.hasSearchTooShort).toBe(true);
      expect(wrapper.vm.options).toStrictEqual([]);
      expect(loadingFn).toHaveBeenCalledWith(false);
    });

    it('should set hasSearchTooShort to false when search string meets minSearchLength', async() => {
      const wrapper: VueWrapper<any> = shallowMount(SelectPrincipal, defaultMountOptions);

      wrapper.vm.principals = [];
      await wrapper.vm.$nextTick();

      const loadingFn = jest.fn();

      wrapper.vm.onSearch('ab', loadingFn);

      expect(wrapper.vm.hasSearchTooShort).toBe(false);
      expect(loadingFn).toHaveBeenCalledWith(true);
    });

    it('should set hasSearchTooShort to false when search string is empty', async() => {
      const wrapper: VueWrapper<any> = shallowMount(SelectPrincipal, defaultMountOptions);

      wrapper.vm.principals = [];
      await wrapper.vm.$nextTick();

      // First set hasSearchTooShort to true
      wrapper.vm.hasSearchTooShort = true;

      const loadingFn = jest.fn();

      wrapper.vm.onSearch('', loadingFn);

      expect(wrapper.vm.hasSearchTooShort).toBe(false);
    });

    it('should not call debouncedSearch when search string is too short', async() => {
      const wrapper: VueWrapper<any> = shallowMount(SelectPrincipal, defaultMountOptions);

      wrapper.vm.principals = [];
      await wrapper.vm.$nextTick();

      // Spy on the debounced search
      const debouncedSearchSpy = jest.spyOn(wrapper.vm, 'debouncedSearch');
      const loadingFn = jest.fn();

      wrapper.vm.onSearch('x', loadingFn);

      expect(debouncedSearchSpy).not.toHaveBeenCalled();
    });

    it('should call debouncedSearch when search string meets minimum length', async() => {
      const wrapper: VueWrapper<any> = shallowMount(SelectPrincipal, defaultMountOptions);

      wrapper.vm.principals = [];
      await wrapper.vm.$nextTick();

      const debouncedSearchSpy = jest.spyOn(wrapper.vm, 'debouncedSearch');
      const loadingFn = jest.fn();

      wrapper.vm.onSearch('xy', loadingFn);

      expect(debouncedSearchSpy).toHaveBeenCalledWith('xy', loadingFn);
    });
  });

  // Results are drawn on the body, which is behind anything that stacks above
  // it, so somewhere like a slide in panel has to keep them in place.
  describe('where the results are drawn', () => {
    const mountWithProps = (props: Record<string, unknown>) => shallowMount(SelectPrincipal, {
      ...defaultMountOptions,
      props,
      global: { ...defaultMountOptions.global, stubs: { Principal: true } },
    });

    it.each([
      ['on the body by default', {}, true],
      ['in place when asked to', { appendToBody: false }, false],
    ])('should draw them %s', (_case, props, expected) => {
      const wrapper: VueWrapper<any> = mountWithProps(props);

      expect(wrapper.findComponent(LabeledSelect).props('appendToBody')).toBe(expected);
    });

    // Results on the body are sized by the positioner that places them, results
    // left in place have to be sized against the search.
    it.each([
      ['leave the width of results on the body alone', {}, false],
      ['give results kept in place the width of the search', { appendToBody: false }, true],
    ])('should %s', (_case, props, expected) => {
      const wrapper: VueWrapper<any> = mountWithProps(props);

      expect(wrapper.findComponent(LabeledSelect).classes().includes('results-in-place')).toBe(expected);
    });
  });

  describe('minSearchLength', () => {
    it('should have a default minSearchLength of 2', async() => {
      const wrapper: VueWrapper<any> = shallowMount(SelectPrincipal, defaultMountOptions);

      wrapper.vm.principals = [];
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.minSearchLength).toBe(2);
    });
  });
});
