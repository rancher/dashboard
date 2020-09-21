<script>
import CreateEditView from '@/mixins/create-edit-view';
import { SECRET } from '@/config/types';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import CruResource from '@/components/CruResource';
import NameNsDescription from '@/components/form/NameNsDescription';
import ToggleGradientBox from '@/components/ToggleGradientBox';
import Labels from '@/components/form/Labels';
import cloneDeep from 'lodash/cloneDeep';
import Banner from '@/components/Banner';

export default {
  components: {
    Banner, CruResource, Labels, NameNsDescription, Tab, Tabbed, ToggleGradientBox
  },

  mixins: [CreateEditView, ToggleGradientBox],

  async fetch() {
    await this.$store.dispatch('cluster/findAll', { type: SECRET });
  },

  data() {
    if (this.isCreate) {
      this.value.metadata.namespace = 'default';
    }

    const theme = this.$store.getters['prefs/theme'];
    const providers = [
      {
        name:    'elasticsearch',
        label:   'Elasticsearch',
        enabled: false,
        default: {},
        logo:    require(`~/assets/images/logo-${ theme }-elasticsearch.svg`)
      },
      {
        name:    'splunkHec',
        label:   'Splunk',
        enabled: false,
        default: {},
        logo:    require(`~/assets/images/logo-${ theme }-splunk.svg`)
      },
      {
        name:    'kafka',
        label:   'Kafka',
        enabled: false,
        default: { format: { type: 'json' } },
        logo:    require(`~/assets/images/logo-${ theme }-kafka.svg`)
      },
      {
        name:    'forward',
        label:   'Fluentd',
        enabled: false,
        default: { servers: [{}] },
        logo:    require(`~/assets/images/logo-${ theme }-fluentd.svg`)
      }
    ];

    this.value.spec = this.value.spec || {};
    const specValue = cloneDeep(this.value.spec);

    providers.forEach((provider) => {
      specValue[provider.name] = specValue[provider.name] || provider.default;
      const specProvider = specValue[provider.name];
      const correctedSpecProvider = provider.name === 'forward' ? specProvider.servers[0] : specProvider;
      const specProviderKeys = Object.keys(correctedSpecProvider || {}).filter(key => key !== 'format');

      provider.enabled = specProviderKeys.length > 0;
    });

    return { providers, specValue };
  },

  computed: {
    enabledProviders() {
      return this.providers.filter(p => p.enabled);
    }
  },

  mounted() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  methods: {
    getComponent(name) {
      return require(`./providers/${ name }`).default;
    },
    willSave() {
      this.value.spec = cloneDeep(this.specValue);

      this.providers.forEach((provider) => {
        if (this.value.spec[provider.name] && !provider.enabled) {
          delete this.value.spec[provider.name];
        }
      });
    },
    launch(provider) {
      this.$refs.tabbed.select(provider.name);
    }
  },
};
</script>

<template>
  <div class="output">
    <CruResource
      :done-route="doneRoute"
      :mode="mode"
      :resource="value"
      :subtypes="[]"
      :validation-passed="true"
      :errors="errors"
      @error="e=>errors = e"
      @finish="save"
      @cancel="done"
    >
      <NameNsDescription
        v-if="!isView"
        :value="value"
        :mode="mode"
        name-label="generic.name"
        :register-before-hook="registerBeforeHook"
      />
      <Tabbed ref="tabbed" :side-tabs="true">
        <Tab v-if="!isView" name="overview" :label="t('logging.output.selectOutputs')" :weight="0">
          <Banner class="mt-0" color="info">
            {{ t('logging.output.selectBanner') }}
          </Banner>
          <ToggleGradientBox v-for="(provider, i) in providers" :key="i" v-model="provider.enabled" class="mr-20">
            <div class="logo-container">
              <img class="logo" :src="provider.logo" /> {{ provider.label }}
            </div>
          </ToggleGradientBox>
        </Tab>
        <Tab v-for="(provider, i) in enabledProviders" :key="i" :name="provider.name" :label="provider.label" :weight="i + 1">
          <div class="provider mb-10">
            <h1>
              {{ provider.label }}
            </h1>
          </div>

          <component :is="getComponent(provider.name)" :value="specValue[provider.name]" :disabled="!provider.enabled" :mode="mode" />
        </Tab>
        <Tab
          v-if="!isView"
          name="labels-and-annotations"
          :label="t('generic.labelsAndAnnotations')"
          :weight="1000"
        >
          <Labels
            default-container-class="labels-and-annotations-container"
            :value="value"
            :mode="mode"
            :display-side-by-side="false"
          />
        </Tab>
      </Tabbed>
    </CruResource>
  </div>
</template>

<style lang="scss">
.output {
  .provider {
    h1 {
      display: inline-block;
    }
  }

  .toggle-gradient-box {
    display: inline-block;

    .logo-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-width: 160px;
      padding: 15px 20px;

      .logo {
        height: 50px;
      }
    }
  }
}
</style>
