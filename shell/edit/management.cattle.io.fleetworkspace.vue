<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import Labels from '@shell/components/form/Labels';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { FLEET, MANAGEMENT, SCHEMA } from '@shell/config/types';
// import RoleBindings from '@shell/components/RoleBindings';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { SCOPE_NAMESPACE, SCOPE_CLUSTER } from '@shell/components/RoleBindings.vue';
import { NAME as FLEET_NAME } from '@shell/config/product/fleet';
// import KeyValue from '@shell/components/form/KeyValue.vue';
import { mapState } from 'vuex';
import { LAST_NAMESPACE, WORKSPACE } from '@shell/store/prefs';
import { exceptionToErrorsArray } from '@shell/utils/error';
import Banner from '@components/Banner/Banner.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';

export default {
  name: 'FleetCruWorkspace',

  emits: ['input'],

  inheritAttrs: false,
  components:   {
    CruResource,
    Labels,
    Loading,
    NameNsDescription,
    Tabbed,
    Tab,
    Banner,
    ArrayList
  },

  mixins: [CreateEditView],

  async fetch() {
    this.rancherClusters = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });

    if (this.$store.getters['management/schemaFor']( FLEET.CLUSTER )) {
      this.fleetClusters = await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER });
    }

    if (this.hasRepoRestrictionSchema) {
      const restrictions = await this.$store.dispatch('management/findAll', { type: FLEET.GIT_REPO_RESTRICTION });

      const workSpaceRestriction = restrictions.find((item) => {
        return item.metadata.namespace === this.value.metadata.name && item.metadata.name.startsWith(`restriction-${ this.value.metadata.name }`);
      });

      if (workSpaceRestriction) {
        this.workSpaceRestriction = workSpaceRestriction;
      }
    }

    this.restrictionsOptions = await this.$store.getters[`type-map/optionsFor`](FLEET.GIT_REPO_RESTRICTION);
    this.restrictionsSchema = await this.$store.getters[`management/schemaFor`](FLEET.GIT_REPO_RESTRICTION);
  },

  data() {
    this.value['spec'] = this.value.spec || {};

    return {
      fleetClusters:            null,
      rancherClusters:          null,
      workSpaceRestriction:     null,
      restrictions:             [],
      targetNamespaces:         [],
      restrictionsSchema:       { spec: {} },
      namespace:                this.$store.getters['prefs/get'](LAST_NAMESPACE),
      hasRepoRestrictionSchema: !!this.$store.getters['management/schemaFor']( FLEET.GIT_REPO_RESTRICTION )
    };
  },

  methods: {
    async saveAll(buttonCb) {
      // Anyone who can edit workspace

      try {
        await this.value.save();

        // IF there is a restriction update it
        if (this.workSpaceRestriction) {
          await this.workSpaceRestriction.save();
        }

        // If there is no restriction and targetnamespace is set then create it.
        if (!this.workSpaceRestriction && this.targetNamespaces.length) {
          // For users with more limited permissions the gitreporestriction schema may not be visible until they create a workspace
          if (!this.hasRepoRestrictionSchema) {
            await this.$store.dispatch('management/find', { type: SCHEMA, id: FLEET.GIT_REPO_RESTRICTION }, { force: true });
          }
          const model = await this.$store.dispatch(`management/create`, {
            type:                    FLEET.GIT_REPO_RESTRICTION,
            allowedTargetNamespaces: this.targetNamespaces,
            metadata:                {
              // restriction- prefix is added to the workspace name
              // to identify automatically created GitRepoRestrictions
              // when adding targetNamespaces at the point of workspace creation
              name:      `restriction-${ this.value.metadata.name }-${ Date.now() }`,
              namespace: this.value.metadata.name // what the user types
            }
          });

          await model.save();
        }

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
  },

  computed: {
    ...mapState(['allWorkspaces', 'workspace']),

    allowedTargetNamespaces: {
      get() {
        return this.workSpaceRestriction?.allowedTargetNamespaces || [];
      },

      set(value) {
        if (this.workSpaceRestriction) {
          this.workSpaceRestriction.allowedTargetNamespaces = value;
        }

        this.targetNamespaces = value;
      }
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
      :value="value"
      :mode="mode"
      :namespaced="false"
      @update:value="$emit('input', $event)"
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
          :value="value"
          :mode="mode"
          @update:value="$emit('input', $event)"
        />
      </Tab>
      <Tab
        name="allowedtargetnamespaces"
        label-key="fleet.workspaces.tabs.restrictions"
      >
        <Banner
          color="info"
        >
          <div>
            <t
              k="fleet.restrictions.banner"
              :count="allowedTargetNamespaces.length"
              :raw="true"
            />
            <a
              v-if="!!allowedTargetNamespaces.length"
              @click="workSpaceRestriction.goToDetail()"
            >
              {{ t('generic.here') }}
            </a>
          </div>
        </Banner>

        <ArrayList
          key="labels"
          v-model:value="allowedTargetNamespaces"
          :add-label="t('fleet.restrictions.addLabel')"
          :mode="mode"
          :title="t('fleet.restrictions.addTitle')"
          :read-allowed="false"
          :value-can-be-empty="true"
        />
      </Tab>
    </Tabbed>
  </CruResource>
</template>
