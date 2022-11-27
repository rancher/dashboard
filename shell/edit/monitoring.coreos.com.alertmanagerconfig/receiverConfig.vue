<script>
import { MONITORING } from '@shell/config/types';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import CruResource from '@shell/components/CruResource';
import { LabeledInput } from '@components/Form/LabeledInput';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import CreateEditView from '@shell/mixins/create-edit-view';
import jsyaml from 'js-yaml';
import ButtonDropdown from '@shell/components/ButtonDropdown';
import { _CREATE, _VIEW } from '@shell/config/query-params';

export const RECEIVERS_TYPES = [
  {
    name:  'slack',
    label: 'monitoringReceiver.slack.label',
    title: 'monitoringReceiver.slack.title',
    info:  'monitoringReceiver.slack.info',
    key:   'slackConfigs',
    logo:  require(`@shell/assets/images/vendor/slack.svg`)
  },
  {
    name:  'email',
    label: 'monitoringReceiver.email.label',
    title: 'monitoringReceiver.email.title',
    key:   'emailConfigs',
    logo:  require(`@shell/assets/images/vendor/email.svg`)
  },
  {
    name:  'pagerduty',
    label: 'monitoringReceiver.pagerduty.label',
    title: 'monitoringReceiver.pagerduty.title',
    info:  'monitoringReceiver.pagerduty.info',
    key:   'pagerdutyConfigs',
    logo:  require(`@shell/assets/images/vendor/pagerduty.svg`)
  },
  {
    name:  'opsgenie',
    label: 'monitoringReceiver.opsgenie.label',
    title: 'monitoringReceiver.opsgenie.title',
    key:   'opsgenieConfigs',
    logo:  require(`@shell/assets/images/vendor/email.svg`)
  },
  {
    name:  'webhook',
    label: 'monitoringReceiver.webhook.label',
    title: 'monitoringReceiver.webhook.title',
    key:   'webhookConfigs',
    logo:  require(`@shell/assets/images/vendor/webhook.svg`),
  },
  {
    name:  'custom',
    label: 'monitoringReceiver.custom.label',
    title: 'monitoringReceiver.custom.title',
    info:  'monitoringReceiver.custom.info',
    key:   'webhookConfigs',
    logo:  require(`@shell/assets/images/vendor/custom.svg`)
  },
];

export default {
  components: {
    ArrayListGrouped,
    Banner,
    ButtonDropdown,
    CruResource,
    LabeledInput,
    Loading,
    Tabbed,
    Tab,
    YamlEditor
  },

  props: {

    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: {
      type:    String,
      default: ''
    },
    alertmanagerConfigResource: {
      type:     Object,
      required: true
    },
    alertmanagerConfigId: {
      type:     String,
      required: true
    },
    saveOverride: {
      type:     Function,
      required: true
    },
  },

  mixins: [CreateEditView],

  data(props) {
    const currentReceiver = {};
    const mode = this.$route.query.mode;

    if (mode === _CREATE) {
      RECEIVERS_TYPES.forEach((receiverType) => {
        this.$set(currentReceiver, receiverType.key, currentReceiver[receiverType.key] || []);
      });
    }

    /**
     * example receiver value:
     * {
     *   name: 'name',
     *   slackConfigs: [...]
     * }
     */
    const receiverSchema = this.$store.getters['cluster/schemaFor'](MONITORING.SPOOFED.ALERTMANAGERCONFIG_RECEIVER_SPEC);

    // debugger;

    if (!receiverSchema) {
      throw new Error("Can't render the form because the AlertmanagerConfig schema is not loaded yet.");
    }

    const expectedFields = Object.keys(receiverSchema.resourceFields);

    const suffix = {};

    Object.keys(this.value).forEach((key) => {
      if (!expectedFields.includes(key)) {
        suffix[key] = this.value[key];
      }
    });

    let suffixYaml = jsyaml.dump(suffix);

    if (suffixYaml.trim() === '{}') {
      suffixYaml = '';
    }

    return {
      create:        _CREATE,
      EDITOR_MODES,
      expectedFields,
      fileFound:     false,
      receiverTypes: RECEIVERS_TYPES,
      suffixYaml,
      view:          _VIEW,
      yamlError:     '',
    };
  },

  mounted() {
    if (this.mode === this.create) {
      if (!this.alertmanagerConfigResource.spec.receivers) {
        this.alertmanagerConfigResource.spec.receivers = [];
      }
      this.alertmanagerConfigResource.spec.receivers.push(this.value);
    }
  },

  computed: {
    editorMode() {
      if ( this.$route.query.mode === _VIEW ) {
        return EDITOR_MODES.VIEW_CODE;
      }

      return EDITOR_MODES.EDIT_CODE;
    },
    alertmanagerConfigNamespace() {
      return this.alertmanagerConfigResource?.metadata?.namespace || '';
    },
    receiverNameDisabled() {
      return this.$route.query.mode === _VIEW;
    },

  },

  watch: {
    suffixYaml(value) {
      try {
        // We need this step so we don't just keep adding new keys when modifying the custom field
        Object.keys(this.value).forEach((key) => {
          if (!this.expectedFields.includes(key)) {
            this.$delete(this.value, key);
          }
        });

        const suffix = jsyaml.load(value);

        Object.assign(this.value, suffix);
        this.yamlError = '';
      } catch (ex) {
        this.yamlError = `There was a problem parsing the Custom Config: ${ ex }`;
      }
    },
  },

  methods: {
    getComponent(name) {
      return require(`./types/${ name }`).default;
    },

    navigateTo(receiverType) {
      this.$refs.tabbed.select(receiverType.name);
    },

    getCount(receiverType) {
      const found = this.value?.[receiverType.key] || [];

      return found.length;
    },

    tabChanged({ tab }) {
      window.scrollTop = 0;
      if ( tab.name === 'custom' ) {
        this.$nextTick(() => {
          if ( this.$refs.customEditor ) {
            this.$refs.customEditor[0].refresh();
            this.$refs.customEditor[0].focus();
          }
        });
      }
    },

    redirectAfterCancel() {
      this.$router.push(this.alertmanagerConfigResource._detailLocation);
    },

    createAddOptions(receiverType) {
      return receiverType.addOptions.map();
    },
  }
};
</script>

