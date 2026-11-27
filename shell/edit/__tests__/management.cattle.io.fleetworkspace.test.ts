import { flushPromises, shallowMount } from '@vue/test-utils';
import fetchMixin from '@shell/mixins/fetch.client.js';
import EditWorkspace from '@shell/edit/management.cattle.io.fleetworkspace.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import { FLEET } from '@shell/config/types';
import { NAME as FLEET_NAME } from '@shell/config/product/fleet';
import { WORKSPACE } from '@shell/store/prefs';

describe('edit: management.cattle.io.fleetworkspace', () => {
  const createValue = () => ({
    metadata:               { name: 'fleet-default', annotations: {} },
    spec:                   {},
    save:                   jest.fn(),
    waitForWorkspaceSchema: jest.fn(),
  });

  // Every type is served, so a read that only happens where its type exists still shows up
  const createStore = () => ({
    dispatch: jest.fn(() => Promise.resolve([])),
    commit:   jest.fn(),
    getters:  {
      'i18n/t':               (key: string) => key,
      'i18n/exists':          () => true,
      'management/schemaFor': (type: string) => ({ id: type }),
      'type-map/optionsFor':  () => ({}),
      'prefs/get':            () => undefined,
      currentProduct:         { name: FLEET_NAME },
    },
    state: { allWorkspaces: [], workspace: 'fleet-default' },
  });

  // The app registers the fetch mixin globally in shell/initialize/entry.js, it is what runs fetch()
  const createWrapper = (mode: string, store = createStore(), value = createValue()) => shallowMount(EditWorkspace, {
    props:  { value, mode },
    global: {
      mixins: [fetchMixin],
      mocks:  {
        $store: store, $route: { params: {}, query: {} }, $router: { push: jest.fn(), replace: jest.fn() }
      },
      renderStubDefaultSlot: true,
    },
  });

  const tabNames = (wrapper: ReturnType<typeof createWrapper>) => wrapper.findAllComponents(Tab).map((tab) => tab.props('name'));

  it('should show only the labels tab when creating', () => {
    expect(tabNames(createWrapper('create'))).toStrictEqual(['labels']);
  });

  it('should show the default OCI registry and labels tabs when editing', () => {
    expect(tabNames(createWrapper('edit'))).toStrictEqual(['ociRegistries', 'labels']);
  });

  it.each(['create', 'edit'])('should ask for nothing when opened to %p', async(mode: string) => {
    const store = createStore();

    createWrapper(mode, store);
    await flushPromises();

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('should save the workspace, then select it', async() => {
    const store = createStore();
    const value = createValue();
    const buttonCb = jest.fn();
    const wrapper = createWrapper('create', store, value);

    await flushPromises();
    await (wrapper.vm as any).saveAll(buttonCb);

    expect(value.save).toHaveBeenCalledTimes(1);
    expect(value.waitForWorkspaceSchema).toHaveBeenCalledTimes(1);
    expect(store.dispatch).toHaveBeenCalledTimes(2);
    expect(store.dispatch).toHaveBeenNthCalledWith(1, 'management/findAll', { type: FLEET.WORKSPACE });
    expect(store.dispatch).toHaveBeenNthCalledWith(2, 'prefs/set', { key: WORKSPACE, value: 'fleet-default' });
    expect(store.commit).toHaveBeenCalledWith('updateWorkspace', { value: 'fleet-default', getters: store.getters });
    expect(buttonCb).toHaveBeenCalledWith(true);
  });
});
