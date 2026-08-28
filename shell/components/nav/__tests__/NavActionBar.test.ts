import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import NavActionBar from '@shell/components/nav/NavActionBar.vue';

// `push` resolves with undefined on success and with a NavigationFailure when the
// route doesn't change, so the return type is widened for the tests that do both.
const mockRouter = { push: jest.fn((): Promise<any> => Promise.resolve()) };

let activeNavItem: string | null = null;

let stored: string[] | null = null;
const mockHistory = {
  load: jest.fn(() => stored),
  save: jest.fn((value: string[]) => {
    stored = value;
  }),
};

const mockStore = { getters: { isExplorer: true, clusterId: 'c-test' } };

jest.mock('vuex', () => ({ useStore: () => mockStore }));
jest.mock('vue-router', () => ({ useRouter: () => mockRouter, useRoute: () => ({ path: '/current' }) }));
jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));
jest.mock('@shell/composables/useClusterLocalStorage', () => ({ useClusterLocalStorage: () => mockHistory }));

const shortNames = ref<Record<string, string[]>>({});

jest.mock('@shell/composables/useResourceShortNames', () => ({ useResourceShortNames: () => shortNames }));
jest.mock('@shell/utils/router', () => ({
  filterLocationValidParams: (_router: any, route: any) => route,
  isNavItemActive:           (_router: any, _to: any, navItem: any) => !!activeNavItem && navItem?.name === activeNavItem,
}));
jest.mock('@shell/utils/platform', () => ({ isMac: false }));

// A small nav tree mirroring the curated explorer groups: a root whose children
// sit at the top level, plus categorised groups.
const groups = [
  {
    name:     'root',
    isRoot:   true,
    children: [{
      name: 'node', label: 'Nodes', route: { name: 'node' }
    }]
  },
  {
    name:     'workloads',
    label:    'Workloads',
    children: [
      {
        name: 'pod', label: 'Pods', route: { name: 'pod' }
      },
      {
        name: 'apps.deployment', label: 'Deployments', route: { name: 'deployment' }
      },
    ]
  },
  {
    name:     'service-discovery',
    label:    'Service Discovery',
    children: [{
      name: 'service', label: 'Services', route: { name: 'service' }
    }]
  },
  {
    name:     'storage',
    label:    'Storage',
    children: [{
      name: 'configmap', label: 'ConfigMaps', route: { name: 'configmap' }
    }]
  },
];

const mountBar = (props: Record<string, any> = {}) => mount(NavActionBar, {
  props: {
    groups, hasExpandedGroup: false, ...props
  },
  global: {
    directives: { shortkey: {} },
    // Render the teleported dropdown inline so it can be queried from the wrapper.
    stubs:      { teleport: true },
  },
});

const labels = (wrapper: any) => wrapper.findAll('.jump-to-option .jump-to-option-label').map((n: any) => n.text());
const paths = (wrapper: any) => wrapper.findAll('.jump-to-option').map((n: any) => n.find('.jump-to-option-path').exists() ? n.find('.jump-to-option-path').text() : '');

