<script>
import Loading from '@/components/Loading';
import { mapGetters } from 'vuex';

const EMBER_FRAME = 'ember-iframe';
const EMBER_FRAME_HIDE_CLASS = 'ember-iframe-hidden';
const PAGE_CHECK_TIMEOUT = 30000;

// Remove the IFrame if the user has not used an embedded page after this time
// since last visiting an embedded page
const INACTIVITY_CHECK_TIMEOUT = 60000;

let inactiveRemoveTimer = null;

// Pages that we should intercept when loaded in the IFRAME and instead
// navigate to a page in Cluster Dashboard
// exmample if the Ember clusters page that is navigated to when the user presses cancel on some pages
// we intercept this and go the the vue Clusters page instead
const INTERCEPTS = {
  'global-admin.clusters.index': {
    name:   'c-cluster-product-resource',
    params: {
      cluster:  '',
      product:  '',
      resource: 'provisioning.cattle.io.cluster'
    }
  },
};

export default {
  components: { Loading },

  props: {
    src: {
      type:     String,
      required: true
    },
    pop: {
      type:    Boolean,
      default: false
    },
    fixed: {
      type:    Boolean,
      default: false
    },
  },

  data() {
    return {
      iframeEl:     null,
      loaded:       true,
      loadRequired: false,
      emberCheck:   null,
      error:        false,
    };
  },

  computed: {
    ...mapGetters({ theme: 'prefs/theme' }),
    ...mapGetters(['clusterId', 'productId']),

    loaderMode() {
      return this.fixed ? 'content' : 'full';
    }
  },

  watch: {
    theme(theme) {
      this.notifyTheme(theme);
    }
  },

  mounted() {
    // Embedded page visited, so cancel time to remove IFRAME when inactive
    window.clearTimeout(inactiveRemoveTimer);
    window.addEventListener('message', this.receiveMessage);
    this.initFrame();
  },

  beforeDestroy() {
    window.removeEventListener('message', this.receiveMessage);

    // Hide the iframe
    if (this.iframeEl) {
      this.iframeEl.classList.add(EMBER_FRAME_HIDE_CLASS);
    }

    // Cancel any pending http request to check Ember UI availability
    if (this.emberCheck) {
      this.emberCheck.cancel('User left page');
    }

    // Set up a timer to remove the IFrame after a period of inactivity
    inactiveRemoveTimer = window.setTimeout(() => {
      const iframeEl = document.getElementById(EMBER_FRAME);

      if (iframeEl !== null) {
        iframeEl.remove();
      }
    }, INACTIVITY_CHECK_TIMEOUT);
  },

  methods: {
    async initFrame() {
      // Get the existing iframe if it exists
      let iframeEl = document.getElementById(EMBER_FRAME);

      // If the iframe already exists, check if it is ready for us to reuse
      // by navigating within the app that is already loaded
      if (iframeEl !== null) {
        const ready = iframeEl.getAttribute('data-ready');

        if (!ready) {
          iframeEl.remove();
          iframeEl = null;
        }
      }

      if (iframeEl === null && process.env.dev) {
        // Fetch a page to check that the Ember UI is available
        try {
          this.error = false;
          this.loaded = false;
          this.emberCheck = this.$axios.CancelToken.source();

          // Make a head requst to a known asset of the Ember UI
          const pageUrl = `${ window.location.origin }/assets/images/logos/rke.svg`;
          const response = await this.$axios.head(pageUrl, {
            timeout:     PAGE_CHECK_TIMEOUT,
            cancelToken: this.emberCheck.token,
          });

          if (response.status !== 200) {
            this.loaded = true;
            this.error = true;
          }
        } catch (e) {
          if (!this.$axios.isCancel(e)) {
            this.loaded = true;
            this.error = true;
          }
        }
      }

      if (this.error) {
        return;
      }

      if (iframeEl === null) {
        iframeEl = document.createElement('iframe');
        iframeEl.setAttribute('id', EMBER_FRAME);
        iframeEl.setAttribute('class', 'ember-iframe');
        iframeEl.classList.add(EMBER_FRAME_HIDE_CLASS);
        document.body.appendChild(iframeEl);
        iframeEl.setAttribute('src', this.src);
      } else {
        // Post a message to navigate within the existing app
        iframeEl.contentWindow.postMessage({
          action: 'navigate',
          name:   this.src
        });

        // Ensure iframe gets the latest theme if it has changed
        this.notifyTheme(this.theme);

        const currentlUrl = iframeEl.getAttribute('data-location');
        const src = this.trimURL(this.src);

        if (src !== currentlUrl) {
          iframeEl.classList.add(EMBER_FRAME_HIDE_CLASS);
        } else {
          iframeEl.classList.remove(EMBER_FRAME_HIDE_CLASS);
        }
      }

      this.iframeEl = iframeEl;
    },

    notifyTheme(theme) {
      const iframeEl = document.getElementById(EMBER_FRAME);

      if (iframeEl) {
        const emberTheme = theme === 'light' ? 'ui-light' : 'ui-dark';

        // Ensure the embedded UI uses the correct theme
        iframeEl.contentWindow.postMessage({
          action: 'set-theme',
          name:   emberTheme
        });
      }
    },

    trimURL(url) {
      if (url && url.endsWith('/')) {
        url = url.substr(0, url.length - 1);
      }

      return url;
    },

    // We use PostMessage between the Embedded Ember UI and the Dashboard UI
    receiveMessage(event) {
      const msg = event.data;

      if (msg.action === 'navigate') {
        this.$router.replace({
          name:   'c-cluster-explorer',
          params: { cluster: msg.cluster }
        });
      } else if (msg.action === 'before-navigation') {
        // Ember willTransition event
        if (INTERCEPTS[msg.target]) {
          const dest = INTERCEPTS[msg.target];

          this.loaded = false;
          this.$router.replace(this.fillRoute(dest));
        }
      } else if (msg.action === 'after-navigation') {
        // Ember afterNavigation event
        this.iframeEl.setAttribute('data-location', msg.url);
      } else if (msg.action === 'loading') {
        this.loaded = !msg.state;
        this.updateFrameVisibility();
      } else if (msg.action === 'ready') {
        // Echo back a ping
        this.iframeEl.contentWindow.postMessage({ action: 'echo-back' });
        this.iframeEl.setAttribute('data-ready', true);
      } else if (msg.action === 'need-to-load') {
        this.loadRequired = true;
      } else if (msg.action === 'did-transition') {
        this.iframeEl.setAttribute('data-location', this.trimURL(msg.url));
        if (!this.loadRequired) {
          this.loading = false;
          this.updateFrameVisibility();
        }
      }
    },

    updateFrameVisibility() {
      if (this.loaded) {
        if (this.iframeEl) {
          this.iframeEl.classList.remove(EMBER_FRAME_HIDE_CLASS);
        }
      }
    },

    fillRoute(route) {
      if (typeof route === 'object') {
        // Fill in standard params
        if (route.params) {
          if ('cluster' in route.params) {
            route.params.cluster = this.clusterId;
          }
          if ('product' in route.params) {
            route.params.product = this.productId;
          }
        }
      }

      return route;
    }
  }
};
</script>

