<script>
import { mapState } from 'vuex';
import { isArray } from '@/utils/array';
import { importDialog } from '@/utils/dynamic-importer';

export default {
  data() {
    return { opened: false };
  },

  computed:   {
    ...mapState('action-menu', ['showModal', 'modalData']),

    resources() {
      let resources = this.modalData?.resources;

      if (!isArray(resources)) {
        resources = [resources];
      }

      return resources || [];
    },

    component() {
      // Looks for a dialog component by looking up @/components/dialog/${name}.
      return importDialog(this.modalData?.component);
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
      this.$store.commit('action-menu/togglePromptModal');
    },
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
    @closed="close()"
  >
    <component :is="component" v-if="opened && component" :resources="resources" @close="close()" />
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