describe('NavActionBar.vue', () => {
  beforeEach(() => {
    stored = null;
    activeNavItem = null;
    shortNames.value = {
      pod: ['po'], configmap: ['cm'], resourcequota: ['quota']
    };
    jest.clearAllMocks();
  });

  it('renders the jump-to input with the placeholder', () => {
    const wrapper = mountBar();

    expect(wrapper.find('.jump-to-input').attributes('placeholder')).toStrictEqual('%nav.jumpTo.placeholder%');
  });

  it('shows the hardcoded top 5 with their nav paths when there is no history', async() => {
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await nextTick();

    expect(labels(wrapper)).toStrictEqual(['Pods', 'Deployments', 'Services', 'ConfigMaps', 'Nodes']);
    // Nodes comes from the root group, so it has no path prefix.
    expect(paths(wrapper)).toStrictEqual(['Workloads', 'Workloads', 'Service Discovery', 'Storage', '']);
  });

  it('shows recently jumped-to sections (most recent first) when history exists', async() => {
    stored = ['configmap', 'service'];
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await nextTick();

    expect(labels(wrapper)).toStrictEqual(['ConfigMaps', 'Services']);
  });

  it('falls back to the first sections when neither history nor the top 5 exist', async() => {
    // Outside the explorer (Cluster Management, Fleet, ...) none of the
    // hardcoded top 5 are in the tree, so the dropdown must not open empty
    const custom = [
      {
        name:     'clusters',
        label:    'Clusters',
        children: [{
          name: 'provisioning.cluster', label: 'Clusters', route: { name: 'clusters' }
        }]
      },
      {
        name:     'credentials',
        label:    'Cloud Credentials',
        children: [{
          name: 'cloudcredential', label: 'Cloud Credentials', route: { name: 'creds' }
        }]
      },
    ];
    const wrapper = mountBar({ groups: custom });

    await wrapper.find('.jump-to-input').trigger('focus');
    await nextTick();

    expect(labels(wrapper)).toStrictEqual(['Clusters', 'Cloud Credentials']);
  });

  it('ignores stored history that is not a list of keys', async() => {
    stored = { pod: true } as any;
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await nextTick();

    expect(labels(wrapper)).toStrictEqual(['Pods', 'Deployments', 'Services', 'ConfigMaps', 'Nodes']);
  });

  it('matches and renders the plain label, not the escaped labelDisplay markup', async() => {
    const custom = [{
      name:     'workloads',
      label:    'Workloads',
      children: [{
        name: 'jobs', label: 'Jobs & CronJobs', labelDisplay: 'Jobs &amp; CronJobs', route: { name: 'jobs' }
      }]
    }];
    const wrapper = mountBar({ groups: custom });

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('& cron');
    await nextTick();

    expect(labels(wrapper)).toStrictEqual(['Jobs & CronJobs']);
  });

  it('heads the default list with the popular-resource-types hint', async() => {
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await nextTick();

    expect(wrapper.find('.jump-to-heading').text()).toStrictEqual('%nav.jumpTo.popularHeading%');
  });

  it('heads the history list with the last-used hint', async() => {
    stored = ['configmap'];
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await nextTick();

    expect(wrapper.find('.jump-to-heading').text()).toStrictEqual('%nav.jumpTo.recentHeading%');
  });

  it('highlights the first option as soon as the dropdown opens', async() => {
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await nextTick();

    const options = wrapper.findAll('.jump-to-option');

    expect(options[0].classes()).toContain('active');
    expect(options[1].classes()).not.toContain('active');
  });

  it('moves the highlight with the arrow keys', async() => {
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').trigger('keydown', { key: 'ArrowDown' });
    await nextTick();

    const options = wrapper.findAll('.jump-to-option');

    expect(options[0].classes()).not.toContain('active');
    expect(options[1].classes()).toContain('active');
  });

  it('shows no heading while searching', async() => {
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('config');
    await nextTick();

    expect(wrapper.find('.jump-to-heading').exists()).toBe(false);
  });

  it('ranks search matches by how early the query appears in the label, ties alphabetically', async() => {
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('s');
    await nextTick();

    // Best 's' index of label and type name: Service Discovery/Services/Storage(0,
    // alpha), Deployments(3, on 'apps.deployment') and Pods(3, alpha), Nodes(4),
    // Workloads(8), ConfigMaps(9). Groups are included.
    expect(labels(wrapper)).toStrictEqual([
      'Service Discovery', 'Services', 'Storage', 'Deployments', 'Pods', 'Nodes', 'Workloads', 'ConfigMaps'
    ]);
  });

  it('finds a section by its type name, as the search dialog it replaces did', async() => {
    const custom = [{
      name:     'cluster',
      label:    'Cluster',
      children: [{
        name: 'provisioning.cattle.io.cluster', label: 'Clusters', route: { name: 'clusters' }
      }]
    }];
    const wrapper = mountBar({ groups: custom });

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('provisioning.cattle');
    await nextTick();

    expect(labels(wrapper)).toStrictEqual(['Clusters']);
  });

  it('ranks a section on whichever of its label and type name matches earliest', async() => {
    const custom = [{
      name:     'storage',
      label:    'Storage',
      children: [
        {
          name: 'pod', label: 'Cluster Pods', route: { name: 'pod' }
        },
        {
          name: 'policy', label: 'Pod Security', route: { name: 'policy' }
        },
      ]
    }];
    const wrapper = mountBar({ groups: custom });

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('pod');
    await nextTick();

    // Both match at index 0 (one on its type name, one on its label), so the tie
    // is broken alphabetically
    expect(labels(wrapper)).toStrictEqual(['Cluster Pods', 'Pod Security']);
  });

  it('finds a type by its Kubernetes short name', async() => {
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('cm');
    await nextTick();

    expect(labels(wrapper)).toStrictEqual(['ConfigMaps']);
  });

  it('ranks a short name above an earlier text match', async() => {
    const custom = [{
      name:     'cluster',
      label:    'Cluster',
      children: [
        {
          name: 'resourcequota', label: 'Resource Quotas', route: { name: 'quota' }
        },
        {
          name: 'quotapolicy', label: 'Quota Policies', route: { name: 'quotapolicy' }
        },
      ]
    }];
    const wrapper = mountBar({ groups: custom });

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('quota');
    await nextTick();

    expect(labels(wrapper)).toStrictEqual(['Resource Quotas', 'Quota Policies']);
  });

  it('matches a short name whole, not as a prefix', async() => {
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('c');
    await nextTick();

    expect(labels(wrapper)[0]).toStrictEqual('ConfigMaps');
    expect(labels(wrapper)).toContain('Service Discovery');
  });

  it('picks up short names when discovery lands after the list is already open', async() => {
    shortNames.value = {};
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('cm');
    await nextTick();

    expect(wrapper.findAll('.jump-to-option')).toHaveLength(0);

    shortNames.value = { configmap: ['cm'] };
    await nextTick();

    expect(labels(wrapper)).toStrictEqual(['ConfigMaps']);
  });

  it('gives a nav entry the short names of the types it stands in for', async() => {
    const custom = [{
      name:     'cluster',
      label:    'Cluster',
      children: [{
        name:         'projects-namespaces',
        label:        'Projects/Namespaces',
        navResources: ['management.cattle.io.project', 'namespace'],
        route:        { name: 'projectsnamespaces' },
      }]
    }];

    shortNames.value = { namespace: ['ns'] };

    const wrapper = mountBar({ groups: custom });

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('ns');
    await nextTick();

    expect(labels(wrapper)).toStrictEqual(['Projects/Namespaces']);
  });

  it('does not repeat a short name claimed by both the entry and its resources', async() => {
    const custom = [{
      name:     'cluster',
      label:    'Cluster',
      children: [{
        name: 'namespace', label: 'Namespaces', navResources: ['namespace'], route: { name: 'namespace' }
      }]
    }];

    shortNames.value = { namespace: ['ns'] };

    const wrapper = mountBar({ groups: custom });

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('ns');
    await nextTick();

    expect(labels(wrapper)).toStrictEqual(['Namespaces']);
  });

  it('leaves types with no short name searchable by text alone', async() => {
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('service');
    await nextTick();

    expect(labels(wrapper)).toStrictEqual(['Service Discovery', 'Services']);
  });

  it('includes groups as options and jumps to a group\'s first section', async() => {
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('work');
    await nextTick();

    expect(labels(wrapper)).toStrictEqual(['Workloads']);

    await wrapper.findAll('.jump-to-option')[0].trigger('mousedown');
    await nextTick();

    // Workloads' first child is Pods, so the group jump lands there.
    expect(mockRouter.push).toHaveBeenCalledWith({ name: 'pod' });
    expect(mockHistory.save).toHaveBeenCalledWith(['workloads']);
  });

  it('does not move you when you jump to a group you are already inside', async() => {
    activeNavItem = 'apps.deployment';

    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('work');
    await nextTick();

    expect(labels(wrapper)).toStrictEqual(['Workloads']);

    await wrapper.findAll('.jump-to-option')[0].trigger('mousedown');
    await nextTick();

    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(wrapper.emitted('jumped')).toStrictEqual([[]]);
    expect(mockHistory.save).toHaveBeenCalledWith(['workloads']);
  });

  it('still navigates to a group that is merely open, rather than holding you', async() => {
    const custom = groups.map((group) => (group.name === 'workloads' ? { ...group, expanded: true } : group));

    activeNavItem = 'configmap';

    const wrapper = mountBar({ groups: custom });

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('work');
    await nextTick();

    await wrapper.findAll('.jump-to-option')[0].trigger('mousedown');
    await nextTick();

    expect(mockRouter.push).toHaveBeenCalledWith({ name: 'pod' });
  });

  it('holds you in a collapsed group you are inside, as well as an open one', async() => {
    const custom = groups.map((group) => (group.name === 'workloads' ? { ...group, expanded: false } : group));

    activeNavItem = 'apps.deployment';

    const wrapper = mountBar({ groups: custom });

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('work');
    await nextTick();

    await wrapper.findAll('.jump-to-option')[0].trigger('mousedown');
    await nextTick();

    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(wrapper.emitted('jumped')).toStrictEqual([[]]);
  });

  it('does not re-navigate to the section already on screen', async() => {
    activeNavItem = 'pod';

    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('pods');
    await nextTick();

    await wrapper.findAll('.jump-to-option')[0].trigger('mousedown');
    await nextTick();

    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(wrapper.emitted('jumped')).toStrictEqual([[]]);
  });

  it('shows only matching sections and an empty state for no matches', async() => {
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('config');
    await nextTick();

    expect(labels(wrapper)).toStrictEqual(['ConfigMaps']);

    await wrapper.find('.jump-to-input').setValue('zzz');
    await nextTick();

    expect(wrapper.findAll('.jump-to-option')).toHaveLength(0);
    expect(wrapper.find('.jump-to-empty').text()).toStrictEqual('%nav.jumpTo.noResults%');
  });

  it('navigates to the section and records it in history when a result is chosen', async() => {
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await nextTick();

    // First default option is Pods.
    await wrapper.findAll('.jump-to-option')[0].trigger('mousedown');
    await nextTick();

    expect(mockRouter.push).toHaveBeenCalledWith({ name: 'pod' });
    expect(mockHistory.save).toHaveBeenCalledWith(['pod']);
    expect(wrapper.emitted('jumped')).toStrictEqual([[]]);
  });

  it('reports the jump once the route has settled, even when it did not change', async() => {
    // Vue Router resolves a duplicated navigation with a NavigationFailure and
    // leaves `$route` untouched, so nothing downstream would fire afterwards.
    mockRouter.push.mockResolvedValueOnce({
      type: 16, from: {}, to: {}
    });

    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await nextTick();

    await wrapper.findAll('.jump-to-option')[0].trigger('mousedown');
    await nextTick();

    expect(wrapper.emitted('jumped')).toStrictEqual([[]]);
  });

  it('does not report a jump when the navigation is rejected', async() => {
    mockRouter.push.mockRejectedValueOnce(new Error('guard rejected'));

    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await nextTick();

    await wrapper.findAll('.jump-to-option')[0].trigger('mousedown');
    await nextTick();

    expect(wrapper.emitted('jumped')).toBeUndefined();
  });

  it('moves an existing history entry to the front without duplicating it', async() => {
    stored = ['service', 'pod'];
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await nextTick();

    // History order is Services, Pods; choose Pods (second option).
    await wrapper.findAll('.jump-to-option')[1].trigger('mousedown');
    await nextTick();

    expect(mockHistory.save).toHaveBeenCalledWith(['pod', 'service']);
  });

  it('excludes a group\'s overview child that repeats the group label, ignoring whitespace', async() => {
    const custom = [{
      name:     'workloads',
      label:    'Workloads',
      children: [
        {
          name: 'workload', label: ' Workloads ', route: { name: 'overview' }
        },
        {
          name: 'pod', label: 'Pods', route: { name: 'pod' }
        },
      ]
    }];
    const wrapper = mountBar({ groups: custom });

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('workload');
    await nextTick();

    // The padded " Workloads " overview child is dropped; only the group remains.
    expect(labels(wrapper)).toStrictEqual(['Workloads']);
  });

  it('hides the collapse-all control until a group is expanded', async() => {
    const wrapper = mountBar({ hasExpandedGroup: false });

    expect(wrapper.find('.collapse-all-btn').exists()).toBe(false);

    await wrapper.setProps({ hasExpandedGroup: true });

    expect(wrapper.find('.collapse-all-btn').exists()).toBe(true);
  });

  it('draws the collapse-all control with the shared icon font glyph', () => {
    const wrapper = mountBar({ hasExpandedGroup: true });

    expect(wrapper.find('.collapse-all-btn .icon').classes()).toContain('icon-collapse-all');
  });

  it('emits collapse-all when the collapse-all control is clicked', async() => {
    const wrapper = mountBar({ hasExpandedGroup: true });

    await wrapper.find('.collapse-all-btn').trigger('click');

    expect(wrapper.emitted('collapse-all')).toHaveLength(1);
  });

  it('reopens the dropdown when typing resumes after escape', async() => {
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('pod');
    await wrapper.find('.jump-to-input').trigger('keydown', { key: 'Escape' });
    await nextTick();

    expect(wrapper.find('#jump-to-listbox').exists()).toBe(false);

    await wrapper.find('.jump-to-input').setValue('config');
    await nextTick();

    expect(labels(wrapper)).toStrictEqual(['ConfigMaps']);
  });

  it('reopens the dropdown when arrowing after escape', async() => {
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').trigger('keydown', { key: 'Escape' });
    await nextTick();

    expect(wrapper.find('#jump-to-listbox').exists()).toBe(false);

    await wrapper.find('.jump-to-input').trigger('keydown', { key: 'ArrowDown' });
    await nextTick();

    expect(wrapper.find('#jump-to-listbox').exists()).toBe(true);
    expect(wrapper.findAll('.jump-to-option')[0].classes()).toContain('active');
  });

  it('does nothing on enter while the list is closed', async() => {
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('pod');
    await wrapper.find('.jump-to-input').trigger('keydown', { key: 'Escape' });
    await nextTick();

    await wrapper.find('.jump-to-input').trigger('keydown', { key: 'Enter' });
    await nextTick();

    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(wrapper.emitted('jumped')).toBeUndefined();
  });

  it('picks the highlighted option on enter while the list is open', async() => {
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await nextTick();

    await wrapper.find('.jump-to-input').trigger('keydown', { key: 'Enter' });
    await nextTick();

    expect(mockRouter.push).toHaveBeenCalledWith({ name: 'pod' });
  });

  it('closes the dropdown and clears the query on escape', async() => {
    const wrapper = mountBar();

    await wrapper.find('.jump-to-input').trigger('focus');
    await wrapper.find('.jump-to-input').setValue('pod');
    await nextTick();
    expect(wrapper.find('#jump-to-listbox').exists()).toBe(true);

    await wrapper.find('.jump-to-input').trigger('keydown', { key: 'Escape' });
    await nextTick();

    expect(wrapper.find('#jump-to-listbox').exists()).toBe(false);
    expect((wrapper.find('.jump-to-input').element as HTMLInputElement).value).toStrictEqual('');
  });
});
