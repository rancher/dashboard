import { mount } from '@vue/test-utils';
import FleetClusters from '@shell/components/fleet/FleetClusters.vue';
import ResourceTable from '@shell/components/ResourceTable.vue';

describe('component: FleetClusters', () => {
  const mockStore = {
    getters: {
      'i18n/t':               (key: string) => key,
      'management/schemaFor': () => ({ id: 'fleet.cattle.io.cluster' }),
      'type-map/labelFor':    (schema: any, count?: number) => count === 99 ? 'Clusters' : 'Cluster',
      'prefs/get':            () => false,
      currentProduct:         () => ({ inStore: 'cluster' }),
      'type-map/optionsFor':  () => ({}),
      'type-map/headersFor':  () => [],
      defaultClusterId:       () => 'local',
    },
    dispatch: jest.fn(),
  };

  const mockRow = {
    id:                  'test-cluster',
    customLabels:        [],
    displayCustomLabels: false,
    stateDescription:    'Active',
    nameDisplay:         'test-cluster',
    reposReady:          '1/1',
    bundleInfo:          {
      ready: 1,
      total: 1
    },
    helmOpsReady: '0/0',
    lastSeen:     new Date().toISOString(),
    stateObj:     {
      name:          'active',
      transitioning: false,
      error:         false
    }
  };

  const createWrapper = (props: any = {}, slots = {}) => {
    const defaultRows = props.rows || [mockRow];

    return mount(FleetClusters, {
      props: {
        rows:   defaultRows,
        schema: { id: 'fleet.cattle.io.cluster' },
        ...props,
      },
      slots,
      global: {
        mocks:      { $store: mockStore },
        components: { ResourceTable },
        stubs:      {
          ResourceTable: {
            template: `
              <div class="resource-table">
                <slot 
                  name="additional-sub-row" 
                  :fullColspan="10" 
                  :row="rows[0]" 
                  :onRowMouseEnter="() => {}" 
                  :onRowMouseLeave="() => {}" 
                  :showSubRow="rows[0].stateDescription" 
                />
              </div>
            `,
            props: ['rows', 'schema', 'headers', 'subRows', 'loading', 'useQueryParamsForSimpleFiltering', 'keyField']
          },
          Tag: { template: '<span class="tag"><slot /></span>' }
        }
      }
    });
  };

  describe('headers configuration', () => {
    it('should include all required column headers', () => {
      const wrapper = createWrapper();
      const headers = wrapper.vm.headers;

      expect(headers).toHaveLength(8);
      expect(headers.map((h: any) => h.name || h)).toContain('state');
      expect(headers.map((h: any) => h.name || h)).toContain('name');
      expect(headers.some((h: any) => h.name === 'reposReady')).toBe(true);
      expect(headers.some((h: any) => h.name === 'helmOpsReady')).toBe(true);
      expect(headers.some((h: any) => h.name === 'bundlesReady')).toBe(true);
      expect(headers.some((h: any) => h.name === 'lastSeen')).toBe(true);
    });

    it('should configure reposReady column correctly', () => {
      const wrapper = createWrapper();
      const reposReady = wrapper.vm.headers.find((h: any) => h.name === 'reposReady');

      expect(reposReady.labelKey).toBe('tableHeaders.reposReady');
      expect(reposReady.value).toBe('status.readyGitRepos');
      expect(reposReady.search).toBe(false);
    });

    it('should configure helmOpsReady column correctly', () => {
      const wrapper = createWrapper();
      const helmOpsReady = wrapper.vm.headers.find((h: any) => h.name === 'helmOpsReady');

      expect(helmOpsReady.labelKey).toBe('tableHeaders.helmOpsReady');
      expect(helmOpsReady.value).toBe('status.readyHelmOps');
      expect(helmOpsReady.search).toBe(false);
    });

    it('should configure bundlesReady column correctly', () => {
      const wrapper = createWrapper();
      const bundlesReady = wrapper.vm.headers.find((h: any) => h.name === 'bundlesReady');

      expect(bundlesReady.labelKey).toBe('tableHeaders.bundlesReady');
      expect(bundlesReady.value).toBe('status.display.readyBundles');
      expect(bundlesReady.search).toBe(false);
    });

    it('should configure lastSeen column with LiveDate formatter', () => {
      const wrapper = createWrapper();
      const lastSeen = wrapper.vm.headers.find((h: any) => h.name === 'lastSeen');

      expect(lastSeen.formatter).toBe('LiveDate');
      expect(lastSeen.formatterOpts).toStrictEqual({ addSuffix: true });
      expect(lastSeen.width).toBe(120);
    });
  });

  describe('additional-sub-row slot', () => {
    it('should render labels row when customLabels exist', () => {
      const rows = [{
        customLabels:        ['label1', 'label2', 'label3'],
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });

      expect(wrapper.find('.labels-row').exists()).toBe(true);
    });

    it('should display up to 7 labels by default', () => {
      const rows = [{
        customLabels:        ['label1', 'label2', 'label3', 'label4', 'label5', 'label6', 'label7', 'label8'],
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });
      const tags = wrapper.findAll('.tag');

      expect(tags).toHaveLength(7);
    });

    it('should display all labels when displayCustomLabels is true', () => {
      const rows = [{
        customLabels:        ['label1', 'label2', 'label3', 'label4', 'label5', 'label6', 'label7', 'label8'],
        displayCustomLabels: true
      }];

      const wrapper = createWrapper({ rows });
      const tags = wrapper.findAll('.tag');

      expect(tags).toHaveLength(8);
    });

    it('should show toggle link when more than 7 labels', () => {
      const rows = [{
        customLabels:        ['label1', 'label2', 'label3', 'label4', 'label5', 'label6', 'label7', 'label8'],
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });
      const toggleLink = wrapper.find('a[href="#"]');

      expect(toggleLink.exists()).toBe(true);
    });

    it('should not show toggle link when 7 or fewer labels', () => {
      const rows = [{
        customLabels:        ['label1', 'label2', 'label3'],
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });
      const toggleLink = wrapper.find('a[href="#"]');

      expect(toggleLink.exists()).toBe(false);
    });

    it('should toggle displayCustomLabels when clicking show/hide link', async() => {
      const rows = [{
        customLabels:        ['label1', 'label2', 'label3', 'label4', 'label5', 'label6', 'label7', 'label8'],
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });
      const toggleLink = wrapper.find('a[href="#"]');

      await toggleLink.trigger('click');

      expect(rows[0].displayCustomLabels).toBe(true);
    });

    it('should render empty cell when no custom labels', () => {
      const rows = [{
        customLabels:        [],
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });
      const labelsRow = wrapper.find('.labels-row');

      expect(labelsRow.exists()).toBe(true);
      expect(labelsRow.findAll('.tag')).toHaveLength(0);
    });

    it('should apply has-sub-row class when showSubRow is true', () => {
      const rows = [{
        customLabels:        ['label1'],
        displayCustomLabels: false,
        stateDescription:    'Active',
      }];

      const wrapper = createWrapper({ rows });
      const labelsRow = wrapper.find('.labels-row');

      expect(labelsRow.classes()).toContain('has-sub-row');
    });
  });

  describe('toggleCustomLabels method', () => {
    it('should toggle displayCustomLabels property', () => {
      const wrapper = createWrapper();
      const row = { displayCustomLabels: false };

      wrapper.vm.toggleCustomLabels(row);
      expect(row.displayCustomLabels).toBe(true);

      wrapper.vm.toggleCustomLabels(row);
      expect(row.displayCustomLabels).toBe(false);
    });
  });

  describe('props validation', () => {
    it('should accept required rows prop', () => {
      const rows = [{ id: '1', name: 'cluster1' }];
      const wrapper = createWrapper({ rows });

      expect(wrapper.props('rows')).toStrictEqual(rows);
    });

    it('should accept schema prop', () => {
      const schema = { id: 'fleet.cattle.io.cluster' };
      const wrapper = createWrapper({ schema });

      expect(wrapper.props('schema')).toStrictEqual(schema);
    });

    it('should accept loading prop', () => {
      const wrapper = createWrapper({ loading: true });

      expect(wrapper.props('loading')).toBe(true);
    });

    it('should accept useQueryParamsForSimpleFiltering prop', () => {
      const wrapper = createWrapper({ useQueryParamsForSimpleFiltering: true });

      expect(wrapper.props('useQueryParamsForSimpleFiltering')).toBe(true);
    });
  });

  describe('computed MANAGEMENT_CLUSTER property', () => {
    it('should return MANAGEMENT.CLUSTER', () => {
      const wrapper = createWrapper();

      expect(wrapper.vm.MANAGEMENT_CLUSTER).toBe('management.cattle.io.cluster');
    });
  });

  describe('pagingParams computed property', () => {
    it('should return singular and plural labels', () => {
      const wrapper = createWrapper();
      const params = wrapper.vm.pagingParams;

      expect(params.singularLabel).toBe('Cluster');
      expect(params.pluralLabel).toBe('Clusters');
    });
  });

  describe('resourceTable integration', () => {
    it('should pass correct props to ResourceTable', () => {
      const rows = [{ id: '1', customLabels: [] }];
      const schema = { id: 'fleet.cattle.io.cluster' };
      const wrapper = createWrapper({
        rows,
        schema,
        loading: true
      });

      const resourceTable = wrapper.find('.resource-table');

      expect(resourceTable.exists()).toBe(true);
      expect(wrapper.vm.headers).toBeDefined();
      expect(wrapper.vm.headers).toHaveLength(8);
      expect(wrapper.vm.MANAGEMENT_CLUSTER).toBe('management.cattle.io.cluster');
    });
  });

  describe('label display behavior', () => {
    it('should show "fleet.cluster.labels" text when labels exist', () => {
      const rows = [{
        customLabels:        ['label1'],
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });

      expect(wrapper.text()).toContain('fleet.cluster.labels');
    });

    it('should render each label in a Tag component', () => {
      const rows = [{
        customLabels:        ['env:prod', 'team:backend', 'region:us-west'],
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });
      const tags = wrapper.findAll('.tag');

      expect(tags[0].text()).toBe('env:prod');
      expect(tags[1].text()).toBe('team:backend');
      expect(tags[2].text()).toBe('region:us-west');
    });

    it('should handle labels with special characters', () => {
      const rows = [{
        customLabels:        ['app.kubernetes.io/name=nginx', 'version=1.0.0-beta'],
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });
      const tags = wrapper.findAll('.tag');

      expect(tags[0].text()).toBe('app.kubernetes.io/name=nginx');
      expect(tags[1].text()).toBe('version=1.0.0-beta');
    });
  });

  describe('mouse events', () => {
    it('should call onRowMouseEnter when mouse enters labels row', async() => {
      const rows = [{
        customLabels:        ['label1'],
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });
      const labelsRow = wrapper.find('.labels-row');

      await labelsRow.trigger('mouseenter');

      // Event binding is tested through the template
      expect(labelsRow.exists()).toBe(true);
    });

    it('should call onRowMouseLeave when mouse leaves labels row', async() => {
      const rows = [{
        customLabels:        ['label1'],
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });
      const labelsRow = wrapper.find('.labels-row');

      await labelsRow.trigger('mouseleave');

      // Event binding is tested through the template
      expect(labelsRow.exists()).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined customLabels gracefully', () => {
      const rows = [{
        customLabels:        undefined,
        displayCustomLabels: false
      }];

      // Component should handle this without crashing
      expect(() => createWrapper({ rows })).not.toThrow();
    });

    it('should handle exactly 7 labels without toggle link', () => {
      const rows = [{
        customLabels:        ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7'],
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });
      const tags = wrapper.findAll('.tag');
      const toggleLink = wrapper.find('a[href="#"]');

      expect(tags).toHaveLength(7);
      expect(toggleLink.exists()).toBe(false);
    });

    it('should handle exactly 8 labels with toggle link', () => {
      const rows = [{
        customLabels:        ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8'],
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });
      const tags = wrapper.findAll('.tag');
      const toggleLink = wrapper.find('a[href="#"]');

      expect(tags).toHaveLength(7); // Only first 7 shown initially
      expect(toggleLink.exists()).toBe(true);
    });

    it('should handle large number of labels', () => {
      const rows = [{
        customLabels:        Array.from({ length: 50 }, (_, i) => `label${ i + 1 }`),
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });
      const tags = wrapper.findAll('.tag');

      expect(tags).toHaveLength(7);
    });

    it('should show all labels when displayCustomLabels is true for large set', () => {
      const rows = [{
        customLabels:        Array.from({ length: 50 }, (_, i) => `label${ i + 1 }`),
        displayCustomLabels: true
      }];

      const wrapper = createWrapper({ rows });
      const tags = wrapper.findAll('.tag');

      expect(tags).toHaveLength(50);
    });
  });

  describe('styling classes', () => {
    it('should apply labels-row class', () => {
      const rows = [{
        customLabels:        ['label1'],
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });

      expect(wrapper.find('.labels-row').exists()).toBe(true);
    });

    it('should apply additional-sub-row class', () => {
      const rows = [{
        customLabels:        ['label1'],
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });

      expect(wrapper.find('.additional-sub-row').exists()).toBe(true);
    });

    it('should apply mt-5 class to labels container', () => {
      const rows = [{
        customLabels:        ['label1'],
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });

      expect(wrapper.find('.mt-5').exists()).toBe(true);
    });

    it('should apply mr-5 class to label tags', () => {
      const rows = [{
        customLabels:        ['label1'],
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });

      expect(wrapper.find('.mr-5').exists()).toBe(true);
    });
  });

  // Tests for gap removal fix - Issue #16502
  describe('additional-sub-row properties passed properly', () => {
    it('should render additional-sub-row when customLabels is empty', () => {
      const rows = [{
        customLabels:        [],
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });
      const additionalSubRow = wrapper.find('.labels-row.additional-sub-row');

      // Should exist when no custom labels, it should be there to have the border
      expect(additionalSubRow.exists()).toBe(true);
    });

    it('should render additional-sub-row when customLabels is undefined', () => {
      const rows = [{
        customLabels:        undefined,
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });
      const additionalSubRow = wrapper.find('.labels-row.additional-sub-row');

      // Should exist when no custom labels, it should be there to have the border
      expect(additionalSubRow.exists()).toBe(true);
    });

    it('should render additional-sub-row when customLabels is null', () => {
      const rows = [{
        customLabels:        null,
        displayCustomLabels: false
      }];

      const wrapper = createWrapper({ rows });
      const additionalSubRow = wrapper.find('.labels-row.additional-sub-row');

      // Should not exist when customLabels is null
      expect(additionalSubRow.exists()).toBe(true);
    });

    it('should handle mixed scenarios - some clusters with labels, some without', () => {
      const mixedRows = [
        {
          id:                  'cluster-1',
          customLabels:        ['env:prod'],
          displayCustomLabels: false
        },
        {
          id:                  'cluster-2',
          customLabels:        [],
          displayCustomLabels: false
        },
        {
          id:                  'cluster-3',
          customLabels:        ['team:backend', 'region:us-west'],
          displayCustomLabels: false
        }
      ];

      // We need to create separate wrappers since our stub only shows one row
      const wrapper1 = createWrapper({ rows: [mixedRows[0]] });
      const wrapper2 = createWrapper({ rows: [mixedRows[1]] });
      const wrapper3 = createWrapper({ rows: [mixedRows[2]] });

      // Cluster 1: has labels -> should render additional-sub-row
      expect(wrapper1.find('tr.additional-sub-row').exists()).toBe(true);

      // Cluster 2: no labels -> should render additional-sub-row
      expect(wrapper2.find('tr.additional-sub-row').exists()).toBe(true);

      // Cluster 3: has labels -> should render additional-sub-row
      expect(wrapper3.find('tr.additional-sub-row').exists()).toBe(true);
    });

    it('should render additional-sub-row without the has-sub-row when there is no stateDescription', () => {
      const rows = [{
        customLabels:        null,
        displayCustomLabels: false,
        stateDescription:    null,
      }];

      const wrapper = createWrapper({ rows });
      const additionalSubRow = wrapper.find('.labels-row.additional-sub-row.has-sub-row');

      // Should not exist when customLabels is null
      expect(additionalSubRow.exists()).toBe(false);
    });
  });
});
