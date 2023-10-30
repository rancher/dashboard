// Taken from @nuxt/vue-app/template/App.js

import Vue from 'vue';

import {
  getMatchedComponentsInstances, getChildrenComponentInstancesUsingFetch, promisify, globalHandleError, sanitizeComponent
} from '../utils/nuxt';
import NuxtError from '../components/templates/error.vue';
import NuxtLoading from '../components/nav/GlobalLoading.vue';

import '../assets/styles/app.scss';

export default {
  render(h) {
    const loadingEl = h('NuxtLoading', { ref: 'loading' });

    const templateEl = h('div', {
      domProps: { id: '__layout' },
      key:      this.showErrorPage
    }, [this.showErrorPage ? h(sanitizeComponent(NuxtError)) : h('router-view')]);

    return h('div', { domProps: { id: '__nuxt' } }, [
      loadingEl,
      // h(NuxtBuildIndicator), // The build indicator doesn't work as is right now and emits an error in the console so I'm leaving it out for now
      templateEl
    ]);
  },

  data: () => ({
    isOnline: true,

    showErrorPage: false,

    nbFetching: 0
  }),

  beforeCreate() {
    Vue.util.defineReactive(this, 'nuxt', this.$options.nuxt);
  },
  created() {
    // Add this.$nuxt in child instances
    this.$root.$options.$nuxt = this;

    // add to window so we can listen when ready
    window.$nuxt = this;

    this.refreshOnlineStatus();
    // Setup the listeners
    window.addEventListener('online', this.refreshOnlineStatus);
    window.addEventListener('offline', this.refreshOnlineStatus);

    // Add $nuxt.error()
    this.error = this.nuxt.error;
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

    isFetching() {
      return this.nbFetching > 0;
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

    async refresh() {
      const pages = getMatchedComponentsInstances(this.$route);

      if (!pages.length) {
        return;
      }
      this.$loading.start();

      const promises = pages.map((page) => {
        const p = [];

        // Old fetch
        if (page.$options.fetch && page.$options.fetch.length) {
          p.push(promisify(page.$options.fetch, this.context));
        }
        if (page.$fetch) {
          p.push(page.$fetch());
        } else {
          // Get all component instance to call $fetch
          for (const component of getChildrenComponentInstancesUsingFetch(page.$vnode.componentInstance)) {
            p.push(component.$fetch());
          }
        }

        if (page.$options.asyncData) {
          p.push(
            promisify(page.$options.asyncData, this.context)
              .then((newData) => {
                for (const key in newData) {
                  Vue.set(page.$data, key, newData[key]);
                }
              })
          );
        }

        return Promise.all(p);
      });

      try {
        await Promise.all(promises);
      } catch (error) {
        this.$loading.fail(error);
        globalHandleError(error);
        this.error(error);
      }
      this.$loading.finish();
    },
    errorChanged() {
      if (this.nuxt.err) {
        if (this.$loading) {
          if (this.$loading.fail) {
            this.$loading.fail(this.nuxt.err);
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

  components: { NuxtLoading }
};
