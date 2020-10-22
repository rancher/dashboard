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

export default {
  components: {
    Tabbed,
    Tab,
    Conditions,
    SortableTable
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
      default: 'create'
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
      return this.isView && !!this.value?.status?.conditions;
    },

    showEvents() {
      return this.isView && !this.$fetchState.pending && this.hasEvents && this.events.length;
    },

    hasCustomTabs() {
      return !!Object.keys(this.$slots).length;
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
        return event.involvedObject.uid === this.value.metadata.uid;
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
  <Tabbed v-if="hasCustomTabs || showConditions || showEvents" v-bind="$attrs">
    <slot />

    <Tab v-if="showConditions" :label="t('resourceTabs.tabs.conditions')" name="conditions">
      <Conditions :value="value" />
    </Tab>

    <Tab v-if="showEvents" :label="t('resourceTabs.tabs.events')" name="events">
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
  </Tabbed>
</template>
