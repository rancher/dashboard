<script>
import CreateEditView from '@/mixins/create-edit-view';
import { SECRET, LOGGING } from '@/config/types';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import CruResource from '@/components/CruResource';
import NameNsDescription from '@/components/form/NameNsDescription';
import Labels from '@/components/form/Labels';
import LabeledSelect from '@/components/form/LabeledSelect';
import Banner from '@/components/Banner';
import { PROVIDERS } from '@/models/logging.banzaicloud.io.output';
import { _VIEW } from '@/config/query-params';
import { clone } from '@/utils/object';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';

export default {
  components: {
    Banner, CruResource, Labels, LabeledSelect, NameNsDescription, Tab, Tabbed
  },

  mixins: [CreateEditView],

  async fetch() {
    await this.$store.dispatch('cluster/findAll', { type: SECRET });
  },

  data() {
    if (this.isCreate) {
      this.value.metadata.namespace = 'default';
    }

    const providers = PROVIDERS.map(provider => ({
      ...provider,
      value: provider.name,
      label: this.t(provider.labelKey)
    }));

    if (this.mode !== _VIEW) {
      this.$set(this.value, 'spec', this.value.spec || {});

      providers.forEach((provider) => {
        this.$set(this.value.spec, provider.name, this.value.spec[provider.name] || clone(provider.default));
      });
    }

    const selectedProviders = providers.filter((provider) => {
      const specProvider = this.value.spec[provider.name];
      const correctedSpecProvider = provider.name === 'forward' ? specProvider?.servers?.[0] || {} : specProvider;

      return !isEmpty(correctedSpecProvider) && !isEqual(correctedSpecProvider, provider.default);
    });

    return {
      providers,
      selectedProvider:            selectedProviders?.[0]?.value || providers[0].value,
      hasMultipleProvdersSelected: selectedProviders.length > 1,
      selectedProviders,
      LOGGING
    };
  },

  computed: {
    enabledProviders() {
      return this.providers.filter(p => p.enabled);
    },
    cruMode() {
      if (this.selectedProviders.length > 1 || !this.value.allProvidersSupported) {
        return _VIEW;
      }

      return this.mode;
    }
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },
  methods: {
    getComponent(name) {
      return require(`./providers/${ name }`).default;
    },
    launch(provider) {
      this.$refs.tabbed.select(provider.name);
    },
    willSave() {
      this.value.spec = { [this.selectedProvider]: this.value.spec[this.selectedProvider] };
    }
  }
};
</script>

<template>
  <div class="output">
    <CruResource
      :done-route="doneRoute"
      :mode="cruMode"
      :resource="value"
      :subtypes="[]"
      :validation-passed="true"
      :errors="errors"
      :can-yaml="true"
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
        :namespaced="value.type !== LOGGING.CLUSTER_OUTPUT"
      />
      <Banner v-if="selectedProviders.length > 1" color="info">
        This output is configured with multiple providers. We currently only support a single provider per output. You can view or edit the YAML.
      </Banner>
      <Banner v-else-if="!value.allProvidersSupported" color="info">
        This output is configured with providers we don't support yet. You can view or edit the YAML.
      </Banner>
      <Tabbed v-else ref="tabbed" :side-tabs="true">
        <Tab name="Output" label="Output" :weight="1">
          <div class="row">
            <div class="col span-6">
              <LabeledSelect v-model="selectedProvider" label="Output" :options="providers" :mode="mode" />
            </div>
          </div>
          <div class="spacer"></div>
          <component :is="getComponent(selectedProvider)" :value="value.spec[selectedProvider]" :namespace="value.namespace" :mode="mode" />
        </Tab>
        <Tab
          v-if="!isView"
          name="labels-and-annotations"
          :label="t('generic.labelsAndAnnotations')"
          :weight="0"
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
