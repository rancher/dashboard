<script lang="ts" setup>
import {
  ref, computed, watch, onMounted, markRaw
} from 'vue';
import { useStore } from 'vuex';
import RcButton from '@components/RcButton/RcButton.vue';
import { BOTTOM } from '@shell/utils/position';

const _warn = (msg: string, ...args: any[]) => {
  console.warn(`[wm2] ${ msg } ${ args?.reduce((acc, v) => `${ acc } '${ v }'`, '') }`); /* eslint-disable-line no-console */
};

const store = useStore();

const componentName = ref('');
const component = ref<any>(null);

const open = computed(() => store.getters['wm/secondary/isOpen']);
const tabs = computed(() => store.getters['wm/secondary/tabs'] || []);
const userWidth = computed(() => store.getters['wm/secondary/userWidth'] || window.localStorage.getItem('wm2-width') || '600px');

function setupPrimaryWindow() {
  // When the SecondarySideWindow is opened, pin the PrimarySideWindow to the bottom
  window.localStorage.setItem('wm-pin', BOTTOM);
  store.commit('wm/setUserPin', BOTTOM);
}

function loadComponent(tab: { componentName?: string, extensionId?: string }) {
  const { componentName: name, extensionId } = tab;

  if (!name) {
    _warn(`component name not provided`);

    return;
  }

  if (!!component.value || componentName.value === name) {
    _warn(`component is already loaded`, name, extensionId);

    return;
  }

  componentName.value = name;

  if (!!extensionId) {
    _warn(`loading component from extension`, name, extensionId);
    component.value = markRaw((store as any).$extension?.getDynamic('component', name));
  } else if (store.getters['type-map/hasCustomWindowComponent'](name)) {
    _warn(`loading component from TypeMap`, name);
    component.value = markRaw(store.getters['type-map/importWindowComponent'](name));
  }

  if (!component.value) {
    _warn(`component not found for`, name);
  }
}

function setupLayout(isOpen: boolean) {
  document.documentElement.style.setProperty('--wm2-width', isOpen ? userWidth.value : '0');

  if (isOpen) {
    setupPrimaryWindow();

    loadComponent(tabs.value[0] || {});
  }
}

function close() {
  store.dispatch('wm/secondary/close');
}

watch(open, (val) => setupLayout(val), { immediate: true });

onMounted(() => {
  // No logic needed here for now
});
</script>

<template>
  <div
    v-if="open"
    id="secondary-side-window"
    data-testid="secondary-side-window"
    class="wm2 secondary-side-window"
  >
    <div
      ref="header"
      class="header"
    >
      <div
        v-for="(tab, i) in tabs"
        :key="i"
        class="tab-header"
      >
        <i
          v-if="tab.icon"
          class="icon"
          :class="{['icon-'+ tab.icon]: true}"
        />
        <span class="tab-label"> {{ tab.label }}</span>
      </div>
      <div
        class="actions"
      >
        <RcButton
          small
          ghost
          class=""
          @click="close"
          @keydown.enter.stop="close"
        >
          <i
            class="icon icon-close"
          />
        </RcButton>
      </div>
    </div>

    <div
      ref="body"
      class="body"
    >
      <component
        :is="component"
        v-if="component"
        :tab="{}"
        v-bind="{}"
        @close="close"
      />
      <div
        v-else
        class="no-component"
      >
        <h1>{{ `Component '${ componentName }' not found` }}</h1>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.secondary-side-window {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border-left: var(--nav-border-size) solid var(--nav-border);
  position: relative;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 8px;
    border-bottom: 1px solid var(--body-bg);

    .tab-label {
      padding: 0 4px;
      font-size: 16px;
      border-bottom: 1px solid var(--primary);
      padding-bottom: 2px;
    }

    .actions {
      padding-right: 4px;
    }
  }

  .no-component {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
  }
}
</style>
