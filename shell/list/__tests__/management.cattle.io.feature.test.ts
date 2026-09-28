import { shallowMount } from '@vue/test-utils';

jest.mock('@shell/mixins/resource-fetch', () => ({
  __esModule: true,
  default:    {
    data() {
      return {
        forceUpdateLiveAndDelayed: 0, loading: false, rows: []
      };
    },
    async $fetchType() {}
  }
}));

// eslint-disable-next-line import/first
import ManagementFeature from '@shell/list/management.cattle.io.feature.vue';

const createMockStore = () => ({
  getters: {
    'i18n/t':               (key: string) => key,
    'management/schemaFor': () => ({ resourceMethods: ['PUT'] }),
  },
  dispatch: jest.fn(),
});

const createWrapper = (rows: any[]) => {
  return shallowMount(ManagementFeature, {
    props: {
      resource: 'management.cattle.io.feature',
      schema:   { id: 'management.cattle.io.feature' } as any,
    },
    data:   () => ({ rows }),
    global: {
      mocks: {
        $store:      createMockStore(),
        $fetchState: { pending: false },
        $fetchType:  jest.fn(),
      },
      stubs: {
        // Render the cell:name slot directly so we can assert on the lock icon
        ResourceTable: {
          props:    ['rows'],
          template: '<div><slot name="cell:name" :row="rows[0]" /></div>',
        },
      },
    }
  });
};

describe('list/management.cattle.io.feature', () => {
  describe('locked icon rendering in cell:name slot', () => {
    it('should render the lock icon when status.lockedValue is not null', () => {
      const row = {
        metadata:    { name: 'feature-a' },
        nameDisplay: 'feature-a',
        status:      { lockedValue: true },
      };

      const wrapper = createWrapper([row]);

      expect(wrapper.find('i.icon-lock').exists()).toBe(true);
    });

    it('should not render the lock icon when status.lockedValue is null', () => {
      const row = {
        metadata:    { name: 'feature-a' },
        nameDisplay: 'feature-a',
        status:      { lockedValue: null },
      };

      const wrapper = createWrapper([row]);

      expect(wrapper.find('i.icon-lock').exists()).toBe(false);
    });

    it('should not throw and should not render the lock icon when status is missing (malformed feature flag)', () => {
      const row = {
        metadata:    { name: 'feature-a' },
        nameDisplay: 'feature-a',
      };

      expect(() => createWrapper([row])).not.toThrow();

      const wrapper = createWrapper([row]);

      expect(wrapper.find('i.icon-lock').exists()).toBe(false);
    });
  });

  describe('filteredRows', () => {
    it('should filter out hidden feature flags', () => {
      const rows = [
        { metadata: { name: 'fleet' } },
        { metadata: { name: 'some-feature' } },
      ];

      const wrapper = createWrapper(rows);

      const filtered = (wrapper.vm as any).filteredRows;

      expect(filtered).toHaveLength(1);
      expect(filtered[0].metadata.name).toBe('some-feature');
    });
  });
});
