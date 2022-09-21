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

    alwaysShowEvents: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    const inStore = this.$store.getters['currentStore'](EVENT);

    return {
      hasEvents:     this.$store.getters[`${ inStore }/schemaFor`](EVENT), // @TODO be smarter about which resources actually ever have events
      allEvents:     [],
      selectedTab:   this.defaultTab,
      didLoadEvents: false,
    };
  },

  beforeDestroy() {
    this.$store.dispatch('cluster/forgetType', EVENT);
  },

  computed: {
    showConditions() {
      const inStore = this.$store.getters['currentStore'](this.value.type);

      return this.isView && this.needConditions && this.value?.type && this.$store.getters[`${ inStore }/pathExistsInSchema`](this.value.type, 'status.conditions');
    },
    showEvents() {
      return this.isView && this.needEvents && this.hasEvents && (this.events.length || this.alwaysShowEvents);
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
        return this.value.status?.conditions?.some(cond => cond.error);
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
    }
  }
};
</script>

<template>
  <Tabbed v-bind="$attrs" :default-tab="defaultTab" @changed="tabChange">
    <slot />

    <Tab v-if="showConditions" label-key="resourceTabs.conditions.tab" name="conditions" :weight="-1" :display-alert-icon="conditionsHaveIssues">
      <Conditions :value="value" />
    </Tab>

    <Tab v-if="showEvents" label-key="resourceTabs.events.tab" name="events" :weight="-2">
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

    <Tab v-if="showRelated" name="related" label-key="resourceTabs.related.tab" :weight="-3">
      <h3 v-t="'resourceTabs.related.from'" />
      <RelatedResources :ignore-types="[value.type]" :value="value" direction="from" />

      <h3 v-t="'resourceTabs.related.to'" class="mt-20" />
      <RelatedResources :ignore-types="[value.type]" :value="value" direction="to" />
    </Tab>
  </Tabbed>
</template>
