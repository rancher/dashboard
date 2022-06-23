<template>
  <div>
    <div v-if="connected && disconnected">
      <main class="error">
        <div class="text-center">
          <BrandImage file-name="error-desert-landscape.svg" width="900" height="300" />
          <h1>
            {{ t('harvester.notification.title.warning') }}
          </h1>
          <h2 class="text-secondary mt-20">
            {{ t('vncConsole.error.message') }}
          </h2>
        </div>
      </main>
    </div>
    <div
      ref="view"
    />
  </div>
</template>

<script>
import RFB from '@novnc/novnc/core/rfb';
import BrandImage from '@shell/components/BrandImage';

export default {
  props: {
    url: {
      type:    String,
      default: ''
    }
  },

  components: { BrandImage },

  data() {
    return {
      rfb:          null,
      connected:    false,
      disconnected: false,
    };
  },

  mounted() {
    this.$nextTick(() => {
      const rfb = new RFB(this.$refs.view, this.url);

      rfb.addEventListener('connect', () => {
        this.connected = true;
      });
      rfb.addEventListener('disconnect', (e) => {
        this.disconnected = true;
      });

      this.rfb = rfb;
    });
  },

  methods: {
    disconnect() {
      this.rfb.disconnect();
    },

    ctrlAltDelete() {
      this.rfb.sendCtrlAltDel();
    },

    sendKey(keysym, code, down) {
      this.rfb.sendKey(keysym, code, down);
    }
  }
};
</script>

<style lang="scss" scoped>
  .error {
    overflow: hidden;

    .row {
      align-items: center;
    }

    h1 {
      font-size: 5rem;
    }

    .desert-landscape {
      img {
        max-width: 100%;
      }
    }
  }
</style>
