<script>
import Loading from '@/components/Loading';

export default {
  components: { Loading },

  data() {
    return {
      iframeEl: null,
      loaded:   false,
      src:      null,
    };
  },

  mounted() {
    console.log('mounted **');

    console.log('adding event handler');

    // window.addEventListener('message', this.receiveMessage);

    console.log('added event handler');

    // const iframe = document.createElement('iframe');

    // console.log(iframe);
    // this.iframeEl.setAttribute('style', 'visibility: hidden; position: absolute; top: -99999px; border: none;');
    // iframe.setAttribute('src', '/ember/g/clusters');

    // this.$el.appendChild(iframe);
    this.src = '/g/clusters';
  },

  beforeDestroy() {
    window.removeEventListener('message', this.receiveMessage);
    console.log('removed event handler');
  },

  methods: {
    frameLoaded() {
      if (this.src) {
        console.log('iframe has been loaded');
        this.loaded = true;
      }
    },

    receiveMessage(event) {
      console.log('message received');
      console.log(event);
    }
  }
};
</script>

<template>
  <div>
    <Loading :loading="!loaded" />
    <iframe
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
