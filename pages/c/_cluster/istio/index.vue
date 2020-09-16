<script>
import { mapGetters } from 'vuex';
import { NAME, CHART_NAME } from '@/config/product/istio';
import InstallRedirect from '@/utils/install-redirect';
import { SERVICE } from '@/config/types';
export default {
  components: {},

  middleware: InstallRedirect(NAME, CHART_NAME),

  async fetch() {
    try {
      this.kialiService = await this.$store.dispatch('cluster/find', { type: SERVICE, id: 'istio-system/kiali' });
    } catch {}
  },

  data() {
    return { kialiService: null };
  },

  computed: {
    ...mapGetters({ theme: 'prefs/theme', t: 'i18n/t' }),

    kialiLogo() {
      // @TODO move to theme css
      return require(`~/assets/images/kiali-${ this.theme }.svg`);
    },

    kialiUrl() {
      return this.kialiService ? this.kialiService.proxyUrl('http', '20001') : null;
    },

    target() {
      return '_blank';
    },

    rel() {
      return 'noopener noreferrer nofollow';
    },
  },

  methods: {
    launchKiali() {
      this.$refs.kiali.click();
    },
  },
};
</script>

<template>
  <div>
    <h1>Overview</h1>
    <h4 v-html="t('istio.poweredBy', {}, true)" />
    <div class="links">
      <div :class="{'disabled':!kialiUrl}" class="box link-container" @click="launchKiali">
        <div class="logo-container">
          <img class="logo" :src="kialiLogo" />
        </div>
        <a
          ref="kiali"
          :disabled="!kialiUrl"
          class="link-content pull-right"
          :href="kialiUrl"
          :target="target"
          :rel="rel"
        >
          <i class="icon icon-2x icon-external-link ml-10 pull-right" />
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $logo-height: 50px;

  .box {
    cursor: pointer;
    width: 100%;
    height: $logo-height;
    display: flex;
    align-items: center;
    &.disabled{
      cursor:   not-allowed;
    }
  }

  .logo-container {
    height: $logo-height;
    text-align: center;
  }

  .logo {
    height: $logo-height;
  }

  .links {
  display: flex;
  flex-wrap: wrap;
  width: 100%;

  .link-container {
    background-color: var(--input-bg);
    border-radius: var(--border-radius);
    border: solid 1px var(--input-border);
    display: flex;
    justify-content: space-between;
    flex-basis: 40%;
    margin: 0 10px 10px 0;
    padding: 10px;
    max-width: 325px;
    min-height: 100px;

    &:hover {
      box-shadow: 0px 0px 1px var(--outline-width) var(--outline);
    }

    > a {

      .link-content {
        display: inline-block;
      }

      .link-content {
        width: 100%;
      }
    }
  }
}
</style>
