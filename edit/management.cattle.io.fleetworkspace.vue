<script>
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import Labels from '@/components/form/Labels';
import Loading from '@/components/Loading';
import NameNsDescription from '@/components/form/NameNsDescription';
import { FLEET, MANAGEMENT } from '@/config/types';
// import RoleBindings from '@/components/RoleBindings';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import { SCOPE_NAMESPACE, SCOPE_CLUSTER } from '@/components/RoleBindings.vue';
import { NAME as FLEET_NAME } from '@/config/product/fleet';

export default {
  name: 'CruWorkspace',

  components: {
    CruResource,
    Labels,
    Loading,
    NameNsDescription,
    // RoleBindings,
    Tabbed,
    Tab,
  },

  mixins: [CreateEditView],

  async fetch() {
    this.rancherClusters = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });
    this.fleetClusters = await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER });
  },

  data() {
    return {
      fleetClusters:      null,
      rancherClusters: null,
    };
  },

  computed: {
    SCOPE_NAMESPACE() {
      return SCOPE_NAMESPACE;
    },

    SCOPE_CLUSTER() {
      return SCOPE_CLUSTER;
    },

    FLEET_NAME() {
      return FLEET_NAME;
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="true"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription v-model="value" :mode="mode" :namespaced="false" />

    <Tabbed :side-tabs="true" default-tab="members">
      <!-- <Tab name="members" label-key="generic.members" :weight="2">
        <RoleBindings
          ref="rb"
          :register-after-hook="registerAfterHook"
          :role-scope="SCOPE_CLUSTER"
          :binding-scope="SCOPE_NAMESPACE"
          :filter-role-value="FLEET_NAME"
          :namespace="value.name"
          :mode="mode"
          in-store="management"
        />
      </Tab> -->

      <Tab name="labels" label-key="generic.labelsAndAnnotations">
        <Labels v-model="value" :mode="mode" />
      </Tab>
    </Tabbed>
  </CruResource>
</template>
