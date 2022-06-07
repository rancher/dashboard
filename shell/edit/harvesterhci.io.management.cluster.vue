<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { HCI, SCHEMA, CAPI, VIRTUAL_HARVESTER_PROVIDER } from '@shell/config/types';
import ClusterMembershipEditor from '@shell/components/form/Members/ClusterMembershipEditor';
import { Banner } from '@components/Banner';
import Labels from '@shell/edit/provisioning.cattle.io.cluster/Labels';
import AgentEnv from '@shell/edit/provisioning.cattle.io.cluster/AgentEnv';
import { set, get, clone } from '@shell/utils/object';
import { CAPI as CAPI_LABEL } from '@shell/config/labels-annotations';

import { createYaml } from '@shell/utils/create-yaml';

const REAL_TYPE = CAPI.RANCHER_CLUSTER;

export default {
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

  data() {
    return { membershipUpdate: {} };
  },

  computed: {
    generateYaml() {
      return () => {
        const resource = this.value;

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
          id:        this.value.metadata.name,
        },
      });
    },
    async saveOverride() {
      set(this.value, 'metadata.labels', {
        ...(get(this.value, 'metadata.labels') || {}),
        [CAPI_LABEL.PROVIDER]: VIRTUAL_HARVESTER_PROVIDER,
      });

      set(this.value, 'type', REAL_TYPE);

      await this.save(...arguments);

      this.value.waitForMgmt().then(() => {
        if (this.membershipUpdate.save) {
          this.membershipUpdate.save(this.value.mgmt.id);
        }
      });
    },
    onMembershipUpdate(update) {
      this.$set(this, 'membershipUpdate', update);
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
      <Tab name="memberRoles" label-key="cluster.tabs.memberRoles" :weight="3">
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
