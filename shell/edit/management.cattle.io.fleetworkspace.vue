<script>
import { _CREATE } from '@shell/config/query-params';
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import Labels from '@shell/components/form/Labels';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { FLEET } from '@shell/config/types';
import { FLEET as FLEET_ANNOTATIONS } from '@shell/config/labels-annotations';
// import RoleBindings from '@shell/components/RoleBindings';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { SCOPE_NAMESPACE, SCOPE_CLUSTER } from '@shell/components/RoleBindings.vue';
import { NAME as FLEET_NAME } from '@shell/config/product/fleet';
// import KeyValue from '@shell/components/form/KeyValue.vue';
import { mapState } from 'vuex';
import { LAST_NAMESPACE, WORKSPACE } from '@shell/store/prefs';
import { exceptionToErrorsArray } from '@shell/utils/error';
import FleetOCIStorageSecret from '@shell/components/fleet/FleetOCIStorageSecret.vue';

export default {
  name: 'FleetCruWorkspace',

  emits: ['input'],

  inheritAttrs: false,
  components:   {
    CruResource,
    FleetOCIStorageSecret,
    Labels,
    NameNsDescription,
    Tabbed,
    Tab,
  },

  mixins: [CreateEditView],

  data() {
    this.value['spec'] = this.value.spec || {};

    return { namespace: this.$store.getters['prefs/get'](LAST_NAMESPACE) };
  },

  methods: {
    async saveAll(buttonCb) {
      // Anyone who can edit workspace

      try {
        await this.value.save();

        await this.value.waitForWorkspaceSchema(20000, (schema) => {
          // For standard user if there are no workspaces, user can't list workspaces
          // Therefore wait for it.
          return schema.collectionMethods?.includes('GET');
        });

        await this.$store.dispatch( 'management/findAll', { type: FLEET.WORKSPACE });

        this.$store.commit('updateWorkspace', { value: this.value.metadata.name, getters: this.$store.getters } );
        this.$store.dispatch('prefs/set', { key: WORKSPACE, value: this.value.metadata.name });

        buttonCb(true);
        this.done();
      } catch (err) {
        console.error(err) ; // eslint-disable-line no-console
        buttonCb(false);
        this.errors = exceptionToErrorsArray(err);
      }
    },

    updateDefaultOCIStorageSecret(secretName) {
      this.value.metadata.annotations[FLEET_ANNOTATIONS.OCI_STORAGE_SECRET_DEFAULT] = secretName;
    }
  },

  computed: {
    ...mapState(['allWorkspaces', 'workspace']),

    defaultOCIStorageSecret() {
      return this.value.metadata?.annotations?.[FLEET_ANNOTATIONS.OCI_STORAGE_SECRET_DEFAULT];
    },

    isCreate() {
      return this.mode === _CREATE;
    },

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
  <CruResource
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
      :value="value"
      :mode="mode"
      :namespaced="false"
      @update:value="$emit('input', $event)"
    />

    <Tabbed
      :side-tabs="true"
      :default-tab="defaultTab || 'members'"
      :use-hash="useTabbedHash"
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
        v-if="!isCreate"
        name="ociRegistries"
        label-key="fleet.workspaces.tabs.ociRegistry"
        :weight="2"
      >
        <FleetOCIStorageSecret
          data-testid="default-oci-storage-secret"
          :secret="defaultOCIStorageSecret"
          :workspace="value.metadata.name"
          :mode="mode"
          :allow-default="false"
          @update:value="updateDefaultOCIStorageSecret"
        />
      </Tab>
      <Tab
        name="labels"
        label-key="generic.labelsAndAnnotations"
        :weight="1"
      >
        <Labels
          :value="value"
          :mode="mode"
          @update:value="$emit('input', $event)"
        />
      </Tab>
    </Tabbed>
  </CruResource>
</template>
