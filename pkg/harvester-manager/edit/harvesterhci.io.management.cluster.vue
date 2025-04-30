<script>
import CreateEditView from '@shell/mixins/create-edit-view';

import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { HCI, VIRTUAL_HARVESTER_PROVIDER, NORMAN } from '@shell/config/types';
import ClusterMembershipEditor, { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor';
import { Banner } from '@components/Banner';
import Labels from '@shell/components/form/Labels.vue';
import KeyValue from '@shell/components/form/KeyValue';

import { set, get } from '@shell/utils/object';
import { CAPI as CAPI_LABEL } from '@shell/config/labels-annotations';
import cloneDeep from 'lodash/cloneDeep';
import { _VIEW } from '@shell/config/query-params';

const defaultCluster = {
  agentEnvVars: [],
  labels:       {},
  annotations:  {}
};

export default {
  emits: ['input'],

  components: {
    Banner,
    ClusterMembershipEditor,
    NameNsDescription,
    CruResource,
    Tab,
    Tabbed,
    Labels,
    KeyValue,
  },

  mixins: [CreateEditView],

  inheritAttrs: false,

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },
  },
  async fetch() {
    const store = this.$store;

    if (this.value.id) {
      const liveNormanCluster = await this.value.findNormanCluster();

      this.normanCluster = await store.dispatch('rancher/clone', { resource: liveNormanCluster });
      if ( this.normanCluster && !this.normanCluster?.agentEnvVars) {
        this.normanCluster.agentEnvVars = [];
      }
    } else {
      this.normanCluster = await store.dispatch('rancher/create', { type: NORMAN.CLUSTER, ...cloneDeep(defaultCluster) }, { root: true });
    }
  },

  data() {
    return {
      membershipUpdate: {}, normanCluster: { name: '' }, VIEW: _VIEW
    };
  },
  created() {
    this.registerAfterHook(this.saveRoleBindings, 'save-role-bindings');
  },

  computed: {
    canManageMembers() {
      return canViewClusterMembershipEditor(this.$store);
    },
  },

  methods: {
    done() {
      return this.$router.replace({
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          resource:  HCI.CLUSTER,
          namespace: this.normanCluster.provisioningClusterNs,
          id:        this.normanCluster.provisioningClusterName,
        },
      });
    },

    async saveOverride() {
      set(this.normanCluster, 'labels', {
        ...(get(this.normanCluster, 'labels') || {}),
        [CAPI_LABEL.PROVIDER]: VIRTUAL_HARVESTER_PROVIDER,
      });

      set(this.normanCluster, 'type', NORMAN.CLUSTER);
      set(this.value, 'type', NORMAN.CLUSTER);

      await this.save(...arguments);
    },

    onMembershipUpdate(update) {
      this.membershipUpdate = update;
    },

    async saveRoleBindings() {
      if (this.membershipUpdate.save) {
        await this.membershipUpdate.save(this.normanCluster.id);
      }
    },

    async actuallySave() {
      if (this.isEdit) {
        return await this.normanCluster.save();
      } else {
        await this.normanCluster.save();

        return await this.normanCluster.waitForProvisioning();
      }
    },
  },
};
</script>

<template>
  <CruResource
    :mode="mode"
    :resource="value"
    :errors="errors"
    :validation-passed="true"
    :done-route="doneRoute"
    :can-yaml="false"
    @finish="saveOverride"
    @error="e=>errors = e"
  >
    <Loading
      v-if="$fetchState.pending"
      mode="relative"
    />
    <div v-else>
      <Banner
        v-if="isCreate"
        color="warning"
      >
        {{ t('harvesterManager.cluster.supportMessage') }}
      </Banner>
      <div class="mt-20">
        <NameNsDescription
          v-if="!isView"
          v-model:value="normanCluster"
          :mode="mode"
          :namespaced="false"
          :nameEditable="!isEdit"
          nameKey="name"
          descriptionKey="description"
          name-label="cluster.name.label"
          name-placeholder="cluster.name.placeholder"
          description-label="cluster.description.label"
          description-placeholder="cluster.description.placeholder"
        />
      </div>

      <Tabbed :side-tabs="true">
        <Tab
          name="memberRoles"
          label-key="cluster.tabs.memberRoles"
          :weight="3"
        >
          <Banner
            v-if="isEdit"
            color="info"
          >
            {{ t('cluster.memberRoles.removeMessage') }}
          </Banner>
          <ClusterMembershipEditor
            :mode="canManageMembers ? mode : VIEW"
            :parent-id="normanCluster.id ? normanCluster.id : null"
            @membership-update="onMembershipUpdate"
          />
        </Tab>
        <Tab
          name="agentEnv"
          label-key="cluster.tabs.agentEnv"
        >
          <KeyValue
            v-model:value="normanCluster.agentEnvVars"
            :mode="mode"
            key-name="name"
            :as-map="false"
            :preserve-keys="['valueFrom']"
            :supported="(row) => typeof row.valueFrom === 'undefined'"
            :read-allowed="true"
            :value-can-be-empty="true"
            :key-label="t('cluster.agentEnvVars.keyLabel')"
            :parse-lines-from-file="true"
          />
        </Tab>
        <Tab
          name="labels"
          label-key="generic.labelsAndAnnotations"
        >
          <Labels
            v-model:value="normanCluster"
            :mode="mode"
          />
        </Tab>
      </Tabbed>
    </div>
  </CruResource>
</template>
