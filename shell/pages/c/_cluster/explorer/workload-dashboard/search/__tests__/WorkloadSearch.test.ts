import { defineComponent, ref } from 'vue';
import { shallowMount } from '@vue/test-utils';
import WorkloadSearch from '@shell/pages/c/_cluster/explorer/workload-dashboard/search/WorkloadSearch.vue';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import type { WorkloadSearchOption } from '@shell/pages/c/_cluster/explorer/workload-dashboard/search/types';

const mockLoading = ref(false);
const mockOptions = ref<WorkloadSearchOption[]>([]);
const mockOnSearch = jest.fn();
const mockOnSelect = jest.fn();
const mockForceOpen = jest.fn();
const mockForceClose = jest.fn();

jest.mock('@shell/pages/c/_cluster/explorer/workload-dashboard/search/useWorkloadSearch', () => ({
  useWorkloadSearch: () => ({
    loading:  mockLoading,
    options:  mockOptions,
    onSearch: mockOnSearch,
    onSelect: mockOnSelect,
  }),
}));

jest.mock('vuex', () => ({
  ...jest.requireActual('vuex'),
  useStore: () => ({}),
}));

jest.mock('vue-router', () => ({
  ...jest.requireActual('vue-router'),
  useRouter: () => ({ resolve: (route: { params: { resource: string } }) => ({ href: `/list/${ route.params.resource }` }) }),
}));

const mockT = (key: string, args?: Record<string, any>) => (args ? `${ key }:${ JSON.stringify(args) }` : key);

jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: mockT }) }));

// Renders each option through the component's #option slot (and #no-options when
// there are none) so the row markup and its handlers can be exercised directly.
const LabeledSelectStub = defineComponent({
  name:  'LabeledSelect',
  props: {
    options:          { type: Array, default: () => [] },
    selectable:       { type: Function, default: undefined },
    reduce:           { type: Function, default: undefined },
    appendToBody:     { type: Boolean, default: true },
    filterable:       { type: Boolean, default: true },
    searchable:       { type: Boolean, default: false },
    optionKey:        { type: String, default: undefined },
    placeholder:      { type: String, default: undefined },
    visibleRows:      { type: Number, default: undefined },
    visibleRowHeight: { type: Number, default: undefined },
  },
  emits: ['search', 'update:value', 'on-blur'],
  data() {
    return { search: '' };
  },
  methods: {
    forceOpen(searchText: string) {
      mockForceOpen(searchText);
    },
    forceClose() {
      mockForceClose();
    },
  },
  template: `
    <div>
      <div v-for="option in options" :key="option.uniqueId" class="option-wrapper">
        <slot name="option" v-bind="option" />
      </div>
      <slot v-if="!options.length" name="no-options" :search="search" />
    </div>
  `,
});

const navigateToNamespace = jest.fn();
const resourceRoute = jest.fn((type: string, stateNames?: string[], nameFilter?: string) => ({
  name: 'list', params: { resource: type }, query: { nameFilter }
}));

function makeResult(name: string, overrides: Partial<WorkloadSearchOption> = {}): WorkloadSearchOption {
  return {
    label:     name,
    uniqueId:  `apps.deployment/default/${ name }`,
    namespace: 'default',
    value:     { name: 'detail', params: { id: name } },
    color:     'success' as any,
    resource:  {
      id: `default/${ name }`, type: 'apps.deployment', restartCount: 3, creationTimestamp: '2026-01-01T00:00:00Z'
    },
    ...overrides,
  };
}

const groupOption = (type: string): WorkloadSearchOption => ({
  kind: 'group', label: `${ type } (2)`, uniqueId: `group-${ type }`
});

const moreOption: WorkloadSearchOption = {
  kind:         'more',
  label:        '+3 more',
  uniqueId:     'more-apps.deployment',
  resourceType: 'apps.deployment',
  searchTerm:   'nginx',
};

function createWrapper() {
  return shallowMount(WorkloadSearch, {
    props:  { navigateToNamespace, resourceRoute },
    global: {
      stubs: { LabeledSelect: LabeledSelectStub },
      // Overrides the global `t` mock from jest.setup.js, which would otherwise shadow useI18n's
      mocks: { t: mockT },
    },
  });
}

