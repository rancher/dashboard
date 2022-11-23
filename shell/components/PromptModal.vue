<script>
import { mapState } from 'vuex';
import { isArray } from '@shell/utils/array';

/**
 * @name PromptModal
 * @description Modal component.
 */
export default {
  name: 'PromptModal',

  data() {
    return { opened: false, backgroundClosing: null };
  },

  computed: {
    ...mapState('action-menu', ['showModal', 'modalData']),

    resources() {
      let resources = this.modalData?.resources;

      if (!isArray(resources)) {
        resources = [resources];
      }

      return resources || [];
    },

    modalWidth() {
      // property set from workload.js to overwrite modal default width of 600px, with fallback value as well
      return this.modalData?.modalWidth || '600px';
    },
    component() {
      // Looks for a dialog component by looking up in plugins and @shell/dialog/${name}.
      return this.$store.getters['type-map/importDialog'](this.modalData?.component);
    },
    cssProps() {
      // this computed property lets us generate a scss var that we can use in the style
      return `--prompt-modal-width: ${ this.modalWidth }`;
    },
    stickyProps() {
      const isSticky = !!this.modalData?.modalSticky;

      return !isSticky ? '' : 'display: flex; flex-direction: column; ';
    }
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
      if (this.backgroundClosing) {
        this.backgroundClosing();
      }
    },

    // We're using register instead of just making use of $refs because the $refs is always undefined when referencing the component
    registerBackgroundClosing(fn) {
      this.$set(this, 'backgroundClosing', fn);
    }
  },
};
</script>

<template>
  <modal
    class="promptModal-modal"
    name="promptModal"
    :styles="`background-color: var(--nav-bg); border-radius: var(--border-radius); ${stickyProps} max-height: 95vh; ${cssProps}`"
    height="auto"
    :scrollable="true"
    @closed="close()"
  >
    <component
      :is="component"
      v-if="opened && component"
      :resources="resources"
      :register-background-closing="registerBackgroundClosing"
      @close="close()"
    />
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
    & .v--modal-box.v--modal {
      width: var(--prompt-modal-width) !important;
      left: unset !important;
      margin: auto !important;
    }
  }
</style>