<template>
  <div class="ember-page" :class="{'fixed': fixed}">
    <Loading :loading="!loaded" :mode="loaderMode" :no-delay="true" />
    <div v-if="error" class="ember-page-error">
      <div>{{ t('embedding.unavailable') }}</div>
      <button class="btn role-primary" @click="initFrame()">
        {{ t('embedding.retry') }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .fixed {
    height: calc(100vh - var(--header-height));
    left: var(--nav-width);
    position: static;
    top: var(--header-height);
    width: calc(100vw - var(--nav-width));
  }
  .ember-page {
    display: flex;
    height: 100%;
    padding: 0;
  }
  .frame {
    flex: 1;
    visibility: hidden;
  }
  .frame.pop {
    margin: -20px;
  }

  .loading {
    visibility: visible;
  }
  .ember-page-error {
    display: flex;
    align-items: center;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    > div {
      font-size: 20px;
      padding-bottom: 20px;
    }
  }
</style>
<style lang="scss">
  .ember-iframe {
    border: 0;
    left: var(--nav-width);
    height: calc(100vh - var(--header-height));
    position: absolute;
    top: var(--header-height);
    width: calc(100vw - var(--nav-width));
    visibility: show;
  }

  .ember-iframe-hidden {
    visibility: hidden;
  }
</style>
