<script>
import Loading from '@/components/Loading';

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
    const theme = this.$store.getters['prefs/theme'];

    return {
      iframeEl:     null,
      loaded:       true,
      loadRequired: false,
      theme,
    };
  },

  watch: {
    // TODO: We don't expect source to change
    src() {
      console.log('SOURCE CHANGED');
    }
  },

  mounted() {
    console.log('Ember Page mounted');
    this.initFrame();

    // const iframe = document.createElement('iframe');

    // console.log(iframe);
    // this.iframeEl.setAttribute('style', 'visibility: hidden; position: absolute; top: -99999px; border: none;');
    // iframe.setAttribute('src', '/ember/g/clusters');

    // this.$el.appendChild(iframe);
    window.addEventListener('message', this.receiveMessage);
    console.log('Ember Page: added event handler');
  },

  beforeDestroy() {
    window.removeEventListener('message', this.receiveMessage);
    console.log('Ember Page: removed event handler');

    // Hide the iframe
    if (this.iframeEl) {
      this.iframeEl.classList.add(EMBER_FRAME_HIDE_CLASS);
    }

    // TODO: Only do this if we never loaded the iframe - once loaded once, we can reuse the loaded iframe
    // Need to guard against situation when we left the page before the iframe loaded, in which case we do not have
    // an iframe that is ready - we should add an attribute to the iframe to indicate if it is ready
    // If we did not finish loading, then delete the iframe
  },

  computed: {
    loaderMode() {
      return this.fixed ? 'content' : 'full';
    }
  },

  methods: {
    initFrame() {
      // Add the iframe if one does not already exist

      console.log('***************************');

      let iframeEl = document.getElementById(EMBER_FRAME);
      console.log(iframeEl);
      if (iframeEl === null) {
        console.log('need to create new iframe');
        iframeEl = document.createElement('iframe');

        iframeEl.setAttribute('id', EMBER_FRAME);
        iframeEl.setAttribute('class', 'ember-iframe');
        iframeEl.classList.add(EMBER_FRAME_HIDE_CLASS);

        document.body.appendChild(iframeEl);

        console.log('created iframe');
        iframeEl.setAttribute('src', this.src);

      } else {
        console.log('IFRAME already exists');
        //iframeEl.classList.remove('ember-iframe-hidden');

        // Ensure the embedded UI uses the correct theme
        iframeEl.contentWindow.postMessage({
          action: 'set-theme',
          name: this.theme
        });
        
        // Post a message to get it to navigate
        iframeEl.contentWindow.postMessage({
          action: 'navigate',
          name: this.src
        });
      }

      console.log('*** LOADING IFRAME');
      this.iframeEl = iframeEl;
    },
    frameLoaded(e) {
      if (this.src) {
        const f = this.$refs.frame;

        console.log(f.contentWindow.location.href);
      }
    },
    receiveMessage(event) {
      // console.log('Ember Page: message received');
      // console.log(event);
      const msg = event.data;

      if (msg.action === 'navigate') {
        this.$router.replace({
          name:   'c-cluster-explorer',
          params: { cluster: msg.cluster }
        });
      } else if (msg.action === 'before-navigation') {
        // Ember willTransition event
        if (msg.url === '/g/clusters' || msg.target === 'global-admin.clusters.index') {
          this.loading = true;
          // Go to the vue clusters page
          this.$router.replace('/c/local/manager/rancher.cattle.io.cluster');
        }
      } else if (msg.action === 'after-navigation') {
        // Ember didTransition event
        // TODO
        // window.history.pushState({}, 'TITLE', msg.url);
        // console.log(msg.url);
      } else if (msg.action === 'loading') {
        this.loaded = !msg.state;
        this.updateFrameVisibility();
      } else if (msg.action === 'ready') {
        // Echo back a ping
        this.iframeEl.contentWindow.postMessage({action: 'echo-back'});
      } else if (msg.action === 'need-to-load') {
        this.loadRequired = true;
      } else if (msg.action === 'did-transition') {
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
  <div class="ember-page" :class="{'fixed': fixed}" >
    <Loading :loading="!loaded" :mode="loaderMode" :no-delay="true" />
    <!--
    <iframe
      ref="frame"
      :src="src"
      frameborder="0"
      :class="{ 'loading': loaded, 'pop': pop }"
      class="frame"
      @load="frameLoaded"
    ></iframe>
    -->
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
  }

  .ember-iframe-hidden {
    visibility: hidden;
  }
</style>
