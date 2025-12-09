<script>
import { mapState } from 'vuex';
import { isArray } from '@shell/utils/array';
import AppModal from '@shell/components/AppModal.vue';

/**
 * @name PromptModal
 * @description Modal component.
 */
export default {
  name: 'PromptModal',

  components: { AppModal },

  data() {
    return {
      opened:            false,
      backgroundClosing: null,
      componentRendered: false
    };
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
    testId() {
      return this.modalData?.testId || 'prompt-modal-generic-testid';
    },
    returnFocusSelector() {
      return this.modalData?.returnFocusSelector || undefined;
    },
    returnFocusFirstIterableNodeSelector() {
      return this.modalData?.returnFocusFirstIterableNodeSelector || undefined;
    },
    modalWidth() {
      // property set from workload.js to overwrite modal default width of 600px, with fallback value as well
      return this.modalData?.modalWidth || '600px';
    },
    customClass() {
      return this.modalData?.customClass || undefined;
    },
    styles() {
      return this.modalData?.styles || undefined;
    },
    height() {
      return this.modalData?.height || undefined;
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
    },
    closeOnClickOutside() {
      return this.modalData?.closeOnClickOutside;
    },
    modalName() {
      return this.modalData?.modalName;
    }
  },

  watch: {
    showModal(show) {
      this.opened = show;
    }
  },

  methods: {
    onSlotComponentMounted() {
      // variable for the watcher based focus-trap
      // so that we know when the component is rendered
      this.componentRendered = true;
    },
    close(data) {
      if (!this.opened) {
        return;
      }

      this.errors = [];

      // Guard against events that can be implicitly passed by components
      const modalData = (data instanceof Event || !data?.performCallback) ? undefined : data;

      this.$store.commit('action-menu/togglePromptModal', modalData);

      if (this.backgroundClosing) {
        this.backgroundClosing();
      }

      this.componentRendered = false;
      this.opened = false;
    },

    // We're using register instead of just making use of $refs because the $refs is always undefined when referencing the component
    registerBackgroundClosing(fn) {
      this['backgroundClosing'] = fn;
    }
  },
};
</script>

<template>
  <app-modal
    v-if="opened && component"
    :name="modalName"
    :click-to-close="closeOnClickOutside"
    :width="modalWidth"
    :data-testid="testId"
    :custom-class="customClass"
    :styles="styles"
    :height="height"
    :trigger-focus-trap="true"
    :return-focus-selector="returnFocusSelector"
    :return-focus-first-iterable-node-selector="returnFocusFirstIterableNodeSelector"
    :focus-trap-watcher-based-variable="componentRendered"
    @close="close"
  >
    <component
      v-bind="modalData.componentProps || {}"
      :is="component"
      :resources="resources"
      :register-background-closing="registerBackgroundClosing"
      @vue:mounted="onSlotComponentMounted"
      @close="close"
    />
  </app-modal>
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
