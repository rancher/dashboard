<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import AppModal from '@shell/components/AppModal.vue';

const store = useStore();

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

  store.commit('modal/closeModal');
}

function registerBackgroundClosing(fn: Function) {
  backgroundClosing.value = fn;
}
</script>

<template>
  <Teleport to="#modals">
    <app-modal
      v-if="isOpen && component"
      :click-to-close="closeOnClickOutside"
      :width="modalWidth"
      :style="{ '--prompt-modal-width': modalWidth }"
      :trigger-focus-trap="false"
      tabindex="0"
      @close="close"
    >
      <component
        :is="component"
        v-bind="componentProps || {}"
        data-testid="modal-manager-component"
        :resources="resources"
        :register-background-closing="registerBackgroundClosing"
        @close="close"
      />
    </app-modal>
  </Teleport>
</template>
