<script>
import CreateEditView from '@/mixins/create-edit-view';
import { SECRET } from '@/config/types';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import CruResource from '@/components/CruResource';
import NameNsDescription from '@/components/form/NameNsDescription';
import ToggleGradientBox from '@/components/ToggleGradientBox';
import Labels from '@/components/form/Labels';
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

    const providers = [
      {
        name:    'elasticsearch',
        label:   this.t('logging.outputProviders.elasticsearch'),
        enabled: false,
        default: {},
        logo:    require(`~/assets/images/logo-color-elasticsearch.svg`)
      },
      {
        name:    'splunkHec',
        label:   this.t('logging.outputProviders.splunkHec'),
        enabled: false,
        default: {},
        logo:    require(`~/assets/images/logo-color-splunk.svg`)
      },
      {
        name:    'kafka',
        label:   this.t('logging.outputProviders.kafka'),
        enabled: false,
        default: { format: { type: 'json' } },
        logo:    require(`~/assets/images/logo-color-kafka.svg`)
      },
      {
        name:    'forward',
        label:   this.t('logging.outputProviders.forward'),
        enabled: false,
        default: { servers: [{}] },
        logo:    require(`~/assets/images/logo-color-fluentd.svg`)
      }
    ];

    this.value.spec = this.value.spec || {};

    providers.forEach((provider) => {
      this.value.spec[provider.name] = this.value.spec[provider.name] || provider.default;
      const specProvider = this.value.spec[provider.name];
      const correctedSpecProvider = provider.name === 'forward' ? specProvider.servers[0] : specProvider;
      const specProviderKeys = Object.keys(correctedSpecProvider || {}).filter(key => key !== 'format');

      provider.enabled = specProviderKeys.length > 0;
      if (!provider.enabled) {
        delete this.value.spec[provider.name];
      }
    });

    return { providers };
  },

  computed: {
    enabledProviders() {
      return this.providers.filter(p => p.enabled);
    }
  },
  watch: {
    providers: {
      handler() {
        this.providers.forEach((provider) => {
          if (this.value.spec[provider.name] && !provider.enabled) {
            delete this.value.spec[provider.name];
          } else if (provider.enabled) {
            this.value.spec[provider.name] = this.value.spec[provider.name] || provider.default;
          }
        });
      },
      deep: true
    }
  },
  methods: {
    getComponent(name) {
      return require(`./providers/${ name }`).default;
    },
    launch(provider) {
      this.$refs.tabbed.select(provider.name);
    }
  }
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
        label="generic.name"
        :register-before-hook="registerBeforeHook"
      />
      <Tabbed ref="tabbed" :side-tabs="true">
        <Tab v-if="!isView" name="overview" :label="t('logging.output.selectOutputs')" :weight="100">
          <Banner class="mt-0" color="info">
            {{ t('logging.output.selectBanner') }}
          </Banner>
          <div class="box-container">
            <ToggleGradientBox v-for="(provider, i) in providers" :key="i" v-model="provider.enabled">
              <div class="logo">
                <img :src="provider.logo" />
              </div>
              <h4 class="name">
                {{ provider.label }}
              </h4>
            </ToggleGradientBox>
          </div>
        </Tab>
        <Tab v-for="(provider, i) in enabledProviders" :key="i" :name="provider.name" :label="provider.label" :weight="enabledProviders.length - i + 1">
          <div class="provider mb-10">
            <h1>
              {{ provider.label }}
            </h1>
          </div>

          <component :is="getComponent(provider.name)" :value="value.spec[provider.name]" :disabled="!provider.enabled" :mode="mode" />
        </Tab>
        <Tab
          v-if="!isView"
          name="labels-and-annotations"
          :label="t('generic.labelsAndAnnotations')"
          :weight="-1"
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
  $chart: 110px;
  $side: 15px;
  $margin: 10px;
  $logo: 60px;

.output {
  .provider {
    h1 {
      display: inline-block;
    }
  }

  .box-container {
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    margin: 0 -1*$margin;

    @media only screen and (min-width: map-get($breakpoints, '--viewport-4')) {
      .toggle-gradient-box {
        width: 100%;
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
      .toggle-gradient-box {
        width: calc(50% - 2 * #{$margin});
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-9')) {
      .toggle-gradient-box {
        width: calc(33.33333% - 2 * #{$margin});
      }
    }
    @media only screen and (min-width: map-get($breakpoints, '--viewport-12')) {
      .toggle-gradient-box {
        width: calc(25% - 2 * #{$margin});
      }
    }

    .toggle-gradient-box {
      margin: $margin;
      padding: $margin;
      position: relative;
      border-radius: calc( 1.5 * var(--border-radius));

      &:hover {
        box-shadow: 0 0 30px var(--shadow);
        transition: box-shadow 0.1s ease-in-out;
        cursor: pointer;
      }

      .side-label {
        transform: rotate(180deg);
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        min-width: calc(1.5 * var(--border-radius));
        width: $side;
        border-top-right-radius: calc( 1.5 * var(--border-radius));
        border-bottom-right-radius: calc( 1.5 * var(--border-radius));

        label {
          text-align: center;
          writing-mode: tb;
          height: 100%;
          padding: 0 2px;
          display: block;
          white-space: no-wrap;
          text-overflow: ellipsis;
        }
      }

      .logo {
        text-align: center;
        width: $logo;
        height: $logo;
        border-radius: calc(2 * var(--border-radius));
        overflow: hidden;
        background-color: white;
        display: inline-block;
        vertical-align: middle;

        img {
          width: $logo - 4px;
          height: $logo - 4px;
          object-fit: contain;
          position: relative;
          top: 2px;
        }
      }

      &:hover {
        background-position: right center;
      }

      .name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 0;
        display: inline-block;
        vertical-align: middle;
      }
    }
  }
}
</style>
