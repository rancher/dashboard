import { mount } from '@vue/test-utils';
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
import SaveAsRKETemplateDialog from '@shell/dialog/SaveAsRKETemplateDialog.vue';
import ScaleMachineDownDialog from '@shell/dialog/ScaleMachineDownDialog.vue';
import ScalePoolDownDialog from '@shell/dialog/ScalePoolDownDialog.vue';
import SloDialog from '@shell/dialog/SloDialog.vue';

import DisableAuthProviderDialog from '@shell/dialog/DisableAuthProviderDialog.vue';
import WechatDialog from '@shell/dialog/WechatDialog.vue';
import InstallExtensionDialog from '@shell/dialog/InstallExtensionDialog.vue';
import UninstallExtensionDialog from '@shell/dialog/UninstallExtensionDialog.vue';
import KnownHostsEditDialog from '@shell/dialog/KnownHostsEditDialog.vue';
import ImportDialog from '@shell/dialog/ImportDialog.vue';
import SearchDialog from '@shell/dialog/SearchDialog.vue';
import ChangePasswordDialog from '@shell/dialog/ChangePasswordDialog.vue';
import AssignToDialog from '@shell/dialog/AssignToDialog.vue';
import FeatureFlagListDialog from '@shell/dialog/FeatureFlagListDialog.vue';
import MoveNamespaceDialog from '@shell/dialog/MoveNamespaceDialog.vue';

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
      'type-map/allTypes':     () => jest.fn(), // SearchDialog
      'type-map/labelFor':     () => jest.fn(), // ScaleMachineDownDialog
      'type-map/getTree':      () => jest.fn().mockReturnValue([]), // SearchDialog
      'cluster/all':           () => jest.fn(), // SearchDialog
      currentProduct:          () => { // SearchDialog
        return { inStore: 'cluster' };
      },
      currentCluster: () => { // general usage
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
    ['SaveAsRKETemplateDialog', SaveAsRKETemplateDialog],
    ['SloDialog', SloDialog],
    ['AddCustomBadgeDialog', AddCustomBadgeDialog],
    ['ScaleMachineDownDialog', ScaleMachineDownDialog],
    ['ScalePoolDownDialog', ScalePoolDownDialog],
    // new modals created/moved
    ['DisableAuthProviderDialog', DisableAuthProviderDialog],
    ['WechatDialog', WechatDialog],
    ['InstallExtensionDialog', InstallExtensionDialog],
    ['UninstallExtensionDialog', UninstallExtensionDialog],
    ['KnownHostsEditDialog', KnownHostsEditDialog],
    ['ImportDialog', ImportDialog],
    ['SearchDialog', SearchDialog],
    ['ChangePasswordDialog', ChangePasswordDialog],
    ['AssignToDialog', AssignToDialog],
    ['FeatureFlagListDialog', FeatureFlagListDialog],
    ['MoveNamespaceDialog', MoveNamespaceDialog],
  ])('prompt Modal should render modal %p', (modalName, component) => {
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
