<script>
import { NODE, WORKLOAD_TYPES } from '@/config/types';
import createEditView from '@/mixins/create-edit-view';
import Networking from '@/components/form/Networking';
import Tab from '@/components/Tabbed/Tab';
import Container from '@/components/form/Container';
import Loading from '@/components/Loading';
import ResourceTabs from '@/components/form/ResourceTabs';
import NodeScheduling from '@/components/form/NodeScheduling';
import { defaultAsyncData } from '@/components/ResourceDetail';
import { mapGetters } from 'vuex';

export default {
  name: 'PodDetail',

  components: {
    Networking,
    Container,
    NodeScheduling,
    ResourceTabs,
    Tab,
    Loading,
  },

  mixins: [createEditView],

  async fetch() {
    const { nodeName } = this.value.spec;

    const nodes = await this.$store.dispatch('cluster/findAll', { type: NODE });
    const out = nodes.filter((node) => {
      return node?.metadata?.name === nodeName;
    })[0];

    this.node = out;
  },

  async asyncData(ctx) {
    const out = await defaultAsyncData(ctx);

    let node;

    if ( out.value?.spec?.nodeName ) {
      node = await ctx.store.dispatch('cluster/find', { type: NODE, id: out.value.spec.nodeName });
    }

    const owners = await out.value.getOwners() || [];

    const workload = owners.find((owner) => {
      return Object.values(WORKLOAD_TYPES).includes(owner.type);
    });

    out.moreDetails = out.moreDetails || [];

    if ( workload ) {
      out.moreDetails.push({
        label:         'Workload',
        formatter:     'LinkDetail',
        formatterOpts: { row: workload },
        content:       workload.metadata.name
      });
    }

    if ( node ) {
      out.moreDetails.push({
        label:         'Node',
        formatter:     'LinkDetail',
        formatterOpts: { row: node },
        content:       node.metadata.name
      });
    }

    return out;
  },

  data() {
    return { moreDetails: null };
  },

  computed:   {
    containers() {
      return this.value.spec.containers || [];
    },

    ...mapGetters({ t: 'i18n/t' })
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTabs v-else class="spacer" mode="view" :value="value">
    <Tab :label="t('workload.container.titles.containers')" name="containers" :weight="3">
      <template v-for="container in containers">
        <Container :key="container.name" :value="container" mode="view" />
      </template>
    </Tab>
    <Tab :label="t('workload.container.titles.networking')" name="networking" :weight="2">
      <Networking v-model="value.spec" :mode="mode" />
    </Tab>
    <Tab :label="t('workload.container.titles.nodeScheduling')" name="nodeScheduling" :weight="1">
      <NodeScheduling :mode="mode" :value="value.spec" :nodes="[]" />
    </Tab>
  </ResourceTabs>
</template>