describe('component: WorkloadSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoading.value = false;
    mockOptions.value = [];
  });

  describe('labeledSelect configuration', () => {
    it('should keep the dropdown in place so its height can be limited', () => {
      const wrapper = createWrapper();

      expect(wrapper.findComponent(LabeledSelectStub).props('appendToBody')).toBe(false);
    });

    it('should leave filtering to the server', () => {
      const wrapper = createWrapper();

      expect(wrapper.findComponent(LabeledSelectStub).props('filterable')).toBe(false);
    });

    it('should key options by their unique id', () => {
      const wrapper = createWrapper();

      expect(wrapper.findComponent(LabeledSelectStub).props('optionKey')).toStrictEqual('uniqueId');
    });

    it('should pass the search options through', () => {
      mockOptions.value = [groupOption('apps.deployment'), makeResult('nginx')];
      const wrapper = createWrapper();

      expect(wrapper.findComponent(LabeledSelectStub).props('options')).toStrictEqual(mockOptions.value);
    });

    it.each([
      ['a result', makeResult('nginx'), true],
      ['a group header', groupOption('apps.deployment'), false],
      ['a "more" row', moreOption, true],
    ])('should treat %s as selectable: %s', (_, option, expected) => {
      const wrapper = createWrapper();
      const selectable = wrapper.findComponent(LabeledSelectStub).props('selectable') as (o: WorkloadSearchOption) => boolean;

      expect(selectable(option)).toBe(expected);
    });
  });

  describe('searching and selecting', () => {
    it('should search when the search text changes', () => {
      const wrapper = createWrapper();

      wrapper.findComponent(LabeledSelectStub).vm.$emit('search', 'nginx');

      expect(mockOnSearch).toHaveBeenCalledWith('nginx');
    });

    it('should search with an empty term when the search text is cleared', () => {
      const wrapper = createWrapper();

      wrapper.findComponent(LabeledSelectStub).vm.$emit('search', '');

      expect(mockOnSearch).toHaveBeenCalledWith('');
    });

    it('should navigate to the selected route', () => {
      const wrapper = createWrapper();
      const route = { name: 'detail', params: { id: 'nginx' } };

      wrapper.findComponent(LabeledSelectStub).vm.$emit('update:value', route);

      expect(mockOnSelect).toHaveBeenCalledWith(route);
    });
  });

  describe('group header rows', () => {
    it('should render the group label', () => {
      mockOptions.value = [groupOption('apps.deployment')];
      const wrapper = createWrapper();

      expect(wrapper.find('.group-label').text()).toStrictEqual('apps.deployment (2)');
    });

    it('should only mark the first group header as first', () => {
      mockOptions.value = [
        groupOption('apps.deployment'),
        makeResult('nginx'),
        groupOption('pod'),
      ];
      const wrapper = createWrapper();

      const labels = wrapper.findAll('.group-label');

      expect(labels.map((label) => label.classes('group-label--first'))).toStrictEqual([true, false]);
    });
  });

  describe('"more" rows', () => {
    const reduce = (wrapper: ReturnType<typeof createWrapper>) => wrapper.findComponent(LabeledSelectStub).props('reduce') as (o: WorkloadSearchOption) => any;

    it('should render the "more" label', () => {
      mockOptions.value = [moreOption];
      const wrapper = createWrapper();

      expect(wrapper.find('.option-wrapper > .more-link').text()).toStrictEqual('+3 more');
    });

    it('should render the "more" row as a link to the type list filtered by the search term', () => {
      mockOptions.value = [moreOption];
      const wrapper = createWrapper();

      const link = wrapper.find('.option-wrapper > .more-link');

      expect(link.element.tagName).toStrictEqual('A');
      expect(link.attributes('href')).toStrictEqual('/list/apps.deployment');
    });

    it('should not render an href when the "more" row has no resource type', () => {
      mockOptions.value = [{ ...moreOption, resourceType: undefined }];
      const wrapper = createWrapper();

      expect(wrapper.find('.option-wrapper > .more-link').attributes('href')).toBeUndefined();
    });

    it('should not follow the "more" link href when clicked', () => {
      mockOptions.value = [moreOption];
      const wrapper = createWrapper();
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });

      wrapper.find('.option-wrapper > .more-link').element.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it('should let the "more" link click reach the select, so it selects the option', () => {
      mockOptions.value = [moreOption];
      const wrapper = createWrapper();
      const parentClick = jest.fn();

      wrapper.find('.option-wrapper').element.addEventListener('click', parentClick);
      wrapper.find('.option-wrapper > .more-link').element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

      expect(parentClick).toHaveBeenCalledTimes(1);
    });

    it('should select the type list filtered by the search term', () => {
      const wrapper = createWrapper();

      expect(reduce(wrapper)(moreOption)).toStrictEqual({
        name: 'list', params: { resource: 'apps.deployment' }, query: { nameFilter: 'nginx' }
      });
      expect(resourceRoute).toHaveBeenCalledWith('apps.deployment', undefined, 'nginx');
    });

    it('should select nothing when the row has no resource type', () => {
      const wrapper = createWrapper();

      expect(reduce(wrapper)({ ...moreOption, resourceType: undefined })).toBeUndefined();
    });

    it('should select the detail page for a result', () => {
      const wrapper = createWrapper();
      const result = makeResult('nginx');

      expect(reduce(wrapper)(result)).toStrictEqual(result.value);
    });
  });

  describe('result rows', () => {
    it('should render the result name', () => {
      mockOptions.value = [makeResult('nginx')];
      const wrapper = createWrapper();

      expect(wrapper.find('.name').text()).toStrictEqual('nginx');
    });

    it('should render the restart count for a pod', () => {
      mockOptions.value = [makeResult('nginx', {
        resource: {
          id: 'default/nginx', type: 'pod', restartCount: 3
        }
      })];
      const wrapper = createWrapper();

      expect(wrapper.find('.restarts').text()).toStrictEqual('workloadDashboard.search.restarts:{"count":3}');
    });

    it('should render zero restarts when a pod has no restart count', () => {
      mockOptions.value = [makeResult('nginx', { resource: { id: 'default/nginx', type: 'pod' } })];
      const wrapper = createWrapper();

      expect(wrapper.find('.restarts').text()).toStrictEqual('workloadDashboard.search.restarts:{"count":0}');
    });

    it('should not render a restart count for a non-pod workload', () => {
      mockOptions.value = [makeResult('nginx')];
      const wrapper = createWrapper();

      expect(wrapper.find('.restarts').text()).toStrictEqual('');
    });

    it('should render the age from the creation timestamp', () => {
      mockOptions.value = [makeResult('nginx')];
      const wrapper = createWrapper();

      expect(wrapper.find('.age').attributes('value')).toStrictEqual('2026-01-01T00:00:00Z');
    });

    it('should render a state dot when the result has a color', () => {
      mockOptions.value = [makeResult('nginx')];
      const wrapper = createWrapper();

      expect(wrapper.find('.state-dot').exists()).toBe(true);
    });

    it('should not render a state dot when the result has no color', () => {
      mockOptions.value = [makeResult('nginx', { color: undefined })];
      const wrapper = createWrapper();

      expect(wrapper.find('.state-dot').exists()).toBe(false);
    });

    it('should render the namespace as a link', () => {
      mockOptions.value = [makeResult('nginx')];
      const wrapper = createWrapper();

      const namespace = wrapper.find('.namespace');

      expect(namespace.element.tagName).toStrictEqual('A');
      expect(namespace.text()).toStrictEqual('default');
      expect(namespace.classes()).toContain('more-link');
    });

    it('should link the namespace to the list page of the result type', () => {
      mockOptions.value = [makeResult('nginx')];
      const wrapper = createWrapper();

      expect(wrapper.find('.namespace').attributes('href')).toStrictEqual('/list/apps.deployment');
      expect(resourceRoute).toHaveBeenCalledWith('apps.deployment');
    });

    it('should not follow the namespace link href when clicked', async() => {
      mockOptions.value = [makeResult('nginx')];
      const wrapper = createWrapper();
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });

      wrapper.find('.namespace').element.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it('should render an empty, non-link namespace for a cluster-scoped result', () => {
      mockOptions.value = [makeResult('nginx', { namespace: undefined })];
      const wrapper = createWrapper();

      const namespace = wrapper.find('.namespace');

      expect(namespace.text()).toStrictEqual('');
      expect(namespace.classes()).not.toContain('more-link');
    });

    it('should navigate to the type list filtered by namespace when the namespace is clicked', async() => {
      mockOptions.value = [makeResult('nginx')];
      const wrapper = createWrapper();

      await wrapper.find('.namespace').trigger('click');

      expect(navigateToNamespace).toHaveBeenCalledWith('apps.deployment', 'default');
    });

    it('should stop the namespace click reaching the select', async() => {
      mockOptions.value = [makeResult('nginx')];
      const wrapper = createWrapper();
      const parentClick = jest.fn();

      wrapper.find('.option-wrapper').element.addEventListener('click', parentClick);
      await wrapper.find('.namespace').trigger('click');

      expect(parentClick).not.toHaveBeenCalled();
    });

    it('should show the namespace as plain text when the result has no resource type', () => {
      mockOptions.value = [makeResult('nginx', { resource: { id: 'default/nginx' } })];
      const wrapper = createWrapper();

      const namespace = wrapper.find('.namespace');

      expect(namespace.element.tagName).toStrictEqual('SPAN');
      expect(namespace.text()).toStrictEqual('default');
    });

    it('should not navigate when the namespace is clicked on a result without a resource type', async() => {
      mockOptions.value = [makeResult('nginx', { resource: { id: 'default/nginx' } })];
      const wrapper = createWrapper();

      await wrapper.find('.namespace').trigger('click');

      expect(navigateToNamespace).not.toHaveBeenCalled();
    });

    it('should give the action menu the result resource', () => {
      const result = makeResult('nginx');

      mockOptions.value = [result];
      const wrapper = createWrapper();

      expect(wrapper.findComponent(ActionMenu).props('resource')).toStrictEqual(result.resource);
    });

    it('should render the action menu outside the dropdown so it is not clipped', () => {
      mockOptions.value = [makeResult('nginx')];
      const wrapper = createWrapper();

      expect(wrapper.findComponent(ActionMenu).props('container')).toStrictEqual('body');
    });

    it('should label the action menu button with the resource id', () => {
      mockOptions.value = [makeResult('nginx')];
      const wrapper = createWrapper();

      expect(wrapper.findComponent(ActionMenu).props('buttonAriaLabel')).toStrictEqual('sortableTable.tableActionsLabel:{"resource":"default/nginx"}');
    });

    it('should stop the action menu click reaching the select', async() => {
      mockOptions.value = [makeResult('nginx')];
      const wrapper = createWrapper();
      const parentClick = jest.fn();

      wrapper.find('.option-wrapper').element.addEventListener('click', parentClick);
      await wrapper.find('.actions').trigger('click');

      expect(parentClick).not.toHaveBeenCalled();
    });
  });

  describe('keeping the dropdown open while the action menu is used', () => {
    it('should reopen the dropdown with the last search term when opening the action menu blurs the search', async() => {
      mockOptions.value = [makeResult('nginx')];
      const wrapper = createWrapper();
      const select = wrapper.findComponent(LabeledSelectStub);

      select.vm.$emit('search', 'nginx');
      await wrapper.find('.actions').trigger('click');
      select.vm.$emit('on-blur');

      expect(mockForceOpen).toHaveBeenCalledWith('nginx');
    });

    it('should keep the last non-empty search term when vue-select clears the search on blur', async() => {
      mockOptions.value = [makeResult('nginx')];
      const wrapper = createWrapper();
      const select = wrapper.findComponent(LabeledSelectStub);

      select.vm.$emit('search', 'nginx');
      select.vm.$emit('search', '');
      await wrapper.find('.actions').trigger('click');
      select.vm.$emit('on-blur');

      expect(mockForceOpen).toHaveBeenCalledWith('nginx');
    });

    it('should not reopen the dropdown on a blur unrelated to the action menu', () => {
      const wrapper = createWrapper();

      wrapper.findComponent(LabeledSelectStub).vm.$emit('on-blur');

      expect(mockForceOpen).not.toHaveBeenCalled();
    });

    it('should only reopen the dropdown on the first blur after opening the action menu', async() => {
      mockOptions.value = [makeResult('nginx')];
      const wrapper = createWrapper();
      const select = wrapper.findComponent(LabeledSelectStub);

      select.vm.$emit('search', 'nginx');
      await wrapper.find('.actions').trigger('click');
      select.vm.$emit('on-blur');
      select.vm.$emit('on-blur');

      expect(mockForceOpen).toHaveBeenCalledTimes(1);
    });

    it('should close the dropdown once an action is invoked', () => {
      mockOptions.value = [makeResult('nginx')];
      const wrapper = createWrapper();

      wrapper.findComponent(ActionMenu).vm.$emit('action-invoked');

      expect(mockForceClose).toHaveBeenCalledWith();
    });
  });

  describe('no options message', () => {
    it('should show the searching message while loading', () => {
      mockLoading.value = true;
      const wrapper = createWrapper();

      expect(wrapper.text()).toStrictEqual('workloadDashboard.search.searching');
    });

    it('should show the no match message when a search returned nothing', async() => {
      const wrapper = createWrapper();

      await wrapper.findComponent(LabeledSelectStub).setData({ search: 'nginx' });

      expect(wrapper.text()).toStrictEqual('labelSelect.noOptions.noMatch');
    });

    it('should prompt to start typing when there is no search text', () => {
      const wrapper = createWrapper();

      expect(wrapper.text()).toStrictEqual('workloadDashboard.search.startTyping');
    });
  });
});
