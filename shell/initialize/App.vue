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

    this.refreshOnlineStatus();
    // Setup the listeners
    window.addEventListener('online', this.refreshOnlineStatus);
    window.addEventListener('offline', this.refreshOnlineStatus);

    // Add $nuxt.context
    this.context = this.$options.context;
  },

  mounted() {
    this.$loading = this.$refs.loading;
  },

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
