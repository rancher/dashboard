<script>
/*
    Tab component for resource CRU pages featuring:
    Labels and Annotation tabs with content filtered by create-edit-view mixin
*/
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import CreateEditView from '@shell/mixins/create-edit-view';
import Conditions from '@shell/components/form/Conditions';
import { EVENT } from '@shell/config/types';
import SortableTable from '@shell/components/SortableTable';
import { _VIEW } from '@shell/config/query-params';
import RelatedResources from '@shell/components/RelatedResources';
import { ExtensionPoint, TabLocation } from '@shell/core/types';
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';
import { isConditionReadyAndWaiting } from '@shell/plugins/dashboard-store/resource-class';

export default {

  name: 'ResourceTabs',

  components: {
    Tabbed,
    Tab,
    Conditions,
    SortableTable,
    RelatedResources,
  },

  mixins: [CreateEditView],

  props: {
    // resource instance
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    // create-edit-view mode
    mode: {
      type:    String,
      default: _VIEW,
    },

    defaultTab: {
      type:    String,
      default: null,
    },

    needConditions: {
      type:    Boolean,
      default: true
    },

    needEvents: {
      type:    Boolean,
      default: true
    },

    needRelated: {
      type:    Boolean,
      default: true
    },

    extensionParams: {
      type:    Object,
      default: null
    }
  },

  data() {
    const inStore = this.$store.getters['currentStore'](EVENT);

    return {
      hasEvents:      this.$store.getters[`${ inStore }/schemaFor`](EVENT), // @TODO be smarter about which resources actually ever have events
      allEvents:      [],
      selectedTab:    this.defaultTab,
      didLoadEvents:  false,
      extensionTabs:  getApplicableExtensionEnhancements(this, ExtensionPoint.TAB, TabLocation.RESOURCE_DETAIL, this.$route, this, this.extensionParams),
      inStore,
      showConditions: false,
    };
  },

  beforeDestroy() {
    this.$store.dispatch('cluster/forgetType', EVENT);
  },

  fetch() {
    // By this stage the `value` should be set. Taking a chance that this is true
    // The alternative is have an expensive watch on the `value` and trigger there (as well)
    this.setShowConditions();
  },

  computed: {
    showEvents() {
      return this.isView && this.needEvents && this.hasEvents;
    },
    showRelated() {
      return this.isView && this.needRelated;
    },
    eventHeaders() {
      return [
        {
          name:  'type',
          label: this.t('tableHeaders.type'),
          value: 'eventType',
          sort:  'eventType',
        },
        {
          name:  'reason',
          label: this.t('tableHeaders.reason'),
          value: 'reason',
          sort:  'reason',
        },
        {
          name:          'date',
          label:         this.t('tableHeaders.updated'),
          value:         'date',
          sort:          'date:desc',
          formatter:     'LiveDate',
          formatterOpts: { addSuffix: true },
          width:         125
        },
        {
          name:  'message',
          label: this.t('tableHeaders.message'),
          value: 'message',
          sort:  'message',
        },
      ];
    },
    events() {
      return this.allEvents.filter((event) => {
        return event.involvedObject?.uid === this.value?.metadata?.uid;
      }).map((event) => {
        return {
          reason:    (`${ event.reason || this.t('generic.unknown') }${ event.count > 1 ? ` (${ event.count })` : '' }`).trim(),
          message:   event.message || this.t('generic.unknown'),
          date:      event.lastTimestamp || event.firstTimestamp || event.metadata.creationTimestamp,
          eventType: event.eventType
        };
      });
    },
    conditionsHaveIssues() {
      if (this.showConditions) {
        return this.value.status?.conditions?.filter((cond) => !isConditionReadyAndWaiting(cond)).some((cond) => cond.error);
      }

      return false;
    }
  },

  methods: {
    // Ensures we only fetch events and show the table when the events tab has been activated
    tabChange(neu) {
      this.selectedTab = neu?.selectedName;

      if (!this.didLoadEvents && this.selectedTab === 'events') {
        const inStore = this.$store.getters['currentStore'](EVENT);

        this.$store.dispatch(`${ inStore }/findAll`, { type: EVENT }).then((events) => {
          this.allEvents = events;
          this.didLoadEvents = true;
        });
      }
    },

    /**
    * Conditions come from a resource's `status`. They are used by both core resources like workloads as well as those from CRDs
    * - Workloads
    * - Nodes
    * - Fleet git repo
    * - Cluster (provisioning)
    *
    * Check here if the resource type contains conditions via the schema resourceFields
    */
    async setShowConditions() {
      if (this.isView && this.needConditions && !!this.value?.type && !!this.schema?.fetchResourceFields) {
        await this.schema.fetchResourceFields();

        this.showConditions = this.$store.getters[`${ this.inStore }/pathExistsInSchema`](this.value.type, 'status.conditions');
      }
    },
  }
};
</script>

<template>
  <Tabbed
    v-bind="$attrs"
    :default-tab="defaultTab"
    @changed="tabChange"
  >
    <slot />

    <Tab
      v-if="showConditions"
      label-key="resourceTabs.conditions.tab"
      name="conditions"
      :weight="-1"
      :display-alert-icon="conditionsHaveIssues"
    >
      <Conditions :value="value" />
    </Tab>

    <Tab
      v-if="showEvents"
      label-key="resourceTabs.events.tab"
      name="events"
      :weight="-2"
    >
      <SortableTable
        v-if="selectedTab === 'events'"
        :rows="events"
        :headers="eventHeaders"
        key-field="id"
        :search="false"
        :table-actions="false"
        :row-actions="false"
        default-sort-by="date"
      />
    </Tab>

    <Tab
      v-if="showRelated"
      name="related"
      label-key="resourceTabs.related.tab"
      :weight="-3"
    >
      <h3 v-t="'resourceTabs.related.from'" />
      <RelatedResources
        :ignore-types="[value.type]"
        :value="value"
        direction="from"
      />

      <h3
        v-t="'resourceTabs.related.to'"
        class="mt-20"
      />
      <RelatedResources
        :ignore-types="[value.type]"
        :value="value"
        direction="to"
      />
    </Tab>

    <!-- Extension tabs -->
    <Tab
      v-for="tab, i in extensionTabs"
      :key="`${tab.name}${i}`"
      :name="tab.name"
      :label="tab.label"
      :label-key="tab.labelKey"
      :weight="tab.weight"
      :tooltip="tab.tooltip"
      :show-header="tab.showHeader"
      :display-alert-icon="tab.displayAlertIcon"
      :error="tab.error"
      :badge="tab.badge"
    >
      <component
        :is="tab.component"
        :resource="value"
      />
    </Tab>
  </Tabbed>
</template>
