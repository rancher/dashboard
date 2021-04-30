<script>
import Loading from '@/components/Loading';
import { mapGetters } from 'vuex';

const EMBER_FRAME = 'ember-iframe';
const EMBER_FRAME_HIDE_CLASS = 'ember-iframe-hidden';

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
    };
  },

  computed: {
    ...mapGetters({ theme: 'prefs/theme' }),

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
    window.addEventListener('message', this.receiveMessage);
    this.initFrame();
  },

  beforeDestroy() {
    window.removeEventListener('message', this.receiveMessage);

    // Hide the iframe
    if (this.iframeEl) {
      this.iframeEl.classList.add(EMBER_FRAME_HIDE_CLASS);
    }
  },

  methods: {

    // TODO: Need to check that the IFRAME loaded fully, otherwise we won't be able to navigate within
    // the already loaded frame
    initFrame() {
      // Add the iframe if one does not already exist
      let iframeEl = document.getElementById(EMBER_FRAME);

      if (iframeEl === null) {
        iframeEl = document.createElement('iframe');
        iframeEl.setAttribute('id', EMBER_FRAME);
        iframeEl.setAttribute('class', 'ember-iframe');
        iframeEl.classList.add(EMBER_FRAME_HIDE_CLASS);
        document.body.appendChild(iframeEl);
        iframeEl.setAttribute('src', this.src);
      } else {
        // Post a message to get it to navigate
        iframeEl.contentWindow.postMessage({
          action: 'navigate',
          name:   this.src
        });

        // Ensure iframe gets the latest theme if it has changed
        this.notifyTheme(this.theme);

        const currentlUrl = iframeEl.getAttribute('data-location');

        let src = this.src;

        if (this.src.endsWith('/')) {
          src = src.substr(0, this.src.length - 1);
        }
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
        // TODO: Maintain a map of routes that we want to intercept
        if (msg.url === '/g/clusters' || msg.target === 'global-admin.clusters.index') {
          this.loading = true;
          // Go to the vue clusters page when the Ember app goes back to the Cluster page
          this.$router.replace('/c/local/manager/provisioning.cattle.io.cluster');
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
        // TODO: Add an attribue to the iframe so we know it has loaded the Ember App and can be re-used
      } else if (msg.action === 'need-to-load') {
        this.loadRequired = true;
      } else if (msg.action === 'did-transition') {
        this.iframeEl.setAttribute('data-location', msg.url);
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
    }
  }
};
</script>

<template>
  <div class="ember-page" :class="{'fixed': fixed}">
    <Loading :loading="!loaded" :mode="loaderMode" :no-delay="true" />
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
