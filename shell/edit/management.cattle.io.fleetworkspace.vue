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
import { mapGetters } from 'vuex';
import { LAST_NAMESPACE } from '@shell/store/prefs';

export default {
  name: 'FleetCruWorkspace',

  components: {
    CruResource,
    Labels,
    Loading,
    NameNsDescription,
    Tabbed,
    Tab,
  },

  mixins: [CreateEditView],

  async fetch() {
    this.rancherClusters = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });

    if (this.$store.getters['management/schemaFor']( FLEET.CLUSTER )) {
      this.fleetClusters = await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER });
    }
    this.restrictionsOptions = await this.$store.getters[`type-map/optionsFor`](FLEET.GIT_REPO_RESTRICTION);
    this.restrictionsSchema = await this.$store.getters[`management/schemaFor`](FLEET.GIT_REPO_RESTRICTION);
  },

  data() {
    this.$set(this.value, 'spec', this.value.spec || {});

    return {
      fleetClusters:      null,
      rancherClusters:    null,
      restrictionsSchema: { spec: {} },
      namespace:          this.$store.getters['prefs/get'](LAST_NAMESPACE)
    };
  },

  methods: {
    async saveAll() {
      // Anyone who can edit workspace
      await this.value.save();
    },

  },

  computed: {
    ...mapGetters(['workspace']),

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
    @finish="saveAll"
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
    </Tabbed>
  </CruResource>
</template>
