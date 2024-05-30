<script>
import NuxtError from '@shell/components/templates/error.vue';
import NuxtLoading from '@shell/components/nav/GlobalLoading.vue';

import '@shell/assets/styles/app.scss';

export default {
  data: () => ({
    isOnline: true,

    showErrorPage: false,
  }),

  created() {
    // add to window so we can listen when ready
    window.$globalApp = this;
    Object.defineProperty(window, '$nuxt', {
      get() {
        const isHarvester = this.$globalApp?.$store.getters['currentCluster']?.isHarvester;

        if (!isHarvester) {
          console.warn('window.$nuxt is deprecated. It would be best to stop using globalState all together. For an alternative you can use window.$globalApp.'); // eslint-disable-line no-console
        }

        return window.$globalApp;
      }
    });

    this.refreshOnlineStatus();
    // Setup the listeners
    window.addEventListener('online', this.refreshOnlineStatus);
    window.addEventListener('offline', this.refreshOnlineStatus);

    // Add $nuxt.error()
    this.error = this.$options.nuxt.error;
    // Add $nuxt.context
    this.context = this.$options.context;
  },

  mounted() {
    this.$loading = this.$refs.loading;
  },

  watch: { 'nuxt.err': 'errorChanged' },

  computed: {
    isOffline() {
      return !this.isOnline;
    },
  },

  methods: {
    refreshOnlineStatus() {
      if (typeof window.navigator.onLine === 'undefined') {
        // If the browser doesn't support connection status reports
        // assume that we are online because most apps' only react
        // when they now that the connection has been interrupted
        this.isOnline = true;
      } else {
        this.isOnline = window.navigator.onLine;
      }
    },
    errorChanged() {
      if (this.$options.nuxt.err) {
        if (this.$loading) {
          if (this.$loading.fail) {
            this.$loading.fail(this.$options.nuxt.err);
          }
          if (this.$loading.finish) {
            this.$loading.finish();
          }
        }

        this.showErrorPage = true;
      } else {
        this.showErrorPage = false;
      }
    },
  },

  components: { NuxtLoading, NuxtError }
};
</script>
<template>
  <div id="__nuxt">
    <NuxtLoading ref="loading" />
    <div
      id="__layout"
      :key="showErrorPage"
    >
      <NuxtError v-if="showErrorPage" />
      <router-view v-else />
    </div>
  </div>
</template>
