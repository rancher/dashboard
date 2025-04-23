<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { HCI, SCHEMA, VIRTUAL_HARVESTER_PROVIDER, NORMAN } from '@shell/config/types';
import ClusterMembershipEditor from '@shell/components/form/Members/ClusterMembershipEditor';
import { Banner } from '@components/Banner';
import Labels from '@shell/edit/provisioning.cattle.io.cluster/Labels';
import AgentEnv from '@shell/edit/provisioning.cattle.io.cluster/AgentEnv';
import { set, get, clone } from '@shell/utils/object';
import { CAPI as CAPI_LABEL } from '@shell/config/labels-annotations';
import cloneDeep from 'lodash/cloneDeep';

import { createYaml } from '@shell/utils/create-yaml';

const REAL_TYPE = NORMAN.CLUSTER;
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
  },
  async fetch() {
    const store = this.$store;

    if (this.value.id) {
      const liveNormanCluster = await this.value.findNormanCluster();

      this.normanCluster = await store.dispatch(`rancher/clone`, { resource: liveNormanCluster });
    } else {
      this.normanCluster = await store.dispatch('rancher/create', { type: NORMAN.CLUSTER, ...cloneDeep(defaultCluster) }, { root: true });
    }
  },

  data() {
    return { membershipUpdate: {}, normanCluster: { name: '' } };
  },
  created() {
    this.registerAfterHook(this.saveRoleBindings, 'save-role-bindings');
  },

  computed: {
    generateYaml() {
      return () => {
        const resource = this.normanCluster;

        const inStore = this.$store.getters['currentStore'](resource);
        const schemas = this.$store.getters[`${ inStore }/all`](SCHEMA);
        const clonedResource = clone(resource);

        delete clonedResource.isSpoofed;

        const out = createYaml(schemas, REAL_TYPE, clonedResource);

        return out;
      };
    },
  },

  methods: {
    done() {
      return this.$router.replace({
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          resource:  HCI.CLUSTER,
          namespace: this.value.metadata.namespace,
          id:        this.normanCluster.id,
        },
      });
    },

    async saveOverride() {
      set(this.normanCluster, 'labels', {
        ...(get(this.normanCluster, 'labels') || {}),
        [CAPI_LABEL.PROVIDER]: VIRTUAL_HARVESTER_PROVIDER,
      });

      set(this.normanCluster, 'type', REAL_TYPE);
      set(this.value, 'type', REAL_TYPE);

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
    :generate-yaml="generateYaml"
    @finish="saveOverride"
    @error="e=>errors = e"
  >
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
          :mode="mode"
          :parent-id="normanCluster.id ? normanCluster.id : null"
          @membership-update="onMembershipUpdate"
        />
      </Tab>
      <AgentEnv
        v-model:value="normanCluster"
        :mode="mode"
      />
      <Labels
        v-model:value="normanCluster"
        :mode="mode"
      />
    </Tabbed>
  </CruResource>
</template>
