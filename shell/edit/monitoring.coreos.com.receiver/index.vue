<script>
import { MONITORING } from '@shell/config/types';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import Loading from '@shell/components/Loading';
import Banner from '@shell/components/Banner';
import CruResource from '@shell/components/CruResource';
import LabeledInput from '@shell/components/form/LabeledInput';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import CreateEditView from '@shell/mixins/create-edit-view';
import jsyaml from 'js-yaml';
import { RECEIVERS_TYPES } from '@shell/models/monitoring.coreos.com.receiver';
import ButtonDropdown from '@shell/components/ButtonDropdown';

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

  mixins: [CreateEditView],

  async fetch() {
    await this.$store.dispatch('cluster/findAll', { type: MONITORING.SPOOFED.ROUTE });
  },

  data() {
    this.$set(this.value, 'spec', this.value.spec || {});

    RECEIVERS_TYPES.forEach((receiverType) => {
      this.$set(this.value.spec, receiverType.key, this.value.spec[receiverType.key] || []);
    });

    const specSchema = this.$store.getters['cluster/schemaFor'](MONITORING.SPOOFED.RECEIVER_SPEC);
    const expectedFields = Object.keys(specSchema.resourceFields);
    const suffix = {};

    Object.keys(this.value.spec).forEach((key) => {
      if (!expectedFields.includes(key)) {
        suffix[key] = this.value.spec[key];
      }
    });

    let suffixYaml = jsyaml.dump(suffix);

    if (suffixYaml.trim() === '{}') {
      suffixYaml = '';
    }

    return {
      expectedFields,
      receiverTypes:        RECEIVERS_TYPES,
      fileFound:            false,
      receiver:             {},
      suffixYaml,
      EDITOR_MODES,
      yamlError:            '',
      doneLocationOverride:      {
        name:   'c-cluster-monitoring-route-receiver',
        params: { cluster: this.$store.getters['clusterId'] },
        query:  { resource: MONITORING.SPOOFED.RECEIVER }
      }
    };
  },

  computed: {
    editorMode() {
      if ( this.isView ) {
        return EDITOR_MODES.VIEW_CODE;
      }

      return EDITOR_MODES.EDIT_CODE;
    },
  },

  watch: {
    suffixYaml(value) {
      try {
        // We need this step so we don't just keep adding new keys when modifying the custom field
        Object.keys(this.value.spec).forEach((key) => {
          if (!this.expectedFields.includes(key)) {
            this.$delete(this.value.spec, key);
          }
        });

        const suffix = jsyaml.load(value);

        Object.assign(this.value.spec, suffix);
        this.yamlError = '';
      } catch (ex) {
        this.yamlError = `There was a problem parsing the Custom Config: ${ ex }`;
      }
    }
  },

  methods: {
    getComponent(name) {
      return require(`./types/${ name }`).default;
    },

    navigateTo(receiverType) {
      this.$refs.tabbed.select(receiverType.name);
    },

    getCount(receiverType) {
      const found = this.value?.spec?.[receiverType.key] || [];

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

    saveOverride(buttonDone) {
      if (this.yamlError) {
        this.errors = this.errors || [];
        this.errors.push(this.yamlError);
        buttonDone(false);
      } else {
        this.save(...arguments);
      }
    },

    createAddOptions(receiverType) {
      return receiverType.addOptions.map();
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    class="receiver"
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :can-yaml="false"
    :errors="errors"
    :cancel-event="true"
    @error="e=>errors = e"
    @finish="saveOverride"
    @cancel="done"
  >
    <div v-if="!isView" class="row mb-10">
      <div class="col span-6">
        <LabeledInput v-model="value.spec.name" :disabled="!isCreate" :label="t('generic.name')" :mode="mode" />
      </div>
    </div>
    <Tabbed ref="tabbed" :side-tabs="true" default-tab="overview" @changed="tabChanged">
      <Tab :label="t('generic.overview')" :weight="receiverTypes.length" name="overview">
        <div class="box-container create-resource-container ">
          <div v-for="(receiverType, i) in receiverTypes" :key="i" class="mb-10 subtype-banner" primary-color-var="--primary-color" @click="navigateTo(receiverType)">
            <div class="left">
              <div class="logo">
                <img :src="receiverType.logo" />
              </div>
              <h4 class="name ml-10">
                <t :k="receiverType.label" />
              </h4>
            </div>
            <div v-if="receiverType.name !== 'custom'" class="right">
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
          <component :is="getComponent(receiverType.banner)" v-if="receiverType.banner" :model="value.spec[receiverType.key]" :mode="mode" />
          <ArrayListGrouped
            v-model="value.spec[receiverType.key]"
            class="namespace-list"
            :mode="mode"
            :default-add-value="{}"
            :add-label="t('monitoringReceiver.addButton', { type: t(receiverType.label) })"
          >
            <template #default="props">
              <component :is="getComponent(receiverType.name)" :value="props.row.value" :mode="mode" />
            </template>
            <template v-if="receiverType.addButton" #add>
              <component :is="getComponent(receiverType.addButton)" :model="value.spec[receiverType.key]" :mode="mode" />
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

    .box-container {
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
