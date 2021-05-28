<script>
import { mapState, mapGetters } from 'vuex';
import { isArray } from '@/utils/array';
import AsyncButton from '@/components/AsyncButton';
import Card from '@/components/Card';
import Banner from '@/components/Banner';
import { importDialog } from '@/utils/dynamic-importer';

export default {
  components: {
    Card,
    AsyncButton,
    Banner,
  },

  data() {
    return {
      errors: [],
      opened: false,
    };
  },

  computed:   {
    ...mapState('action-menu', ['showModal', 'modalData']),
    ...mapGetters({ t: 'i18n/t' }),

    resources() {
      let resources = this.modalData?.resources;

      if (!isArray(resources)) {
        resources = [resources];
      }

      return resources || [];
    },

    component() {
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
