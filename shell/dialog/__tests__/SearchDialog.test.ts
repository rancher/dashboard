import { shallowMount, VueWrapper } from '@vue/test-utils';
import SearchDialog from '@shell/dialog/SearchDialog.vue';
import { KEY } from '@shell/utils/platform';

const t = (key: string): string => key;

// Renders each group child the same way nav/Type.vue does, so the dialog's
// keyboard navigation can be exercised against a realistic DOM
const GroupStub = {
  props:    ['group'],
  emits:    ['close'],
  template: `
    <ul>
      <li
        v-for="c in group.children"
        :key="c.name"
        class="child nav-type"
      >
        <a
          class="type-link"
          href="#"
          @click.prevent="$emit('close')"
        >{{ c.label }}</a>
      </li>
    </ul>
  `,
};

describe('component: SearchDialog', () => {
  let wrapper: VueWrapper<any>;

  const createMockGroups = () => [
    {
      name:     'workload',
      label:    'Workload',
      children: [
        {
          name: 'apps.deployment', label: 'Deployments', route: { name: 'c-cluster-product-resource' }
        },
        {
          name: 'pod', label: 'Pods', route: { name: 'c-cluster-product-resource' }
        },
      ],
    },
    {
      name:     'storage',
      label:    'Storage',
      children: [
        {
          name: 'persistentvolume', label: 'PersistentVolumes', route: { name: 'c-cluster-product-resource' }
        },
      ],
    },
  ];

  const mountComponent = async(groups = createMockGroups()) => {
    const store = {
      getters: {
        clusterId:           'local',
        productId:           'explorer',
        currentProduct:      { inStore: 'cluster' },
        'type-map/allTypes': jest.fn().mockReturnValue({}),
        'type-map/getTree':  jest.fn().mockReturnValue(groups),
        'cluster/all':       jest.fn().mockReturnValue([]),
        'cluster/canList':   jest.fn().mockReturnValue(true),
      },
    };

    const mounted = shallowMount(SearchDialog, {
      attachTo: document.body,
      global:   {
        mocks: {
          $store: store,
          t,
        },
        stubs: { Group: GroupStub },
      },
    });

    // The results list renders after the initial updateMatches() from mounted()
    await mounted.vm.$nextTick();

    return mounted;
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('should focus the input on mount', async() => {
    wrapper = await mountComponent();

    expect(document.activeElement).toBe(wrapper.find('input').element);
  });

  it('should close on Escape in the input', async() => {
    wrapper = await mountComponent();

    await wrapper.find('input').trigger('keyup.esc');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  describe('arrow key navigation', () => {
    it('should focus the first result on Down from the input', async() => {
      wrapper = await mountComponent();

      await wrapper.find('input').trigger('keydown', { keyCode: KEY.DOWN });

      const links = wrapper.findAll('a.type-link');

      expect(document.activeElement).toBe(links[0].element);
    });

    it('should focus the last result on Up from the input', async() => {
      wrapper = await mountComponent();

      await wrapper.find('input').trigger('keydown', { keyCode: KEY.UP });

      const links = wrapper.findAll('a.type-link');

      expect(document.activeElement).toBe(links[links.length - 1].element);
    });

    it('should move focus to the next result on Down, across groups', async() => {
      wrapper = await mountComponent();

      const links = wrapper.findAll('a.type-link');

      await wrapper.find('input').trigger('keydown', { keyCode: KEY.DOWN });
      await links[0].trigger('keydown', { keyCode: KEY.DOWN });

      expect(document.activeElement).toBe(links[1].element);

      // Third result lives in the second group
      await links[1].trigger('keydown', { keyCode: KEY.DOWN });

      expect(document.activeElement).toBe(links[2].element);
    });

    it('should wrap to the first result on Down from the last result', async() => {
      wrapper = await mountComponent();

      const links = wrapper.findAll('a.type-link');

      links[links.length - 1].element.focus();
      await links[links.length - 1].trigger('keydown', { keyCode: KEY.DOWN });

      expect(document.activeElement).toBe(links[0].element);
    });

    it('should wrap to the last result on Up from the first result', async() => {
      wrapper = await mountComponent();

      const links = wrapper.findAll('a.type-link');

      links[0].element.focus();
      await links[0].trigger('keydown', { keyCode: KEY.UP });

      expect(document.activeElement).toBe(links[links.length - 1].element);
    });

    it('should do nothing on Down when there are no results', async() => {
      wrapper = await mountComponent([]);

      const input = wrapper.find('input');

      await input.trigger('keydown', { keyCode: KEY.DOWN });

      expect(document.activeElement).toBe(input.element);
    });
  });

  describe('opening a result', () => {
    it('should open the first result on Enter in the input', async() => {
      wrapper = await mountComponent();

      const firstLink = wrapper.find('a.type-link');
      const click = jest.spyOn(firstLink.element, 'click');

      await wrapper.find('input').trigger('keydown', { keyCode: KEY.CR });

      expect(click).toHaveBeenCalledWith();
    });

    it('should do nothing on Enter in the input when there are no results', async() => {
      wrapper = await mountComponent([]);

      await wrapper.find('input').trigger('keydown', { keyCode: KEY.CR });

      expect(wrapper.emitted('close')).toBeUndefined();
    });
  });

  describe('keyboard interaction within the results', () => {
    it('should close on Escape when a result is focused', async() => {
      wrapper = await mountComponent();

      const firstLink = wrapper.find('a.type-link');

      firstLink.element.focus();
      await firstLink.trigger('keydown', { keyCode: KEY.ESCAPE });

      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it.each([
      ['a', 65],
      ['Backspace', 8],
    ])('should return focus to the input when "%s" is pressed on a result', async(key, keyCode) => {
      wrapper = await mountComponent();

      const firstLink = wrapper.find('a.type-link');

      firstLink.element.focus();
      await firstLink.trigger('keydown', { key, keyCode });

      expect(document.activeElement).toBe(wrapper.find('input').element);
    });

    it('should not steal focus from a result when a modifier combination is pressed', async() => {
      wrapper = await mountComponent();

      const firstLink = wrapper.find('a.type-link');

      firstLink.element.focus();
      await firstLink.trigger('keydown', {
        key: 'c', keyCode: 67, ctrlKey: true,
      });

      expect(document.activeElement).toBe(firstLink.element);
    });
  });
});
