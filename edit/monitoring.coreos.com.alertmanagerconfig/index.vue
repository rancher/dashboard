<script>
import CruResource from '@/components/CruResource';

import CreateEditView from '@/mixins/create-edit-view';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import { MONITORING } from '@/config/types';
import Loading from '@/components/Loading';
import NameNsDescription from '@/components/form/NameNsDescription';
import { EDITOR_MODES } from '@/components/YamlEditor';
import { RECEIVERS_TYPES } from '@/models/monitoring.coreos.com.receiver';
import RouteConfig from './routeConfig';
import ResourceTable from '@/components/ResourceTable';
import { _VIEW, _CREATE, _CONFIG } from '@/config/query-params';

export default {
  components: {
    CruResource,
    Loading,
    NameNsDescription,
    ResourceTable,
    RouteConfig,
    Tab,
    Tabbed,
  },

  mixins: [CreateEditView],

  fetch() {},

  data() {
    this.value.applyDefaults();
    const defaultReceiverValues = {};
    const receiverSchema = this.$store.getters['cluster/schemaFor'](MONITORING.SPOOFED.ALERTMANAGERCONFIG_RECEIVER_SPEC);
    const routeSchema = this.$store.getters['cluster/schemaFor'](MONITORING.SPOOFED.ALERTMANAGERCONFIG_ROUTE_SPEC);
    const receiverOptions = this.value.spec.receivers.map(receiver => receiver.name);

    return {
      config:             _CONFIG,
      createReceiverLink: {
        name:   'c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid-receiver',
        params: {
          cluster:              this.$store.getters['clusterId'],
          alertmanagerconfigid: this.value.id
        },
        query: { mode: _CREATE, currentView: _CONFIG }
      },
      defaultReceiverValues,
      editReceiverLink: {
        name:   'c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid-receiver',
        params: {
          cluster:              this.$store.getters['clusterId'],
          alertmanagerconfigid: this.value.id
        },
        query: { mode: _CREATE, currentView: _CONFIG }
      },
      receiverTableHeaders: [
        {
          name:          'name',
          labelKey:      'tableHeaders.name',
          value:         'name',
          sort:          ['nameSort'],
          formatter:     'LinkDetail',
          canBeVariable: true,
        }
        // Add more columns
      ],
      newReceiverType:      null,
      receiverOptions,
      receiverTypes:        RECEIVERS_TYPES,
      routeSchema,
      receiverSchema,
      view:                 _VIEW,
    };
  },

  computed: {

    editorMode() {
      if ( this.mode === _VIEW ) {
        return EDITOR_MODES.VIEW_CODE;
      }

      return EDITOR_MODES.EDIT_CODE;
    },
  },
  methods: {

    translateReceiverTypes() {
      return this.receiverTypes.map((receiverType) => {
        return {
          ...receiverType,
          label: this.t(receiverType.label)
        };
      });
    },
    addNewReceiver(name) {
      // ToDo: uncomment and implement this code
      // const existingReceiversOfSelectedType = this.value.spec.receivers[this.newReceiverType] || []

      // this.value.spec.receivers[this.newReceiverType] = this.value.spec.receivers;
    },
    getReceiverDetailLink(receiverData) {
      return {
        name:   'c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid-receiver',
        params: {
          cluster:              this.$store.getters['clusterId'],
          alertmanagerconfigid: this.value.id
        },
        query: {
          mode: _VIEW, receiverName: receiverData.name, currentView: _CONFIG
        }
      };
    },
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

    <Tabbed>
      <Tab :label="t('monitoring.route.label')" :weight="1" name="route">
        <RouteConfig :value="value.spec.route" :mode="mode" :receiver-options="receiverOptions" />
      </Tab>
      <Tab :label="t('alertmanagerConfigReceiver.receivers')" :weight="2" name="receivers">
        <ResourceTable
          :headers="receiverTableHeaders"
          :schema="receiverSchema"
          :rows="value.spec.receivers"
          :get-custom-detail-link="getReceiverDetailLink"
          :table-actions="false"
        >
          <template #header-button>
            <nuxt-link v-if="createReceiverLink && createReceiverLink.name" :to="createReceiverLink">
              <button class="btn role-primary">
                Create Receiver
              </button>
            </nuxt-link>
          </template>
        </ResourceTable>
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
