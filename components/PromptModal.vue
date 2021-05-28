<script>
import { mapState, mapGetters } from 'vuex';
import { isArray } from '@/utils/array';
import AsyncButton from '@/components/AsyncButton';
import Card from '@/components/Card';
import Banner from '@/components/Banner';
import SaveAsRKETemplateDialog from '@/components/SaveAsRKETemplateDialog';

export default {
  components: {
    Card,
    AsyncButton,
    Banner,
    // Need to include all of the dialogs here
    // Would be nice if this could be done dynamically
    SaveAsRKETemplateDialog,
  },

  data() {
    return {
      errors:        [],
      labels:        {},
      restoreMode:   'all',
      moveTo:        this.workspace,
      opened:        false,
      allWorkspaces: [],
    };
  },

  computed:   {
    ...mapState('action-menu', ['showModal', 'modalData']),
    ...mapGetters({ t: 'i18n/t' }),
    ...mapGetters(['currentCluster']),

    dynamic() {
      return this.modalComponent;
    },

    resources() {
      let resources = this.modalData?.resources;

      if (!isArray(resources)) {
        resources = [resources];
      }

      return resources || [];
    },

    component() {
      return this.modalData?.component;
    },
  },

  watch: {
    showModal(show) {
      if (show) {
        this.opened = true;
        this.$modal.show('promptModal');
      } else {
        this.opened = false;
        this.$modal.hide('promptModal');
      }
    },
  },

  methods: {
    close() {
      if (!this.opened) {
        return;
      }

      this.errors = [];
      this.labels = {};
      this.$store.commit('action-menu/togglePromptModal');
    },

    modalClosed() {
      this.close();
    }
  }
};
</script>

<template>
  <modal
    class="promptModal-modal"
    name="promptModal"
    styles="background-color: var(--nav-bg); border-radius: var(--border-radius); max-height: 100vh;"
    height="auto"
    :scrollable="true"
    @closed="modalClosed()"
  >
    <component v-if="opened && component" :is="component" @close="close()" :resources="resources"/>
  </modal>
</template>

<style lang='scss'>
  .promptModal-modal {
    border-radius: var(--border-radius);
    overflow: scroll;
    max-height: 100vh;
    & ::-webkit-scrollbar-corner {
      background: rgba(0,0,0,0);
    }
  }
</style>
