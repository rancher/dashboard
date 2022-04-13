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
    }
  },

  async fetch() {
    const inStore = this.$store.getters['currentStore'](EVENT);

    if ( this.$store.getters[`${ inStore }/schemaFor`](EVENT) ) {
      this.hasEvents = true; // @TODO be smarter about which ones actually ever have events
      this.allEvents = await this.$store.dispatch(`${ inStore }/findAll`, { type: EVENT });
    }
  },

  data() {
    return {
      hasEvents: null,
      allEvents: []
    };
  },

  computed: {
    showConditions() {
      const inStore = this.$store.getters['currentStore'](this.value.type);

      return this.isView && this.needConditions && this.value?.type && this.$store.getters[`${ inStore }/pathExistsInSchema`](this.value.type, 'status.conditions');
    },
    showEvents() {
      return this.isView && this.needEvents && !this.$fetchState.pending && this.hasEvents && this.events.length;
    },
    showRelated() {
      return this.isView && this.needRelated && !this.$fetchState.pending;
    },
    eventHeaders() {
      return [
        {
          name:  'reason',
          label: 'Reason',
          value: 'reason',
          sort:  'reason',
        },
        {
          name:          'date',
          label:         'Updated',
          value:         'date',
          sort:          'date:desc',
          formatter:     'LiveDate',
          formatterOpts: { addSuffix: true },
          width:         125
        },
        {
          name:  'message',
          label: 'Message',
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
          reason:  (`${ event.reason || 'Unknown' }${ event.count > 1 ? ` (${ event.count })` : '' }`).trim(),
          message: event.message || 'Unknown',
          date:    event.lastTimestamp || event.firstTimestamp || event.metadata.creationTimestamp,
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

  mounted() {
    // For easy access debugging...
    if ( typeof window !== 'undefined' ) {
      window.v = this.value;
    }
  },
};
</script>

<template>
  <Tabbed v-bind="$attrs" :default-tab="defaultTab">
    <slot />

    <Tab v-if="showConditions" label-key="resourceTabs.conditions.tab" name="conditions" :weight="-1" :display-alert-icon="conditionsHaveIssues">
      <Conditions :value="value" />
    </Tab>

    <Tab v-if="showEvents" label-key="resourceTabs.events.tab" name="events" :weight="-2">
      <SortableTable
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
