<script>
import CruResource from '@/components/CruResource';
import ArrayList from '@/components/form/ArrayList';
import ArrayListGrouped from '@/components/form/ArrayListGrouped';
import KeyValue from '@/components/form/KeyValue';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import CreateEditView from '@/mixins/create-edit-view';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import { MONITORING } from '@/config/types';
import Loading from '@/components/Loading';
import NameNsDescription from '@/components/form/NameNsDescription';
import { EDITOR_MODES } from '@/components/YamlEditor';
import { RECEIVERS_TYPES } from '@/models/monitoring.coreos.com.receiver';
import ReceiverConfig from '@/edit/monitoring.coreos.com.receiver/receiverConfig';

export default {
  components: {
    ArrayList,
    ArrayListGrouped,
    CruResource,
    KeyValue,
    LabeledInput,
    LabeledSelect,
    Loading,
    NameNsDescription,
    ReceiverConfig,
    Tab,
    Tabbed,
  },

  mixins: [CreateEditView],

  async fetch() {
    const receivers = await this.$store.dispatch('cluster/findAll', { type: MONITORING.SPOOFED.RECEIVER });
    const routes = await this.$store.dispatch('cluster/findAll', { type: MONITORING.SPOOFED.ROUTE });

    // this.receiverOptions = receivers.map(receiver => receiver.spec?.name);
  },

  data() {
    this.value.spec = {
      route:     {},
      receivers: [],
    };
    const defaultReceiverValues = {};

    RECEIVERS_TYPES.forEach((receiverType) => {
      defaultReceiverValues[receiverType.key] = receiverType;
    });

    return {
      defaultReceiverValues,
      receiverOptions:      [],
      receiverTypes:        RECEIVERS_TYPES,
      newReceiverType:      null,
      doneLocationOverride:      {
        name:   'c-cluster-monitoring-route-receiver',
        params: { cluster: this.$store.getters['clusterId'] },
        query:  { resource: MONITORING.SPOOFED.ROUTE }
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
    getReceiverType(name) {
      // try {
      const type = this.defaultReceiverValues[`${ name }_configs`];

      return type;
      // } catch {
      //   throw new Error('Could not find receiver type: ', name);
      // }
    },
    translateReceiverTypes() {
      return this.receiverTypes.map((receiverType) => {
        return {
          ...receiverType,
          label: this.t(receiverType.label)
        };
      });
    },
    addNewReceiver(name) {
      const receiverType = this.getReceiverType(name);

      this.$set(this.value.spec, 'receivers', [receiverType, this.value.spec.receivers]);
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    class="route"
    :done-route="doneRoute"
    :errors="errors"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :cancel-event="true"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription v-model="value" :mode="mode" :namespaced="isNamespaced" />

    <Tabbed ref="tabbed" :side-tabs="true" default-tab="overview">
      <Tab label="Receivers" :weight="2" name="receivers">
        <div class="row mb-20">
          <div class="col span-4">
            <LabeledSelect
              v-model="newReceiverType"
              :label="t('monitoringRoute.receiver.type')"
              :options="translateReceiverTypes(receiverTypes)"
            >
            </Labeledselect>
          </div>
          <div class="col span-6">
            <button
              type="button"
              class="btn role-tertiary add"
              :disabled="newReceiverType === null"
              @click="addNewReceiver(newReceiverType.name)"
            >
              {{ t('monitoringRoute.receiver.add') }}
            </button>
          </div>
        </div>
        <div class="row">
          <ArrayListGrouped
            :key="value.spec.receivers.length"
            v-model="value.spec.receivers"
            class="mt-20"
            :can-add="false"
            :mode="mode"
          >
            <template #default="props">
              <div class="row">
                <ReceiverConfig
                  :mode="mode"
                  :editor-mode="editorMode"
                  :receiver-type="getReceiverType(props.row.value.name)"
                  :value="props.row.value"
                />
              </div>
            </template>
          </ArrayListGrouped>
        </div>
      </Tab>
      <Tab :label="t('monitoring.route.label')" :weight="1" name="routes">
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledSelect
              :value="value.spec.route.receivers"
              class="lg"
              :label="t('monitoringRoute.receiver.oneOrMoreLabel')"
              :taggable="true"
              :searchable="true"
              :options="receiverOptions"
              :multiple="true"
              :mode="mode"
              :tooltip="t('monitoring.alertmanagerConfig.receiverTooltip')"
              @input="updateSelectValue(props.row.value, 'verbs', $event)"
            />
          </div>
        </div>
        <h3>Grouping</h3>
        <hr class="divider" />
        <div class="row mb-20">
          <div class="col span-6">
            <span class="label">
              {{ t("monitoringRoute.groups.label") }}:
            </span>
            <ArrayList
              v-if="!isView || (value.spec.route.group_by && value.spec.route.group_by.length > 0)"
              v-model="value.spec.route.group_by"
              :label="t('monitoringRoute.groups.label')"
              :mode="mode"
              :initial-empty-row="true"
            />
            <div v-else>
              {{ t('generic.none') }}
            </div>
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="value.spec.route.group_wait"
              :label="t('monitoringRoute.wait.label')"
              :mode="mode"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="value.spec.route.group_interval"
              :label="t('monitoringRoute.interval.label')"
              :mode="mode"
            />
          </div>
        </div>
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="value.spec.route.repeat_interval"
              :label="t('monitoringRoute.repeatInterval.label')"
              :mode="mode"
            />
          </div>
        </div>

        <h3>Matching</h3>
        <hr class="divider" />
        <div class="row mb-20">
          <div class="col span-12">
            <span class="label">
              {{ t('monitoringRoute.matching.label') }}
            </span>
            <KeyValue
              v-if="!isView || Object.keys(value.spec.route.match || {}).length > 0"
              v-model="value.spec.route.match"
              :options="receiverOptions"
              :label="t('monitoringRoute.receiver.label')"
              :mode="mode"
              :read-allowed="false"
              :add-label="t('monitoringRoute.receiver.addMatch')"
            />
            <div v-else>
              {{ t('generic.none') }}
            </div>
          </div>
        </div>
        <div class="row mt-40">
          <div class="col span-12">
            <span class="label">
              {{ t('monitoringRoute.regex.label') }}:
            </span>
            <KeyValue
              v-if="!isView || Object.keys(value.spec.route.match_re || {}).length > 0"
              v-model="value.spec.route.match_re"
              :options="receiverOptions"
              :label="t('monitoringRoute.receiver.label')"
              :mode="mode"
              :read-allowed="false"
              add-label="Add match regex"
            />
            <div v-else>
              {{ t('generic.none') }}
            </div>
          </div>
        </div>
      </Tab>
    </Tabbed>
  </CruResource>
</template>

<style lang="scss" scoped>
  h3 {
    margin-top: 2em;
  }
  input {
    margin-top: 1em;
  }
  .route {
    &[real-mode=view] .label {
      color: var(--input-label);
    }
  }
</style>
