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
      return require(`~/assets/images/logo-color-kiali.svg`);
    },

    kialiUrl() {
      return this.kialiService ? this.kialiService.proxyUrl('http', '20001') : null;
    },

    monitoringUrl() {
      return this.$router.resolve({
        name:   'c-cluster-monitoring',
        params: { cluster: this.$route.params.cluster }
      }).href;
    },

    target() {
      return '_blank';
    },

    rel() {
      return 'noopener noreferrer nofollow';
    },
  },

  methods: {
    launchKiali(e) {
      // rancher-monitoring link in Kiali description was clicked
      if (e.srcElement?.tagName === 'A') {
        return;
      }
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
      <div :class="{'disabled':!kialiUrl}" class="box link-container">
        <span
          class="link-content pull-right"
          @click="launchKiali"
        >
          <div class="link-logo">
            <img :src="kialiLogo" />
          </div>
          <div class="link-content">
            <a
              ref="kiali"
              :disabled="!kialiUrl"
              :href="kialiUrl"
              :target="target"
              :rel="rel"
              @click.stop
            >
              <t k="istio.links.label" />
              <i class="icon icon-external-link pull-right" />
            </a>
            <hr />
            <div class="description">
              <span v-html="t('istio.links.description', {link: monitoringUrl}, true)" />
            </div>
          </div>
        </span>
      </div>
    </div>
  </div>
</template>
