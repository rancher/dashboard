import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import PromptModal from '@shell/components/PromptModal.vue';

import GenericPrompt from '@shell/dialog/GenericPrompt.vue';
import AddClusterMemberDialog from '@shell/dialog/AddClusterMemberDialog.vue';
import AddCustomBadgeDialog from '@shell/dialog/AddCustomBadgeDialog.vue';
import AddonConfigConfirmationDialog from '@shell/dialog/AddonConfigConfirmationDialog.vue';
import AddProjectMemberDialog from '@shell/dialog/AddProjectMemberDialog.vue';
import DeactivateDriverDialog from '@shell/dialog/DeactivateDriverDialog.vue';
import DiagnosticTimingsDialog from '@shell/dialog/DiagnosticTimingsDialog.vue';
import DrainNode from '@shell/dialog/DrainNode.vue';
import ForceMachineRemoveDialog from '@shell/dialog/ForceMachineRemoveDialog.vue';
import GitRepoForceUpdateDialog from '@shell/dialog/GitRepoForceUpdateDialog.vue';
import RollbackWorkloadDialog from '@shell/dialog/RollbackWorkloadDialog.vue';
import RotateCertificatesDialog from '@shell/dialog/RotateCertificatesDialog.vue';
import RotateEncryptionKeyDialog from '@shell/dialog/RotateEncryptionKeyDialog.vue';
import ScaleMachineDownDialog from '@shell/dialog/ScaleMachineDownDialog.vue';
import ScalePoolDownDialog from '@shell/dialog/ScalePoolDownDialog.vue';
import SloDialog from '@shell/dialog/SloDialog.vue';

import DisableLastAuthProviderDialog from '@shell/dialog/DisableLastAuthProviderDialog.vue';
import DisableLocalLoginDialog from '@shell/dialog/DisableLocalLoginDialog.vue';
import WechatDialog from '@shell/dialog/WechatDialog.vue';
import DeveloperLoadExtensionDialog from '@shell/dialog/DeveloperLoadExtensionDialog.vue';
import AddExtensionReposDialog from '@shell/dialog/AddExtensionReposDialog.vue';
import InstallExtensionDialog from '@shell/dialog/InstallExtensionDialog.vue';
import UninstallExtensionDialog from '@shell/dialog/UninstallExtensionDialog.vue';
import UninstallExistingExtensionDialog from '@shell/dialog/UninstallExistingExtensionDialog.vue';
import KnownHostsEditDialog from '@shell/dialog/KnownHostsEditDialog.vue';
import ImportDialog from '@shell/dialog/ImportDialog.vue';
import ChangePasswordDialog from '@shell/dialog/ChangePasswordDialog.vue';
import AssignToDialog from '@shell/dialog/AssignToDialog.vue';
import FeatureFlagListDialog from '@shell/dialog/FeatureFlagListDialog.vue';
import MoveNamespaceDialog from '@shell/dialog/MoveNamespaceDialog.vue';
import ExtensionCatalogInstallDialog from '@shell/dialog/ExtensionCatalogInstallDialog.vue';
import ExtensionCatalogUninstallDialog from '@shell/dialog/ExtensionCatalogUninstallDialog.vue';

import { createStore } from 'vuex';

jest.mock('@shell/utils/clipboard', () => {
  return { copyTextToClipboard: jest.fn(() => Promise.resolve({})) };
});

function generateStore(component: any):any {
  return createStore({
    modules: { // promptModal
      'action-menu': {
        namespaced: true,
        state:      {
          modalData: {
            closeOnClickOutside: true,
            resources:           [{ cluster: { isRke2: true, machines: [] } }], // ScaleMachineDownDialog
            componentProps:      {
              drivers:             [], // DeactivateDriverDialog
              driverType:          'kontainerDrivers', // DeactivateDriverDialog
              downloadData:        () => jest.fn(), // DiagnosticTimingsDialog
              gatherResponseTimes: () => jest.fn(), // DiagnosticTimingsDialog
              kubeNodes:           [{}], // DrainNode
              repositories:        [], // GitRepoForceUpdateDialog
              workload:            { metadata: {}, kind: '' }, // RollbackWorkloadDialog
              catalog:             {}
            },
          },

        },
      },
    },
    getters: {
      'type-map/importDialog': () => () => component, // promptModal
      'i18n/exists':           () => jest.fn(), // promptModal
      'i18n/t':                () => jest.fn(), // general usage
      'rancher/schemaFor':     () => jest.fn(), // general usage
      'prefs/get':             () => jest.fn(), // ScalePoolDownDialog
      'type-map/labelFor':     () => jest.fn(), // ScaleMachineDownDialog
      currentCluster:          () => { // general usage
        'local';
      },
    }
  });
}

