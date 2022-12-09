<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import Labels from '@shell/components/form/Labels';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { FLEET, MANAGEMENT } from '@shell/config/types';
// import RoleBindings from '@shell/components/RoleBindings';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { SCOPE_NAMESPACE, SCOPE_CLUSTER } from '@shell/components/RoleBindings.vue';
import { NAME as FLEET_NAME } from '@shell/config/product/fleet';
import KeyValue from '@shell/components/form/KeyValue.vue';

export default {
  name: 'FleetCruWorkspace',

  components: {
    CruResource,
    Labels,
    Loading,
    NameNsDescription,
    // RoleBindings,
    Tabbed,
    Tab,
    KeyValue,
  },

  mixins: [CreateEditView],

  async fetch() {
    this.rancherClusters = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });
    if (this.$store.getters['management/schemaFor']( FLEET.CLUSTER )) {
      this.fleetClusters = await this.$store.dispatch['management/findAll'](FLEET.CLUSTER);
    }
  },

  data() {
    this.$set(this.value, 'spec', this.value.spec || {});

    return {
      fleetClusters:   null,
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
    <NameNsDescription
      v-model="value"
      :mode="mode"
      :namespaced="false"
    />

    <Tabbed
      :side-tabs="true"
      default-tab="members"
    >
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

      <Tab
        name="labels"
        label-key="generic.labelsAndAnnotations"
      >
        <Labels
          v-model="value"
          :mode="mode"
        />
      </Tab>
      <Tab
        name="allowedtargetnamespaces"
        label-key="fleet.workspaces.tabs.restrictions"
      >
        <KeyValue
          key="labels"
          v-model="value.spec.allowedTargetNameSpaces"
          :add-label="t('labels.addLabel')"
          :mode="mode"
          :title="t('labels.labels.title')"
          :read-allowed="false"
          :value-can-be-empty="true"
        />
      </Tab>
    </Tabbed>
  </CruResource>
</template>
