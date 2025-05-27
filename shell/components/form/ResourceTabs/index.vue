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
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable.vue';
import { _VIEW } from '@shell/config/query-params';
import RelatedResources from '@shell/components/RelatedResources';
import { isConditionReadyAndWaiting } from '@shell/plugins/dashboard-store/resource-class';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import { MESSAGE, REASON } from '@shell/config/table-headers';
import { STEVE_EVENT_LAST_SEEN, STEVE_EVENT_TYPE, STEVE_NAME_COL } from '@shell/config/pagination-table-headers';
import { headerFromSchemaColString } from '@shell/store/type-map.utils';

export default {

  name: 'ResourceTabs',

  components: {
    Tabbed,
    Tab,
    Conditions,
    PaginatedResourceTable,
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
    const eventSchema = this.$store.getters[`${ inStore }/schemaFor`](EVENT); // @TODO be smarter about which resources actually ever have events

    const paginationHeaders = eventSchema ? [
      STEVE_EVENT_LAST_SEEN,
      STEVE_EVENT_TYPE,
      REASON,
      headerFromSchemaColString('Subobject', eventSchema, this.$store.getters, true),
      headerFromSchemaColString('Source', eventSchema, this.$store.getters, true),
      MESSAGE,
      headerFromSchemaColString('First Seen', eventSchema, this.$store.getters, true),
      headerFromSchemaColString('Count', eventSchema, this.$store.getters, true),
      STEVE_NAME_COL,
    ] : [];

    return {
      eventSchema,
      EVENT,
      selectedTab:    this.defaultTab,
      inStore,
      showConditions: false,
      paginationHeaders
    };
  },

  beforeUnmount() {
    this.$store.dispatch('cluster/forgetType', EVENT);
  },

  fetch() {
    // By this stage the `value` should be set. Taking a chance that this is true
    // The alternative is have an expensive watch on the `value` and trigger there (as well)
    this.setShowConditions();
  },

  computed: {
    showEvents() {
      return this.isView && this.needEvents && this.eventSchema;
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

    /**
     * Filter out hidden repos from list of all repos
     */
    filterEventsLocal(rows) {
      return rows.filter((event) => event.involvedObject?.uid === this.value?.metadata?.uid);
    },

    /**
     * Filter out hidden repos via api
     *
     * pagination: PaginationArgs
     * returns: PaginationArgs
     */
    filterEventsApi(pagination) {
      if (!pagination.filters) {
        pagination.filters = [];
      }

      const field = `involvedObject.uid`; // Pending API Support - https://github.com/rancher/rancher/issues/48603

      // of type PaginationParamFilter
      let existing = null;

      for (let i = 0; i < pagination.filters.length; i++) {
        const filter = pagination.filters[i];

        if (!!filter.fields.find((f) => f.field === field)) {
          existing = filter;
          break;
        }
      }

      const required = PaginationParamFilter.createSingleField({
        field,
        exact:  true,
        value:  this.value.metadata.uid,
        equals: true
      });

      if (!!existing) {
        Object.assign(existing, required);
      } else {
        pagination.filters.push(required);
      }

      return pagination;
    }
  }
};
</script>

<template>
  <Tabbed
    v-bind="$attrs"
    :default-tab="defaultTab"
    :resource="value"
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
      <!-- namespaced: false given we don't want the default handling of namespaced resource (apply header filter)  -->
      <PaginatedResourceTable
        v-if="selectedTab === 'events'"
        :schema="eventSchema"
        :local-filter="filterEventsLocal"
        :api-filter="filterEventsApi"
        :use-query-params-for-simple-filtering="false"
        :headers="eventHeaders"
        :paginationHeaders="paginationHeaders"
        :namespaced="false"
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
  </Tabbed>
</template>
