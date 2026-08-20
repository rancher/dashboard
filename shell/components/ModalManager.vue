<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import AppModal from '@shell/components/AppModal.vue';
import { RcModal } from '@components/RcModal';

const store = useStore();
const componentRendered = ref(false);

const isOpen = computed(() => store.getters['modal/isOpen']);
const component = computed(() => store.getters['modal/component']);
const componentProps = computed(() => store.getters['modal/componentProps']);
const resources = computed(() => store.getters['modal/resources']);
const closeOnClickOutside = computed(() => store.getters['modal/closeOnClickOutside']);
const modalWidth = computed(() => store.getters['modal/modalWidth']);
const title = computed(() => store.getters['modal/title']);
const size = computed(() => store.getters['modal/size']);
// const modalSticky = computed(() => store.getters['modal/modalSticky']); // TODO: Implement sticky modals

const isStandard = computed(() => !!title.value || !!size.value);

const wrapperProps = computed(() => (isStandard.value ? {
  show:         true,
  title:        title.value,
  size:         size.value,
  clickToClose: closeOnClickOutside.value,
} : {
  clickToClose:                  closeOnClickOutside.value,
  width:                         modalWidth.value,
  style:                         { '--prompt-modal-width': modalWidth.value },
  triggerFocusTrap:              true,
  focusTrapWatcherBasedVariable: componentRendered.value,
}));

const backgroundClosing = ref<Function | null>(null);

function close() {
  if (!isOpen.value) return;

  if (backgroundClosing.value) {
    backgroundClosing.value();
  }

  componentRendered.value = false;
  store.commit('modal/closeModal');
}

function registerBackgroundClosing(fn: Function) {
  backgroundClosing.value = fn;
}

function onSlotComponentMounted() {
  // variable for the watcher based focus-trap
  // so that we know when the component is rendered
  // works in tandem with trigger-focus-trap="true"
  componentRendered.value = true;
}
</script>

<template>
  <component
    :is="isStandard ? RcModal : AppModal"
    v-if="isOpen && component"
    v-bind="wrapperProps"
    @close="close"
  >
    <component
      :is="component"
      v-bind="componentProps || {}"
      data-testid="modal-manager-component"
      :resources="resources"
      :register-background-closing="registerBackgroundClosing"
      @vue:mounted="onSlotComponentMounted"
      @close="close"
    />
  </component>
</template>
