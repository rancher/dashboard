<script>
import { MONITORING } from '@/config/types';
import Loading from '@/components/Loading';
import CruResource from '@/components/CruResource';
import LabeledInput from '@/components/form/LabeledInput';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import { EDITOR_MODES } from '@/components/YamlEditor';
import CreateEditView from '@/mixins/create-edit-view';
import { RECEIVERS_TYPES } from '@/models/monitoring.coreos.com.receiver';
import ReceiverConfig from '@/edit/monitoring.coreos.com.receiver/receiverConfig.vue';

export default {
  components: {
    CruResource,
    LabeledInput,
    Loading,
    Tabbed,
    Tab,
    ReceiverConfig,
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

    return {
      receiverTypes:        RECEIVERS_TYPES,
      fileFound:            false,
      receiver:             {},
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

  methods: {

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
          <div
            v-for="(receiverType, i) in receiverTypes"
            :key="i"
            class="mb-10 subtype-banner"
            primary-color-var="--primary-color"
            @click="navigateTo(receiverType)"
          >
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
        <ReceiverConfig
          :deprecated-receiver="true"
          :mode="mode"
          :editor-mode="editorMode"
          :receiver-type="receiverType"
          :value="value"
        />
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
