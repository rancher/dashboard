<script>
import CreateEditView from '@shell/mixins/create-edit-view';

import CruResource from '@shell/components/CruResource';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { CAPI, HCI } from '@shell/config/types';
import ClusterMembershipEditor from '@shell/components/form/Members/ClusterMembershipEditor';
import { Banner } from '@components/Banner';
import { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor.vue';
import { NAME as HARVESTER_MANAGER } from '@shell/config/product/harvester-manager';
import { HARVESTER as HARVESTER_FEATURE, mapFeature } from '@shell/store/features';
import { addObject } from '@shell/utils/array';
import { HIDE_DESC, mapPref } from '@shell/store/prefs';
import Labels from './Labels';
import AgentEnv from './AgentEnv';

const HARVESTER_HIDE_KEY = 'cm-harvester-import';

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
    return { membershipUpdate: {} };
  },

  computed: {
    canManageMembers() {
      return canViewClusterMembershipEditor(this.$store);
    },

    hideDescriptions: mapPref(HIDE_DESC),

    harvesterEnabled: mapFeature(HARVESTER_FEATURE),

    harvesterLocation() {
      return this.isCreate && !this.hideDescriptions.includes(HARVESTER_HIDE_KEY) && this.harvesterEnabled ? {
        name:   `c-cluster-product-resource`,
        params: {
          product:   HARVESTER_MANAGER,
          resource:  HCI.CLUSTER,
        }
      } : null;
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

    hideHarvesterNotice() {
      const neu = this.hideDescriptions.slice();

      addObject(neu, HARVESTER_HIDE_KEY);

      this.hideDescriptions = neu;
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
    component-testid="cluster-manager-import"
    @finish="saveOverride"
    @error="e=>errors = e"
  >
    <div class="mt-20">
      <Banner
        v-if="harvesterLocation"
        color="info"
        :closable="true"
        class="mb-20"
        @close="hideHarvesterNotice"
      >
        {{ t('cluster.harvester.importNotice') }}
        <nuxt-link :to="harvesterLocation">
          {{ t('product.harvesterManager') }}
        </nuxt-link>
      </Banner>

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
        <ClusterMembershipEditor :mode="mode" :parent-id="value.mgmt ? value.mgmt.id : null" @membership-update="onMembershipUpdate" />
      </Tab>
      <AgentEnv v-model="value" :mode="mode" />
      <Labels v-model="value" :mode="mode" />
    </Tabbed>
  </CruResource>
</template>
