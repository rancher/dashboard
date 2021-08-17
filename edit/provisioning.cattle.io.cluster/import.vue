<script>
import CreateEditView from '@/mixins/create-edit-view';

import CruResource from '@/components/CruResource';
import Loading from '@/components/Loading';
import NameNsDescription from '@/components/form/NameNsDescription';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import { CAPI } from '@/config/types';
import ClusterMembershipEditor from '@/components/form/Members/ClusterMembershipEditor';
import Banner from '@/components/Banner';
import { canViewClusterMembershipEditor } from '@/components/form/Members/ClusterMembershipEditor.vue';
import Labels from './Labels';
import AgentEnv from './AgentEnv';

export default {
  components: {
    Banner,
    ClusterMembershipEditor,
    Loading,
    NameNsDescription,
    CruResource,
    Tab,
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
    return { membershipUpdate: {}, hasOwner: false };
  },

  computed: {
    canManageMembers() {
      return canViewClusterMembershipEditor(this.$store);
    }
  },

  watch:    {
    hasOwner() {
      if (this.hasOwner) {
        this.$set(this, 'errors', this.errors.filter(e => e !== this.t('cluster.haveOneOwner')));
      } else {
        this.errors.push(this.t('cluster.haveOneOwner'));
      }
    }
  },

  created() {
    this.registerAfterHook(this.saveRoleBindings, 'save-role-bindings');
  },

  methods: {
    done() {
      return this.$router.replace({
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          resource:  CAPI.RANCHER_CLUSTER,
          namespace: this.value.metadata.namespace,
          id:        this.value.metadata.name,
        },
      });
    },

    async saveRoleBindings() {
      await this.value.waitForMgmt();

      if (this.membershipUpdate.save) {
        await this.membershipUpdate.save(this.value.mgmt.id);
      }
    },

    async saveOverride(btnCb) {
      await this.save(btnCb);
    },

    onMembershipUpdate(update) {
      this.$set(this, 'membershipUpdate', update);
    },

    onHasOwnerChanged(hasOwner) {
      this.$set(this, 'hasOwner', hasOwner);
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :mode="mode"
    :resource="value"
    :errors="errors"
    :validation-passed="!canManageMembers || hasOwner"
    @finish="saveOverride"
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
      <Tab v-if="canManageMembers" name="memberRoles" label-key="cluster.tabs.memberRoles" :weight="3">
        <Banner v-if="isEdit" color="info">
          {{ t('cluster.memberRoles.removeMessage') }}
        </Banner>
        <ClusterMembershipEditor :mode="mode" :parent-id="value.mgmt ? value.mgmt.id : null" @membership-update="onMembershipUpdate" @has-owner-changed="onHasOwnerChanged" />
      </Tab>
      <AgentEnv v-model="value" :mode="mode" />
      <Labels v-model="value" :mode="mode" />
    </Tabbed>
  </CruResource>
</template>
