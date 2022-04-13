<script>
import Loading from '@shell/components/Loading';
import { mapGetters, mapState } from 'vuex';
import { NAME as MANAGER } from '@shell/config/product/manager';
import { CAPI, MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { findEmberPage, clearEmberInactiveTimer, startEmberInactiveTimer, EMBER_FRAME } from '@shell/utils/ember-page';

const EMBER_FRAME_HIDE_CLASS = 'ember-iframe-hidden';
const PAGE_CHECK_TIMEOUT = 30000;
const WINDOW_MANAGER = 'windowmanager';

// Pages that we should intercept when loaded in the IFRAME and instead
// navigate to a page in Cluster Dashboard
// example if the Ember clusters page that is navigated to when the user presses cancel on some pages
// we intercept this and go the the vue Clusters page instead
const INTERCEPTS = {
  'global-admin.clusters.index': {
    name:   'c-cluster-product-resource',
    params: {
      cluster:  '',
      product:  MANAGER,
      resource: CAPI.RANCHER_CLUSTER,
    }
  },
  'authenticated.cluster.index': {
    name:   'c-cluster-product-resource',
    params: {
      cluster:  '',
      product:  MANAGER,
      resource: CAPI.RANCHER_CLUSTER,
    }
  },
  'global-admin.catalog': {
    name:   'c-cluster-mcapps-pages-page',
    params: {
      cluster: 'local',
      product: 'mcapps',
      page:    'catalogs'
    }
  },
  'authenticated.cluster.istio.cluster-setting': { name: 'c-cluster-explorer-tools' },
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
    inline: {
      type:    String,
      default: ''
    },
    forceReuse: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {
      iframeEl:         null,
      loaded:           true,
      loadRequired:     false,
      emberCheck:       null,
      error:            false,
      heightSync:       null,
      frameHeight:      -1,
      frameWidth:       -1,
      wmHeight:         -1,
      showHeaderBanner: false,
      showFooterBanner: false,
    };
  },

  computed: {
    ...mapGetters({ theme: 'prefs/theme' }),
    ...mapGetters(['clusterId', 'productId']),
    ...mapState('wm', ['open']),
    locale() {
      return this.$store.getters['i18n/current']();
    }
  },

  watch: {
    theme(theme) {
      this.notifyTheme(theme);
    },

    // Update when source property changes
    src(nue, old) {
      if (nue !== old) {
        this.initFrame();
      }
    },

    // Watch on the window manager opening/closing
    open(nue, old) {
      if (nue !== old) {
        if (nue) {
          this.syncSize();
        } else {
          clearTimeout(this.heightSync);
          const iframeEl = findEmberPage();

          // Reset the height when the window manager is closed
          this.heightSync = null;
          this.wmHeight = -1;

          if (iframeEl) {
            iframeEl.style.height = '';
          }
        }
      }
    },
    locale() {
      this.syncLocale();
    }
  },

  mounted() {
    // Embedded page visited, so cancel time to remove IFRAME when inactive
    clearEmberInactiveTimer();
    window.addEventListener('message', this.receiveMessage);
    this.initFrame();
  },

  beforeDestroy() {
    window.removeEventListener('message', this.receiveMessage);

    if (this.heightSync) {
      clearTimeout(this.heightSync);
    }

    if (this.inline) {
      const iframeEl = findEmberPage();

      // Remove the IFRAME - we can't reuse it one its been moved inline
      if (iframeEl) {
        iframeEl.remove();
      }
    }

    // Hide the iframe
    if (this.iframeEl) {
      this.iframeEl.classList.add(EMBER_FRAME_HIDE_CLASS);
    }

    // Cancel any pending http request to check Ember UI availability
    if (this.emberCheck) {
      this.emberCheck.cancel('User left page');
    }

    // Set up a timer to remove the IFrame after a period of inactivity
    startEmberInactiveTimer();
  },

  methods: {
    addBannerClasses(elm, prefix) {
      if (!elm) {
        return;
      }

      elm.classList.remove(`${ prefix }-top-banner`);
      elm.classList.remove(`${ prefix }-one-banner`);
      elm.classList.remove(`${ prefix }-two-banners`);

      if (this.showHeaderBanner) {
        elm.classList.add(`${ prefix }-top-banner`);
        if (this.showFooterBanner) {
          elm.classList.add(`${ prefix }-two-banners`);
        }
      } else if (this.showFooterBanner) {
        elm.classList.add(`${ prefix }-one-banner`);
      }
    },

    async initFrame() {
      const bannerSetting = await this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.BANNERS);

      try {
        const parsed = JSON.parse(bannerSetting.value);

        this.showHeaderBanner = parsed.showHeader === 'true';
        this.showFooterBanner = parsed.showFooter === 'true';
      } catch {}

      this.loaded = true;
      this.loadRequired = false;

      // Get the existing iframe if it exists
      let iframeEl = findEmberPage();

      // If the iframe already exists, check if it is ready for us to reuse
      // by navigating within the app that is already loaded
      if (iframeEl !== null) {
        const ready = iframeEl.getAttribute('data-ready') === 'true';
        const lastDidLoad = iframeEl.getAttribute('data-loaded') === 'true';
        const doNotReuse = !!this.inline && !this.forceReuse;
        // Was not inline but now is - can't reuse
        const inlineChanged = !!this.inline && (iframeEl.parentElement === document.body);

        if (!ready || doNotReuse || !lastDidLoad || inlineChanged) {
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

          // Make a head request to a known asset of the Ember UI
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
        iframeEl.classList.add(EMBER_FRAME_HIDE_CLASS);

        if (this.inline) {
          const frameParent = document.getElementById(this.inline);

          frameParent.appendChild(iframeEl);
        } else {
          document.body.append(iframeEl);
        }
        iframeEl.setAttribute('src', this.src);
      } else {
        // Reset scroll position to top
        if (iframeEl.contentWindow?.scrollTo) {
          iframeEl.contentWindow.scrollTo(0, 0);
        }

        // Post a message to navigate within the existing app
        iframeEl.contentWindow.postMessage({
          action: 'navigate',
          name:   this.src
        });

        // Ensure iframe gets the latest theme if it has changed
        this.notifyTheme(this.theme);

        const currentUrl = iframeEl.contentWindow.location.pathname;
        const src = this.trimURL(this.src);

        if (src !== currentUrl) {
          iframeEl.classList.add(EMBER_FRAME_HIDE_CLASS);
        } else {
          iframeEl.classList.remove(EMBER_FRAME_HIDE_CLASS);
        }
      }

      this.iframeEl = iframeEl;

      if (!this.inline) {
        iframeEl.classList.add('ember-iframe');
        iframeEl.classList.remove('ember-iframe-inline');
        this.addBannerClasses(this.$refs.emberPage, 'fixed');
        this.addBannerClasses(iframeEl, 'ember-iframe');

        // If the window manager is open, sync the size
        if (this.open) {
          this.syncSize();
        }
      } else {
        iframeEl.classList.remove('ember-iframe');
        iframeEl.classList.add('ember-iframe-inline');
        iframeEl.height = 0;
        this.syncSize();
      }
    },

    syncSize() {
      if (this.heightSync) {
        clearTimeout(this.heightSync);
      }

      this.heightSync = setTimeout(() => {
        this.dosyncSize();
        this.syncSize();
      }, 500);
    },

    dosyncSize() {
      if (this.inline) {
        const iframeEl = findEmberPage();
        const doc = iframeEl.contentWindow.document;
        const app = doc.getElementById('application');
        const h = app?.offsetHeight;

        if (h && this.frameHeight !== h) {
          this.frameHeight = h;
          iframeEl.height = h;
        }

        const frameParent = document.getElementById(this.inline);
        const w = frameParent.offsetWidth;

        if (w && this.frameWidth !== w) {
          this.frameWidth = w;
          iframeEl.width = w;
        }
      } else {
        // Ensure the height takes into count the window manger height
        const wm = document.getElementById(WINDOW_MANAGER);

        if (wm) {
          const wmh = wm.offsetHeight;

          if (wmh !== this.wmHeight) {
            // Adjust the bottom
            const iframeEl = findEmberPage();

            iframeEl.style.height = `calc(100vh - var(--header-height) - ${ wmh }px)`;
            this.wmHeight = wmh;
          }
        }
      }
    },

    notifyTheme(theme) {
      const iframeEl = findEmberPage();

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
        this.$emit('before-nav', msg.target);

        // Ember willTransition event
        if (INTERCEPTS[msg.target]) {
          const dest = INTERCEPTS[msg.target];

          if (this.isCurrentRoute(dest)) {
            this.setLoaded(true);

            return;
          }

          this.setLoaded(false);
          this.$router.replace(this.fillRoute(dest));
        }
      } else if (msg.action === 'loading') {
        this.setLoaded(!msg.state);
        this.updateFrameVisibility();
      } else if (msg.action === 'ready') {
        // Echo back a ping
        this.iframeEl.contentWindow.postMessage({ action: 'echo-back' });
        this.iframeEl.setAttribute('data-ready', true);

        const doc = this.iframeEl.contentWindow?.document?.body;

        if (this.inline) {
          doc.classList.add('embedded-no-overflow');
        } else {
          doc.classList.remove('embedded-no-overflow');
        }
        this.syncLocale();
      } else if (msg.action === 'need-to-load') {
        this.loadRequired = true;
      } else if (msg.action === 'did-transition') {
        if (!this.loadRequired) {
          this.setLoaded(true);
          this.updateFrameVisibility();
          this.dosyncSize();
        }
      } else if (msg.action === 'dashboard') {
        this.iframeEl.setAttribute('data-ready', false);
        this.$router.replace(msg.page);
      } else if (msg.action === 'reload') {
        this.loaded = false;
        this.iframeEl.remove();
        this.initFrame();
      } else if ( msg.action === 'logout' ) {
        this.loaded = false;
        this.iframeEl.remove();
        this.initFrame();
        this.$store.dispatch('auth/logout');
      }
    },

    setLoaded(loaded) {
      this.loaded = loaded;
      if (this.iframeEl) {
        this.iframeEl.setAttribute('data-loaded', loaded);
      }
    },

    updateFrameVisibility() {
      if (this.loaded) {
        if (this.iframeEl) {
          this.iframeEl.classList.remove(EMBER_FRAME_HIDE_CLASS);

          // Notify the embedded UI of the primary and primary text colors
          const primary = window.getComputedStyle(document.body).getPropertyValue('--primary');
          const primaryText = window.getComputedStyle(document.body).getPropertyValue('--primary-text');

          this.iframeEl.contentWindow.postMessage({
            action: 'colors',
            primary,
            primaryText,
          });
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
    },

    isCurrentRoute(route) {
      const current = this.$route;

      if (current.name === route.name) {
        let same = true;

        Object.keys(current.params).forEach((p) => {
          if (route.params[p] !== current.params[p]) {
            same = false;
          }
        });

        return same;
      }

      return false;
    },

    syncLocale() {
      const iframeEl = findEmberPage();

      iframeEl?.contentWindow?.ls('user-language')?.sideLoadLanguage(this.locale);
    }
  }
};
</script>

<template>
  <div ref="emberPage" class="ember-page">
    <Loading v-if="!inline" :loading="!loaded" mode="content" :no-delay="true" />
    <div v-if="inline && !loaded" class="inline-loading" v-html="t('generic.loading', {}, true)" />
    <div v-if="error" class="ember-page-error">
      <div>{{ t('embedding.unavailable') }}</div>
      <button class="btn role-primary" @click="initFrame()">
        {{ t('embedding.retry') }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $banner-height: 2em;

  .fixed-top-banner {
    top: calc(#{$banner-height} + var(--header-height));
  }

  .fixed-one-banner {
    height: calc(100vh - var(--header-height) - #{$banner-height});
  }

  .fixed-two-banners {
    height: calc(100vh - var(--header-height) - #{$banner-height} - #{$banner-height});
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
  .inline-loading {
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 10px;
    text-align: center;
    width: 100%;
  }
</style>
<style lang="scss">
  $banner-height: 2em;

  .ember-iframe {
    border: 0;
    left: var(--nav-width);
    height: calc(100vh - var(--header-height));
    position: absolute;
    top: var(--header-height);
    width: calc(100vw - var(--nav-width));
    visibility: show;
  }

  .ember-iframe-top-banner {
    top: calc(#{$banner-height} + var(--header-height));
  }

  .ember-iframe-one-banner {
    height: calc(100vh - var(--header-height) - #{$banner-height});
  }

  .ember-iframe-two-banners {
    height: calc(100vh - var(--header-height) - #{$banner-height} - #{$banner-height});
  }

  .ember-iframe-inline {
    border: 0;
    overflow: hidden;
  }

  .ember-iframe-hidden {
    visibility: hidden;
  }
</style>
