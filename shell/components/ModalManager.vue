<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import AppModal from '@shell/components/AppModal.vue';

const store = useStore();
const componentRendered = ref(false);

const isOpen = computed(() => store.getters['modal/isOpen']);
const component = computed(() => store.getters['modal/component']);
const componentProps = computed(() => store.getters['modal/componentProps']);
const resources = computed(() => store.getters['modal/resources']);
const closeOnClickOutside = computed(() => store.getters['modal/closeOnClickOutside']);
const modalWidth = computed(() => store.getters['modal/modalWidth']);
// const modalSticky = computed(() => store.getters['modal/modalSticky']); // TODO: Implement sticky modals

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
  <Teleport to="#modals">
    <app-modal
      v-if="isOpen && component"
      :click-to-close="closeOnClickOutside"
      :width="modalWidth"
      :style="{ '--prompt-modal-width': modalWidth }"
      :trigger-focus-trap="true"
      :focus-trap-watcher-based-variable="componentRendered"
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
    </app-modal>
  </Teleport>
</template>