describe('component: PromptModal', () => {
  it.each([
    // current prompt modals at time of coding
    ['GenericPrompt', GenericPrompt],
    ['AddClusterMemberDialog', AddClusterMemberDialog],
    ['AddonConfigConfirmationDialog', AddonConfigConfirmationDialog],
    ['AddProjectMemberDialog', AddProjectMemberDialog],
    ['DeactivateDriverDialog', DeactivateDriverDialog],
    ['DiagnosticTimingsDialog', DiagnosticTimingsDialog],
    ['DrainNode', DrainNode],
    ['ForceMachineRemoveDialog', ForceMachineRemoveDialog],
    ['GitRepoForceUpdateDialog', GitRepoForceUpdateDialog],
    ['RollbackWorkloadDialog', RollbackWorkloadDialog],
    ['RotateCertificatesDialog', RotateCertificatesDialog],
    ['RotateEncryptionKeyDialog', RotateEncryptionKeyDialog],
    ['SloDialog', SloDialog],
    ['AddCustomBadgeDialog', AddCustomBadgeDialog],
    ['ScaleMachineDownDialog', ScaleMachineDownDialog],
    ['ScalePoolDownDialog', ScalePoolDownDialog],
    // new modals created/moved
    ['DisableLastAuthProviderDialog', DisableLastAuthProviderDialog],
    ['DisableLocalLoginDialog', DisableLocalLoginDialog],
    ['WechatDialog', WechatDialog],
    ['DeveloperLoadExtensionDialog', DeveloperLoadExtensionDialog],
    ['AddExtensionReposDialog', AddExtensionReposDialog],
    ['InstallExtensionDialog', InstallExtensionDialog],
    ['UninstallExtensionDialog', UninstallExtensionDialog],
    ['UninstallExistingExtensionDialog', UninstallExistingExtensionDialog],
    ['KnownHostsEditDialog', KnownHostsEditDialog],
    ['ImportDialog', ImportDialog],
    ['ChangePasswordDialog', ChangePasswordDialog],
    ['AssignToDialog', AssignToDialog],
    ['FeatureFlagListDialog', FeatureFlagListDialog],
    ['MoveNamespaceDialog', MoveNamespaceDialog],
    ['ExtensionCatalogInstallDialog', ExtensionCatalogInstallDialog],
    ['ExtensionCatalogUninstallDialog', ExtensionCatalogUninstallDialog],
  ])('prompt Modal should render modal %p', (modalName, component) => {
    // mock structuredClone
    window.structuredClone = (arg) => JSON.parse(JSON.stringify(arg));

    document.body.innerHTML = '<div id="modals"></div>';
    const wrapper = mount(PromptModal,
      {
        attachTo: document.body,
        data() {
          return { opened: true }; // this controls modal content visibility
        },
        global: {
          mocks: {
            $store:      generateStore(component),
            $fetchState: {}
          },
          stubs: { transition: false }
        }
      }
    );

    expect(wrapper.vm.opened).toBe(true);
    expect(wrapper.findComponent(component as any).exists()).toBe(true);
  });
});

describe('component: PromptModal dialog resolution', () => {
  const dialogMounted = jest.fn();

  function generateReactiveStore() {
    return createStore({
      state:     { typeMapVersion: 0 },
      mutations: { bumpTypeMap: (state: any) => state.typeMapVersion++ },
      modules:   {
        'action-menu': {
          namespaced: true,
          state:      { showModal: false, modalData: { component: 'TestDialog' } },
          mutations:  {
            setShowModal: (state: any, show: boolean) => (state.showModal = show),
            setComponent: (state: any, component: string) => (state.modalData = { component }),
          },
        },
      },
      getters: {
        'type-map/importDialog': (state: any) => (name: string) => ({
          name,
          typeMapVersion: state.typeMapVersion,
          mounted:        dialogMounted,
          render:         () => h('div'),
        }),
      },
    });
  }

  function mountPromptModal(store: any) {
    document.body.innerHTML = '<div id="modals"></div>';

    return mount(PromptModal, {
      attachTo: document.body,
      global:   {
        mocks: { $store: store },
        stubs: { transition: false },
      },
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should mount the dialog once when the type-map changes while it is open', async() => {
    const store = generateReactiveStore();

    mountPromptModal(store);
    store.commit('action-menu/setShowModal', true);
    await nextTick();

    store.commit('bumpTypeMap');
    await nextTick();

    expect(dialogMounted).toHaveBeenCalledTimes(1);
  });

  it('should render a different dialog when the requested dialog changes', async() => {
    const store = generateReactiveStore();
    const wrapper = mountPromptModal(store);

    store.commit('action-menu/setShowModal', true);
    await nextTick();
    store.commit('action-menu/setComponent', 'OtherDialog');
    await nextTick();

    expect(wrapper.findComponent({ name: 'OtherDialog' }).exists()).toBe(true);
  });
});
