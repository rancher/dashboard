<script>
import Loading from '@/components/Loading';

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
      iframeEl: null,
      loaded:   false,
    };
  },

  watch: {
    $route(to, from) {
      console.log('*********************************************************************************');
      console.log('Ember Page: Route changed');
      console.log(to);
      console.log(from);
      window.change = {
        to,
        from
      };
    }
  },

  mounted() {
    console.log('Ember Page mounted');

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
  },

  computed: {
    loaderMode() {
      return this.fixed ? 'content' : 'full';
    }
  },

  methods: {
    frameLoaded(e) {
      if (this.src) {
        const f = this.$refs.frame;

        console.log(f.contentWindow.location.href);
      }
    },
    onbeforeunload(e) {
      console.log('Ember Page: Before unload');
      console.log(e);
    },
    receiveMessage(event) {
      console.log('Ember Page: message received');
      console.log(event);
      const msg = event.data;

      if (msg.action === 'navigate') {
        console.log('navigate');
        this.$router.replace({
          name:   'c-cluster-explorer',
          params: { cluster: msg.cluster }
        });
      } else if (msg.action === 'navigation') {
        console.log('navigation');
        // TODO
        //window.history.pushState({}, 'TITLE', msg.url);

        console.log(msg.url);
        if (msg.url === '/g/clusters') {
          this.loading = true;
          // Go to the vue clusters page
          this.$router.replace('/c/local/manager/rancher.cattle.io.cluster');
        }
      } else if (msg.action === 'loading') {
        this.loaded = !msg.state;
      }
    }
  }
};
</script>

<template>
  <div class="ember-page" :class="{'fixed': fixed}" >
    <Loading :loading="!loaded" :mode="loaderMode" :no-delay="true" />
    <iframe
      ref="frame"
      :src="src"
      frameborder="0"
      :class="{ 'loading': loaded, 'pop': pop }"
      class="frame"
      @load="frameLoaded"
    ></iframe>
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
