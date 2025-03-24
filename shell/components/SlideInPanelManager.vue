<script lang="ts" setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

const HEADER_HEIGHT = 55;

const store = useStore();
const isOpen = computed(() => store.getters['slideInPanel/isOpen']);
const currentComponent = computed(() => store.getters['slideInPanel/component']);
const currentProps = computed(() => store.getters['slideInPanel/componentProps']);

const panelTop = computed(() => {
  const banner = document.getElementById('banner-header');
  let height = HEADER_HEIGHT;

  if (banner) {
    height += banner.clientHeight;
  }

  return `${ height }px`;
});

const panelHeight = computed(() => `calc(100vh - ${ panelTop?.value })`);
const panelWidth = computed(() => currentProps?.value?.width || '33%');
const panelRight = computed(() => (isOpen?.value ? '0' : `-${ panelWidth?.value }`));

const panelTitle = computed(() => currentProps?.value?.title || 'Details');

function closePanel() {
  store.commit('slideInPanel/close');
}
</script>

<template>
  <Teleport to="#slides">
    <div id="slide-in-panel-manager">
      <div
        v-show="isOpen"
        data-testid="slide-in-glass"
        class="slide-in-glass"
        :class="{ 'slide-in-glass-open': isOpen }"
        @click="closePanel"
      />
      <div
        class="slide-in"
        :class="{ 'slide-in-open': isOpen }"
        :style="{ width: panelWidth, right: panelRight, top: panelTop, height: panelHeight }"
      >
        <div class="header">
          <div class="title">
            {{ panelTitle }}
          </div>
          <i
            class="icon icon-close"
            data-testid="slide-in-close"
            @click="closePanel"
          />
        </div>
        <div class="main-panel">
          <component
            :is="currentComponent"
            v-if="isOpen || currentComponent"
            v-bind="currentProps"
            data-testid="slide-in-panel-component"
            class="dynamic-panel-content"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.slide-in-glass {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100vw;
}
.slide-in-glass-open {
  background-color: var(--body-bg);
  display: block;
  opacity: 0.5;
  z-index: 1000;
}

.slide-in {
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  z-index: 2000;
  transition: right 0.5s ease;
  border-left: 1px solid var(--border);
  background-color: var(--body-bg);
}

.slide-in-open {
  right: 0;
}

.header {
  display: flex;
  align-items: center;
  padding: 4px;
  border-bottom: 1px solid var(--border);

  .title {
    flex: 1;
    font-weight: bold;
  }

  .icon-close {
    cursor: pointer;
  }
}

.main-panel {
  padding: 10px;
  overflow: auto;
}
</style>
