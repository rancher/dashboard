<script>
import { NODE, EVENT, WORKLOAD_TYPES } from '@/config/types';
import createEditView from '@/mixins/create-edit-view';
import Networking from '@/components/form/Networking';
import Tab from '@/components/Tabbed/Tab';
import Container from '@/components/form/Container';
import Loading from '@/components/Loading';
import Tabbed from '@/components/Tabbed';
import NodeScheduling from '@/components/form/NodeScheduling';
import SortableTable from '@/components/SortableTable';
import {
  STATUS, LAST_UPDATED, REASON, MESSAGE, CREATION_DATE
} from '@/config/table-headers';
import { mapGetters } from 'vuex';

export default {
  name: 'PodDetail',

  components: {
    Networking,
    Container,
    NodeScheduling,
    Tabbed,
    Tab,
    Loading,
    SortableTable
  },

  mixins: [createEditView],

  async fetch() {
    const owners = await this.value.getOwners() || [];

    this.workload = (owners.filter((owner) => {
      return !!WORKLOAD_TYPES[owner.type];
    }) || [])[0];

    const { nodeName } = this.value.spec;

    const nodes = await this.$store.dispatch('cluster/findAll', { type: NODE });
    const out = nodes.filter((node) => {
      return node?.metadata?.name === nodeName;
    })[0];

    this.node = out;

    this.allEvents = await this.$store.dispatch('cluster/findAll', { type: EVENT });
  },

  data() {
    return {
      workload: null, node: null, allEvents: []
    };
  },

  computed:   {
    containers() {
      return this.value.spec.containers || [];
    },

    statusHeaders() {
      return [
        {
          name:  'Type',
          label: this.t('tableHeaders.type'),
          value: `type`,
          sort:  `type`,
        },
        STATUS,
        LAST_UPDATED,
        REASON,
        MESSAGE
      ];
    },

    eventHeaders() {
      return [
        REASON,
        MESSAGE,
        CREATION_DATE
      ];
    },

    events() {
      return this.allEvents.filter((event) => {
        return event.involvedObject.uid === this.value.metadata.uid;
      });
    },

    ...mapGetters({ t: 'i18n/t' })
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <div v-else>
    <Tabbed :side-tabs="true">
      <Tab :label="t('workload.container.titles.containers')" name="containers">
        <template v-for="container in containers">
          <Container :key="container.name" :value="container" mode="view" />
        </template>
      </Tab>
      <Tab name="status" :label="t('workload.container.titles.status')">
        <SortableTable
          :table-actions="false"
          :row-actions="false"
          :search="false"
          key-field="type"
          :rows="value.status.conditions"
          :headers="statusHeaders"
        >
        </SortableTable>
      </Tab>
      <Tab :label="t('workload.container.titles.networking')" name="networking">
        <Networking v-model="value.spec" :mode="mode" />
      </Tab>
      <Tab :label="t('workload.container.titles.nodeScheduling')" name="nodeScheduling">
        <NodeScheduling :mode="mode" :value="value.spec" :nodes="[]" />
      </Tab>
    </Tabbed>
    <div class="spacer" />
    <div class="simple-box">
      <h3>{{ t('workload.container.titles.events') }}</h3>
      <hr />
      <SortableTable
        :table-actions="false"
        :row-actions="false"
        :search="false"
        key-field="id"
        :rows="events"
        :headers="eventHeaders"
      >
      </SortableTable>
    </div>
  </div>
</template>