<template>
  <CruResource
    class="receiver"
    :done-route="alertmanagerConfigResource._detailLocation"
    :mode="mode"
    :resource="alertmanagerConfigResource"
    :subtypes="[]"
    :can-yaml="true"
    :errors="errors"
    :cancel-event="true"
    @error="e=>errors = e"
    @finish="saveOverride()"
    @cancel="redirectAfterCancel"
  >
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model="value.name"
          :is-disabled="receiverNameDisabled"
          :label="t('generic.name')"
          :mode="mode"
        />
      </div>
    </div>
    <Tabbed
      ref="tabbed"
      :side-tabs="true"
      default-tab="overview"
      @changed="tabChanged"
    >
      <Tab
        :label="t('generic.overview')"
        :weight="receiverTypes.length"
        name="overview"
      >
        <div class="box-container create-resource-container ">
          <div
            v-for="(receiverType, i) in receiverTypes"
            :key="i"
            class="mb-10 subtype-banner"
            primary-color-var="--primary-color"
            @click="navigateTo(receiverType)"
          >
            <div class="left">
              <div class="logo">
                <img :src="receiverType.logo">
              </div>
              <h4 class="name ml-10">
                <t :k="receiverType.label" />
              </h4>
            </div>
            <div
              v-if="receiverType.name !== 'custom'"
              class="right"
            >
              {{ getCount(receiverType) }}
            </div>
          </div>
        </div>
      </Tab>
      <Tab
        v-for="(receiverType, i) in receiverTypes"
        :key="i"
        :label="t(receiverType.label)"
        :name="receiverType.name"
        :weight="receiverTypes.length - i"
      >
        <YamlEditor
          v-if="receiverType.name === 'custom'"
          ref="customEditor"
          v-model="suffixYaml"
          :scrolling="false"
          :editor-mode="editorMode"
        />
        <div v-else>
          <ArrayListGrouped
            v-model="value[receiverType.key]"
            class="namespace-list"
            :mode="mode"
            :default-add-value="{}"
            :add-label="t('monitoringReceiver.addButton', { type: t(receiverType.label) })"
          >
            <template #default="props">
              <component
                :is="getComponent(receiverType.name)"
                :value="props.row.value"
                :mode="mode"
                :namespace="alertmanagerConfigNamespace"
              />
            </template>
          </ArrayListGrouped>
        </div>
      </Tab>
    </Tabbed>
  </CruResource>
</template>

<style lang="scss">
  .receiver {
    $margin: 10px;
    $logo: 60px;

    .box-container.create-resource-container {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      margin: 0 -1*$margin;

      .subtype-banner{
        justify-content: space-between;
        align-items: center;
        flex-direction: row;
      }
    }

    .right {
      padding: 30px;
      border-left: 1px solid var(--border);
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

    .name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 0;
      display: inline-block;
      vertical-align: middle;
    }
  }
</style>
