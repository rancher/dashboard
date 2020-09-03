<script>
import SimpleBox from '@/components/SimpleBox';
import { mapGetters } from 'vuex';
import { NAME, CHART_NAME } from '@/config/product/istio';
import InstallRedirect from '@/utils/install-redirect';
import { ISTIO } from '@/config/types';
import { allHash } from '@/utils/promise';
import { AGE, NAME as NAME_HEADER } from '@/config/table-headers';
import SortableTable from '@/components/SortableTable';
import Glance from '@/components/Glance';
import Banner from '@/components/Banner';
export default {
  components: {
    SimpleBox,
    SortableTable,
    Glance,
    Banner
  },

  middleware: InstallRedirect(NAME, CHART_NAME),

  async fetch() {
    const hash = await allHash({
      destinationRules: this.$store.dispatch('cluster/findAll', { type: ISTIO.DESTINATION_RULE }),
      gateways:         this.$store.dispatch('cluster/findAll', { type: ISTIO.GATEWAY }),
      virtualServices:  this.$store.dispatch('cluster/findAll', { type: ISTIO.VIRTUAL_SERVICE }),
    });

    for (const crd in hash) {
      this[crd] = hash[crd];
    }
  },

  data() {
    return {
      destinationRules: [], gateways: [], virtualServices: []
    };
  },

  computed: {
    ...mapGetters({ theme: 'prefs/theme', t: 'i18n/t' }),

    kialiLogo() {
      // @TODO move to theme css
      return require(`~/assets/images/kiali-${ this.theme }.svg`);
    },

    kialiUrl() {
      return '/api/v1/namespaces/istio-system/services/http:rancher-istio-kiali:20001/proxy/';
    },

    target() {
      return '_blank';
    },

    rel() {
      return 'noopener noreferrer nofollow';
    },

    destinationRuleHeaders() {
      return [
        { ...NAME_HEADER, width: 200 },

        {
          name:  'namespace',
          label: this.t('tableHeaders.namespace'),
          value: 'metadata.namespace',
          sort:  ['namespace'],
          width: 200
        },
        {
          name:  'host',
          label: this.t('tableHeaders.host', { count: 1 }),
          value: 'spec.host',
          sort:  ['spec.host']
        },
        AGE
      ];
    },

    virtualServiceHeaders() {
      return [
        { ...NAME_HEADER, width: 200 },

        {
          name:  'namespace',
          label: this.t('tableHeaders.namespace'),
          value: 'metadata.namespace',
          sort:  ['namespace'],
          width: 200
        },
        {
          name:      'hosts',
          label:     this.t('tableHeaders.host', { count: 2 }),
          value:     'spec.hosts',
          sort:      ['spec.host'],
          formatter: 'list'
        },
        AGE
      ];
    },

    gatewayHeaders() {
      return [
        { ...NAME_HEADER, width: 200 },

        {
          name:  'namespace',
          label: this.t('tableHeaders.namespace'),
          value: 'metadata.namespace',
          sort:  ['namespace'],
          width: 200
        },
        {
          name:      'hosts',
          label:     this.t('tableHeaders.host', { count: 2 }),
          value:     'hosts',
          sort:      ['spec.host'],
          formatter: 'list'
        },
        AGE
      ];
    },

    gatewayRows() {
      return this.gateways.map((gateway) => {
        const hosts = gateway.spec.servers.reduce((hosts, server) => {
          hosts.push(...server.hosts);

          return hosts;
        }, []);

        gateway.hosts = hosts;

        return gateway;
      });
    },
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
    <Glance class="mb-20" :slots="['kiali']">
      <template #kiali>
        <div class="box" @click="launchKiali">
          <div class="logo-container">
            <img class="logo" :src="kialiLogo" />
          </div>
          <a ref="kiali" :href="kialiUrl" :target="target" :rel="rel">
            <i class="icon icon-2x icon-external-link ml-10" />
          </a>
        </div>
      </template>
    </Glance>
    <div class="row mb-20">
      <div class="col span-6 p-15">
        <h3>{{ t('istio.titles.description') }}</h3>
        <div class="mb-10">
          <t k="istio.description" :raw="true" />
        </div>
        <t k="istio.crdDescription" :raw="true" />
      </div>
      <div class="col span-6">
        <SimpleBox>
          <h3>{{ t('istio.howTo.title') }}</h3>
          <Banner color="warning">
            <div :raw="true" v-html="t('istio.howTo.warning')" />
          </Banner>
          <div :raw="true" v-html="t('istio.howTo.body')" />
        </SimpleBox>
      </div>
    </div>
    <div>
      <h3>{{ t('istio.titles.destinationRules') }}</h3>
      <SortableTable
        v-if="destinationRules.length"
        :table-actions="false"
        :row-actions="false"
        :search="false"
        :rows="destinationRules"
        key-field="id"
        :headers="destinationRuleHeaders"
      />
    </div>
    <div class="spacer" />
    <div>
      <h3>{{ t('istio.titles.virtualServices') }}</h3>
      <SortableTable
        v-if="virtualServices.length"
        :table-actions="false"
        :row-actions="false"
        :search="false"
        :rows="virtualServices"
        key-field="id"
        :headers="virtualServiceHeaders"
      />
    </div>
    <div class="spacer" />

    <div>
      <h3>{{ t('istio.titles.gateways') }}</h3>
      <SortableTable
        v-if="gatewayRows.length"
        :table-actions="false"
        :row-actions="false"
        :search="false"
        :rows="gatewayRows"
        key-field="id"
        :headers="gatewayHeaders"
      />
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
  }

  .logo-container {
    height: $logo-height;
    text-align: center;
  }

  .logo {
    height: $logo-height;
  }
</style>
