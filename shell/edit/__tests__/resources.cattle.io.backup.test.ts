import { shallowMount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import BackupComponent from '@shell/edit/resources.cattle.io.backup.vue';
import { Banner } from '@components/Banner';
import { RadioGroup } from '@components/Form/Radio';
import { _CREATE } from '@shell/config/query-params';
import { BACKUP_RESTORE } from '@shell/config/types';

const createStore = (resourceSets: { id: string }[]) => ({
  getters: {
    currentStore:                () => 'cluster',
    'cluster/schemaFor':         jest.fn(),
    // The counts don't list resource sets until the user logs in again after installing the chart
    'cluster/all':               () => [],
    'cluster/paginationEnabled': () => false,
    'cluster/urlFor':            jest.fn(),
    'i18n/t':                    (val: string) => val,
    'i18n/exists':               jest.fn(),
  },
  dispatch: jest.fn((action: string, { type }: { type?: string } = {}) => Promise.resolve(type === BACKUP_RESTORE.RESOURCE_SET ? resourceSets : [])),
});

const mountBackup = async(resourceSets: { id: string }[]) => {
  const wrapper = shallowMount(BackupComponent, {
    props: {
      value: {
        metadata: { name: 'backup' },
        spec:     { retentionCount: 10 }
      },
      mode: _CREATE
    },
    global: {
      mocks: {
        $store:      createStore(resourceSets),
        $route:      { query: {}, name: 'backup_route' },
        $router:     { applyQuery: jest.fn() },
        $fetchState: { pending: false }
      },
      stubs: { CruResource: { template: '<div><slot /></div>' } }
    }
  });

  await (wrapper.vm as any).$options.fetch.call(wrapper.vm);
  await flushPromises();

  return wrapper;
};

const findNoResourceSetBanner = (wrapper: any) => wrapper.findAllComponents(Banner).find((banner: any) => banner.props('color') === 'error');

describe('view: resources.cattle.io.backup', () => {
  describe('when the resource sets exist', () => {
    const resourceSets = [{ id: 'rancher-resource-set-basic' }, { id: 'rancher-resource-set-full' }];

    it('should show the backup form', async() => {
      const wrapper = await mountBackup(resourceSets);
      const resourceSetRadio = wrapper.findAllComponents(RadioGroup).find((radio) => radio.props('name') === 'resourceSet');

      expect(resourceSetRadio?.exists()).toBe(true);
    });

    it('should not show the missing resource set error', async() => {
      const wrapper = await mountBackup(resourceSets);

      expect(findNoResourceSetBanner(wrapper)).toBeUndefined();
    });
  });

  describe('when no resource sets exist', () => {
    it('should show the missing resource set error', async() => {
      const wrapper = await mountBackup([]);

      expect(findNoResourceSetBanner(wrapper)?.exists()).toBe(true);
    });

    it('should not select a resource set', async() => {
      const wrapper = await mountBackup([]);

      expect((wrapper.vm as any).value.spec.resourceSetName).toBeUndefined();
    });
  });

  it.each([
    [[{ id: 'rancher-resource-set-basic' }, { id: 'rancher-resource-set-full' }], 'rancher-resource-set-basic', 'rancher-resource-set-basic'],
    [[{ id: 'rancher-resource-set-full' }], 'rancher-resource-set-full', 'rancher-resource-set-full'],
    [[{ id: 'my-resource-set' }], 'my-resource-set', 'custom'],
  ])('should select the right resource set by default when the resource sets are %j', async(resourceSets, resourceSetName, resourceSetSelection) => {
    const wrapper = await mountBackup(resourceSets);

    expect({
      resourceSetName:      (wrapper.vm as any).value.spec.resourceSetName,
      resourceSetSelection: (wrapper.vm as any).resourceSetSelection
    }).toStrictEqual({ resourceSetName, resourceSetSelection });
  });
});
