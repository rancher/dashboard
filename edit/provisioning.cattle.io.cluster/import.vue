<script>
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import Loading from '@/components/Loading';
import NameNsDescription from '@/components/form/NameNsDescription';
import Tabbed from '@/components/Tabbed';
import Labels from './Labels';
import AgentEnv from './AgentEnv';
// import { set } from '@/utils/object';

export default {
  components: {
    Loading,
    NameNsDescription,
    CruResource,
    Tabbed,
    Labels,
    AgentEnv
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },

    provider: {
      type:     String,
      required: true,
    },
  },

  fetch() {
    // if ( !this.value.spec.rkeConfig ) {
    // set(this.value.spec, 'rkeConfig', {});
    // }
  },

  data() {
    return {};
  },

  computed: {},

  methods: {},
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :mode="mode"
    :resource="value"
    :errors="errors"
    @finish="save"
    @error="e=>errors = e"
  >
    <div class="mt-20">
      <NameNsDescription
        v-if="!isView"
        v-model="value"
        :mode="mode"
        :namespaced="false"
        name-label="cluster.name.label"
        name-placeholder="cluster.name.placeholder"
        description-label="cluster.description.label"
        description-placeholder="cluster.description.placeholder"
      />
    </div>

    <Tabbed :side-tabs="true">
      <AgentEnv v-model="value" :mode="mode" />
      <Labels v-model="value" :mode="mode" />
    </Tabbed>
  </CruResource>
</template>
