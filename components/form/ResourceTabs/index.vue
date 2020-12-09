<script>
/*
    Tab component for resource CRU pages featuring:
    Labels and Annotation tabs with content filtered by create-edit-view mixin
*/
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import CreateEditView from '@/mixins/create-edit-view';
import Conditions from '@/components/form/Conditions';
import { EVENT } from '@/config/types';
import SortableTable from '@/components/SortableTable';
import { _VIEW } from '@/config/query-params';
import RelatedResources from '@/components/RelatedResources';

export default {
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
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

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
      const inStore = this.$store.getters['currentProduct'].inStore;

      return this.isView && this.value?.type && this.$store.getters[`${ inStore }/pathExistsInSchema`](this.value.type, 'status.conditions');
    },

    showEvents() {
      return this.isView && !this.$fetchState.pending && this.hasEvents && this.events.length;
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
  <Tabbed v-bind="$attrs">
    <slot />

    <Tab v-if="showConditions" label-key="resourceTabs.conditions.tab" name="conditions" :weight="-1">
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

    <Tab name="related" label-key="resourceTabs.related.tab" :weight="-3">
      <h3 v-t="'resourceTabs.related.from'" />
      <RelatedResources :ignore-types="[value.type]" :value="value" direction="from" />

      <h3 v-t="'resourceTabs.related.to'" class="mt-20" />
      <RelatedResources :ignore-types="[value.type]" :value="value" direction="to" />
    </Tab>
  </Tabbed>
</template>
