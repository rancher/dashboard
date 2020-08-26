<script>
import SimpleBox from '@/components/SimpleBox';
import { mapGetters } from 'vuex';
import { NAME, CHART_NAME } from '@/config/product/istio';
import InstallRedirect from '@/utils/install-redirect';

export default {
  components: { SimpleBox },

  middleware: InstallRedirect(NAME, CHART_NAME),

  computed: {
    ...mapGetters({ theme: 'prefs/theme' }),

    kialiLogo() {
      // @TODO move to theme css
      return require(`~/assets/images/kiali-${ this.theme }.svg`);
    },

    prometheusLogo() {
      // @TODO move to theme css
      return require(`~/assets/images/prometheus-${ this.theme }.svg`);
    },

    kialiUrl() {
      return '/api/v1/namespaces/istio-system/services/http:kiali:20001/proxy/';
    },

    prometheusUrl() {
      return '/api/v1/namespaces/istio-system/services/http:prometheus:9090/proxy/';
    },

    target() {
      return '_blank';
    },

    rel() {
      return 'noopener noreferrer nofollow';
    }
  },

  methods: {
    launchKiali() {
      this.$refs.kiali.click();
    },

    launchPrometheus() {
      this.$refs.prometheus.click();
    }
  },
};
</script>

<template>
  <div>
    <h1>Overview</h1>
    <div class="row">
      <div class="col span-6">
        <SimpleBox class="box" @click="launchKiali">
          <div class="logo-container">
            <img class="logo" :src="kialiLogo" />
          </div>
          <div class="button">
            <a ref="kiali" class="btn role-primary m-20" :href="kialiUrl" :target="target" :rel="rel">
              Launch Kiali <i class="icon icon-external-link ml-10" />
            </a>
          </div>
        </SimpleBox>
      </div>
      <div class="col span-6">
        <SimpleBox class="box" @click="launchPrometheus">
          <div class="logo-container">
            <img class="logo" :src="prometheusLogo">
          </div>
          <div class="button">
            <a ref="prometheus" class="btn role-primary m-20" :href="prometheusUrl" :target="target" :rel="rel">
              Launch Prometheus <i class="icon icon-external-link ml-10" />
            </a>
          </div>
        </SimpleBox>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $logo-height: 120px;

  .box {
    cursor: pointer;
  }

  .logo-container {
    height: $logo-height;
    text-align: center;
    margin-bottom: 20px;
  }

  .button {
    text-align: center;
  }

  .logo {
    max-width: 80%;
    height: $logo-height;
  }
</style>
