import { flushPromises, shallowMount, VueWrapper } from '@vue/test-utils';
import { createStore, Store } from 'vuex';
import PromptRemove from '@shell/components/PromptRemove.vue';
import AsyncButton from '@shell/components/AsyncButton.vue';
import { Checkbox } from '@components/Form/Checkbox';
import CatalogApp from '@shell/models/catalog.cattle.io.app';
import * as actionMenu from '@shell/store/action-menu';
import { CATALOG } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

const NAMESPACE = 'cattle-logging-system';

const createApp = (name: string, dispatch: jest.Mock, annotations = {}) => new CatalogApp({
  id:       `${ NAMESPACE }/${ name }`,
  type:     CATALOG.APP,
  metadata: { name, namespace: NAMESPACE },
  spec:     { chart: { metadata: { annotations } } }
}, {
  dispatch,
  getters:     { schemaFor: () => undefined },
  rootGetters: {
    'catalog/chart': () => [],
    'prefs/get':     () => false,
    currentCluster:  { workerOSs: ['linux'] }
  }
});

describe('component: PromptRemove', () => {
  describe('removing a cluster tool together with its CRD app', () => {
    let store: Store<any>;
    let wrapper: VueWrapper<any>;
    let dispatch: jest.Mock;
    let app: any;

    const toRemoveNames = () => store.state['action-menu'].toRemove.map((resource: any) => resource.nameDisplay);
    const setDeleteCrd = async(value: boolean) => {
      wrapper.findComponent(Checkbox).vm.$emit('update:value', value);
      await flushPromises();
    };
    const pressDelete = async() => {
      wrapper.findComponent(AsyncButton).vm.$emit('click', jest.fn());
      await flushPromises();
    };

    const openPrompt = async(findCrdApp: { resolves?: any, rejects?: object }) => {
      const find = findCrdApp.rejects ? jest.fn().mockRejectedValue(findCrdApp.rejects) : jest.fn().mockResolvedValue(findCrdApp.resolves);

      dispatch = jest.fn((action: string) => (action === 'find' ? find() : Promise.resolve()));
      app = createApp('rancher-logging', dispatch, { [CATALOG_ANNOTATIONS.AUTO_INSTALL]: 'rancher-logging-crd=match' });
      jest.spyOn(app, 'remove').mockResolvedValue(undefined);

      store = createStore({
        modules: { 'action-menu': { namespaced: true, ...actionMenu } },
        getters: {
          'i18n/t':                            () => (key: string) => key,
          'type-map/hasCustomPromptRemove':    () => () => false,
          'type-map/importCustomPromptRemove': () => () => undefined,
          'type-map/isSpoofed':                () => () => false,
          'type-map/labelFor':                 () => () => 'Installed App',
          currentProduct:                      () => ({ inStore: 'cluster' }),
        }
      });

      wrapper = shallowMount(PromptRemove, {
        global: {
          mocks:      { $store: store, $route: { params: {} } },
          directives: { focus: {} },
          stubs:      {
            AppModal: { template: '<div><slot /></div>' },
            Card:     { template: '<div><slot name="body" /><slot name="actions" /></div>' },
          }
        }
      });

      store.commit('action-menu/togglePromptRemove', app);
      await flushPromises();
    };

    beforeEach(() => {
      const route = { name: 'c-cluster-explorer-tools', params: { cluster: 'local' } };

      (window as any).$globalApp = { $route: route, $router: { currentRoute: { value: route } } };
    });

    afterEach(() => {
      wrapper.unmount();
      delete (window as any).$globalApp;
      jest.restoreAllMocks();
    });

    describe('when the CRD app has already been removed', () => {
      const findCrdApp = { rejects: { status: 404, code: 'NotFound' } };

      it('should offer to delete the CRD app', async() => {
        await openPrompt(findCrdApp);

        expect(wrapper.findComponent(Checkbox).exists()).toBe(true);
      });

      it('should not show an error when the box is ticked', async() => {
        await openPrompt(findCrdApp);
        await setDeleteCrd(true);

        expect(wrapper.find('.text-error').exists()).toBe(false);
      });

      it('should keep the box ticked', async() => {
        await openPrompt(findCrdApp);
        await setDeleteCrd(true);

        expect(wrapper.findComponent(Checkbox).props('value')).toBe(true);
      });

      it('should list only the app', async() => {
        await openPrompt(findCrdApp);
        await setDeleteCrd(true);

        expect(toRemoveNames()).toStrictEqual(['rancher-logging']);
      });

      it('should uninstall the app when Delete is pressed', async() => {
        await openPrompt(findCrdApp);
        await setDeleteCrd(true);
        await pressDelete();

        expect(app.remove).toHaveBeenCalledWith();
      });

      it('should send no request for the CRD app when Delete is pressed', async() => {
        await openPrompt(findCrdApp);
        await setDeleteCrd(true);
        dispatch.mockClear();
        await pressDelete();

        expect(dispatch.mock.calls).toStrictEqual([]);
      });

      it('should close the prompt when Delete is pressed', async() => {
        await openPrompt(findCrdApp);
        await setDeleteCrd(true);
        await pressDelete();

        expect(store.state['action-menu'].showPromptRemove).toBe(false);
      });
    });

    describe('when the CRD app exists', () => {
      let crdApp: any;

      beforeEach(() => {
        crdApp = createApp('rancher-logging-crd', jest.fn());
        jest.spyOn(crdApp, 'remove').mockResolvedValue(undefined);
      });

      it('should list the CRD app with the app', async() => {
        await openPrompt({ resolves: crdApp });
        await setDeleteCrd(true);

        expect(toRemoveNames()).toStrictEqual(['rancher-logging', 'rancher-logging-crd']);
      });

      it('should take the CRD app back out of the list when the box is unticked', async() => {
        await openPrompt({ resolves: crdApp });
        await setDeleteCrd(true);
        await setDeleteCrd(false);

        expect(toRemoveNames()).toStrictEqual(['rancher-logging']);
      });

      it('should not look the CRD app up when the box is unticked', async() => {
        await openPrompt({ resolves: crdApp });
        await setDeleteCrd(true);
        dispatch.mockClear();
        await setDeleteCrd(false);

        expect(dispatch.mock.calls).toStrictEqual([]);
      });

      it('should list the CRD app once when the box is ticked again', async() => {
        await openPrompt({ resolves: crdApp });
        await setDeleteCrd(true);
        await setDeleteCrd(false);
        await setDeleteCrd(true);

        expect(toRemoveNames()).toStrictEqual(['rancher-logging', 'rancher-logging-crd']);
      });

      it('should not list the CRD app when the box is unticked before the CRD app is found', async() => {
        let resolveFind = (_: any) => {};

        await openPrompt({
          resolves: new Promise((resolve) => {
            resolveFind = resolve;
          })
        });
        wrapper.findComponent(Checkbox).vm.$emit('update:value', true);
        await setDeleteCrd(false);
        resolveFind(crdApp);
        await flushPromises();

        expect(toRemoveNames()).toStrictEqual(['rancher-logging']);
      });

      it('should uninstall the CRD app when Delete is pressed', async() => {
        await openPrompt({ resolves: crdApp });
        await setDeleteCrd(true);
        await pressDelete();

        expect(crdApp.remove).toHaveBeenCalledWith();
      });
    });

    describe('when the CRD app cannot be looked up', () => {
      const findCrdApp = { rejects: { status: 403, code: 'Forbidden' } };

      it('should show the error', async() => {
        await openPrompt(findCrdApp);
        await setDeleteCrd(true);

        expect(wrapper.find('.text-error').exists()).toBe(true);
      });

      it('should untick the box', async() => {
        await openPrompt(findCrdApp);
        await setDeleteCrd(true);

        expect(wrapper.findComponent(Checkbox).props('value')).toBe(false);
      });
    });
  });
});
