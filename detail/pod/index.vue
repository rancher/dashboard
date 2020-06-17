<script>
import { NODE } from '@/config/types';
import createEditView from '@/mixins/create-edit-view';
import DetailTop from '@/components/DetailTop';
import ResourceTabs from '@/components/form/ResourceTabs';
import LinkDetail from '@/components/formatter/LinkDetail';
import LiveDate from '@/components/formatter/LiveDate';
import SortableTable from '@/components/SortableTable';
import Networking from '@/components/form/Networking';
import Tab from '@/components/Tabbed/Tab';
import Scheduling from '@/components/form/Scheduling';
import Container from '@/components/form/Container';
import PodSecurity from '@/components/form/PodSecurity';
import Loading from '@/components/Loading';

export default {

  name:       'PodDetail',
  components: {
    DetailTop,
    ResourceTabs,
    LinkDetail,
    LiveDate,
    SortableTable,
    Tab,
    Networking,
    Scheduling,
    Container,
    PodSecurity,
    Loading
  },

  mixins: [createEditView],

  fetch() {
    this.findWorkload();
    this.findNode();
  },

  data() {
    return {
      workload: null, node: null, nodes: []
    };
  },

  computed:   {
    detailTopColumns() {
      return [
        {
          title:   'Workload',
          name:  'workload'
        },
        {
          title:   'Pod IP',
          content: this.value.status.podIP
        },
        {
          title: 'Node',
          name:  'node'
        },
        {
          title:   'Pod Restarts',
          content: (this.value?.status?.containerStatuses || [])[0]?.restartCount
        },
        {
          title:   'Created',
          name:  'created'
        }
      ];
    },

    containerHeaders() {
      return [
        {
          name:      'status',
          label:     'Status',
          value:     'stateDisplay',
          formatter: 'BadgeStateFormatter'
        },
        {
          name:  'name',
          label: 'Name',
          value: 'name'
        },
        {
          name:  'image',
          label: 'Image',
          value: 'image'
        },
        {
          name:  'imagePullPolicy',
          label: 'Image Pull Policy',
          value: 'imagePullPolicy'
        }
      ];
    },

    containers() {
      return (this.value.spec.containers || []).map((container) => {
        container.status = this.findContainerStatus(container);
        if (container.status) {
          container.stateBackground = this.value.containerStateColor(container.status);
          container.stateDisplay = this.value.containerStateDisplay(container.status);
        }

        return container;
      });
    }
  },

  methods: {
    // containers are listed in both 'spec.containers' and 'status.containerStatuses', table needs info from each
    findContainerStatus(container) {
      const name = container.name;
      const statuses = this.value?.status?.containerStatuses;

      return (statuses || []).filter(status => status.name === name)[0];
    },

    async findWorkload() {
      const kind = this.value.metadata.ownerReferences[0].kind;
      const uid = this.value.metadata.ownerReferences[0].uid;
      const schema = this.$store.getters['cluster/schema'](kind);

      if (schema) {
        const type = schema.id;
        const allOfResourceType = await this.$store.dispatch('cluster/findAll', { type });

        const resourceInstance = allOfResourceType.filter(resource => resource?.metadata?.uid === uid)[0];

        this.workload = resourceInstance;
      }
    },

    async findNode() {
      const { nodeName } = this.value.spec;

      const nodes = await this.$store.dispatch('cluster/findAll', { type: NODE });
      const out = nodes.filter((node) => {
        return node?.metadata?.name === nodeName;
      })[0];

      this.nodes = nodes;
      this.node = out;
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <div v-else>
    <DetailTop :columns="detailTopColumns">
      <template #node>
        <LinkDetail v-if="node" :row="node" :value="node.metadata.name" />
      </template>
      <template #workload>
        <LinkDetail v-if="workload" :row="workload" :value="workload.metadata.name" />
      </template>
      <template #created>
        <LiveDate :value="value.metadata.creationTimestamp" :add-suffix="true" />
      </template>
    </DetailTop>

    <div class="spacer" />

    <div>
      <h2><t k="workload.container.titles.containers" /></h2>
      <SortableTable
        id="container-table"
        :table-actions="false"
        :row-actions="false"
        :search="false"
        :rows="containers"
        key-field="name"
        :headers="containerHeaders"
        :sub-rows="true"
        :sub-expandable="true"
        :sub-expand-column="true"
      >
        <template #sub-row="{row}">
          <tr class="sub-row">
            <td colspan="5">
              <Container class="container-subrow" :value="row" mode="view" />
            </td>
          </tr>
        </template>
      </SortableTable>
    </div>

    <div class="spacer" />

    <ResourceTabs v-model="value" :mode="mode">
      <template #before>
        <Tab name="networking" :label="t('workload.tabs.networking')">
          <Networking :value="value.spec" mode="view" />
        </Tab>
        <Tab name="scheduling" :label="t('workload.tabs.scheduling')">
          <Scheduling :value="value.spec" mode="view" :nodes="nodes" />
        </Tab>
        <Tab name="security" :label="t('workload.tabs.security')">
          <PodSecurity :value="value.spec" mode="view" />
        </Tab>
      </template>
    </ResourceTabs>
  </div>
</template>

<style>
.container-subrow {
  margin: 20px;
}

#container-table .row-selected{
  background-color: transparent
}
</style>
