<script>
import Loading from '@/components/Loading';

export default {
  components: { Loading },

  // layout: 'clusterManager',

  data() {
    return {
      iframeEl: null,
      loaded:   false,
      src:      null,
    };
  },

  watch: {
    $route(to, from) {
      console.log('Route changed');
      console.log(to);
      console.log(from);
    }
  },

  mounted() {
    console.log('mounted');
    this.src = '/g/clusters';

    // const iframe = document.createElement('iframe');

    // console.log(iframe);
    // this.iframeEl.setAttribute('style', 'visibility: hidden; position: absolute; top: -99999px; border: none;');
    // iframe.setAttribute('src', '/ember/g/clusters');

    // this.$el.appendChild(iframe);
    window.addEventListener('message', this.receiveMessage);
    console.log('added event handler');
  },

  beforeDestroy() {
    window.removeEventListener('message', this.receiveMessage);
    console.log('removed event handler');
  },

  methods: {
    frameLoaded(e) {
      if (this.src) {
        console.log('iframe has been loaded');
        // this.loaded = true;
        console.log(e);
        console.log(this.$refs.frame);
        const f = this.$refs.frame;

        console.log(f.contentWindow.location.href);
      }
    },
    onbeforeunload(e) {
      console.log(e);
    },
    receiveMessage(event) {
      console.log('message received');
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
        window.history.pushState({}, 'TITLE', msg.url);
      } else if (msg.action === 'loading') {
        this.loaded = !msg.state;
      }
    }
  }
};
</script>

<template>
  <div>
    <Loading :loading="!loaded" />
    <iframe
      ref="frame"
      :src="src"
      frameborder="0"
      :class="{ 'loading': loaded }"
      class="frame"
      @load="frameLoaded"
    ></iframe>
  </div>
</template>

<style lang="scss" scoped>

  .frame {
    flex: 1;
    visibility: hidden;
    margin: -20px;
  }

  .loading {
    visibility: visible;
  }
</style>
