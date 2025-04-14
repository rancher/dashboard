import { nextTick } from 'vue';
import { shallowMount, mount } from '@vue/test-utils';
import PromptModal from '@shell/components/PromptModal.vue';
import GenericPrompt from '@shell/dialog/GenericPrompt.vue';
import { createStore } from 'vuex';
import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { CAPI, NORMAN } from '@shell/config/types';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';

describe('component: PromptModal', () => {
  const store = createStore({
    modules: {
      'action-menu': {
        namespaced: true,
        state:      {
          showModal: true,
          modalData: {
            whatever:            true,
            closeOnClickOutside: true
          }
        },
      },
    },
    getters: {
      'type-map/importDialog': () => () => GenericPrompt,
      'i18n/exists':           () => jest.fn(),
      'i18n/t':                jest.fn()
    },
    // actions: { 'management/findAll': jest.fn().mockResolvedValue(snapShots), 'rancher/findAll': jest.fn().mockResolvedValue([]) }
  });

  it('should emit copied after click', async() => {
    document.body.innerHTML = '<div id="modals"></div>';
    const wrapper = mount(PromptModal,
      {
        attachTo: document.body,
        data() {
          return { opened: true };
        },
        global: { mocks: { $store: store } }
      }
    );

    console.log(document.querySelector('#modals').innerHTML);

    // await wrapper.find('code').trigger('click');

    expect(wrapper.vm.opened).toBe(true);
  });
});
