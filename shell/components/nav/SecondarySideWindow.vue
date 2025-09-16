<script lang="ts">
import { mapState } from 'vuex';
import RcButton from '@components/RcButton/RcButton.vue';

const _warn = (msg: string, ...args: any[]) => {
  console.warn(`[wm2] ${ msg } ${ args?.reduce((acc, v) => `${ acc } '${ v }'`, '') }`); /* eslint-disable-line no-console */
};

export default {
  name: 'SecondarySideWindow',

  components: { RcButton },

  data() {
    return {
      componentName: '',
      component:     null
    };
  },

  mounted() {
  },

  computed: { ...mapState('wm/secondary', ['open', 'userHeight', 'userWidth']) },

  watch: {
    open: {
      handler:   'setupWindow',
      immediate: true,
    }
  },

  methods: {
    setupWindow(isOpen: boolean) {
      document.documentElement.style.setProperty('--wm2-width', isOpen ? this.userWidth : '0');

      const { componentName, extensionId } = this.$store.getters['wm/secondary/config'] || {};

      this.loadComponent(componentName, extensionId);
    },

    loadComponent(name: string, extensionId: string) {
      if (!!this.component || !name || this.componentName === name) {
        _warn(`component is already loaded`, name, extensionId);

        return;
      }

      this.componentName = name;

      if (!!extensionId) {
        _warn(`loading component from extension`, name, extensionId);

        this.component = (this as any).$extension?.getDynamic('component', name);
      } else if (this.$store.getters['type-map/hasCustomWindowComponent'](name)) {
        _warn(`loading component from TypeMap`, name);

        this.component = this.$store.getters['type-map/importWindowComponent'](name);
      }

      if (!this.component) {
        _warn(`component not found for`, name);
      }
    },

    close() {
      this.$store.dispatch('wm/secondary/close');
    },
  }
};
</script>

<template>
  <div
    v-if="open"
    id="secondary-side-window"
    data-testid="secondary-side-window"
    class="secondary-side-window"
  >
    <div class="header">
      <RcButton
        class="close-btn"
        @click="close"
      >
        <i class="icon icon-close" />
      </RcButton>
    </div>
    <div class="body">
      <component
        :is="component"
        v-if="component"
        :tab="{}"
        v-bind="{}"
        @close="close"
      />
      <div v-else>
        <span>No component found for {{ componentName }}</span>
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
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 8px;
}

.close-btn {
  /* Optional: adjust size or margin if needed */
}

.body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
