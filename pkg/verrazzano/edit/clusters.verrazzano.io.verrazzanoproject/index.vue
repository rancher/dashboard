<script>
// Added by Verrazzano
import CruResource from '@shell/components/CruResource';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import LabelsTab from '@pkg/components/LabelsTab';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import NamespacesTab from '@pkg/edit/clusters.verrazzano.io.verrazzanoproject/NamespacesTab';
import NetworkPoliciesTab from '@pkg/components/NetworkPoliciesTab';
import SubjectsTab from '@pkg/components/SubjectsTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import TreeTabbed from '@pkg/components/TreeTabbed';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { NORMAN } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'VzProject',
  components: {
    CruResource,
    LabeledSelect,
    LabelsTab,
    Loading,
    NameNsDescription,
    NamespacesTab,
    NetworkPoliciesTab,
    SubjectsTab,
    TabDeleteButton,
    TreeTab,
    TreeTabbed,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:    String,
      default: 'create'
    },
  },
  data() {
    const clusterNames = this.getListField('spec.placement.clusters').map(cluster => cluster.name);

    return {
      clusters:   [],
      namespaces: [],
      clusterNames,
    };
  },
  async fetch() {
    // Use Norman API so that we get the Verrazzano-defined names
    // of the cluster and not just the Rancher-defined cluster ID.
    //
    const requests = { clusters: this.$store.dispatch('rancher/findAll', { type: NORMAN.CLUSTER }) };

    const hash = await allHash(requests);

    if (hash.clusters) {
      this.clusters = hash.clusters;
    }
  },
  methods: {
    setPlacementClusters(value) {
      if (Array.isArray(value) && value.length > 0) {
        const clustersToSet = value.map((clusterName) => {
          return { name: clusterName };
        });

        this.setFieldIfNotEmpty('spec.placement.clusters', clustersToSet);
      } else {
        this.emptySpecParentField('placement', 'clusters');
      }
      this.clusterNames = value || [];
    },
    emptySpecParentField(parentFieldName, fieldName) {
      this.setField(`spec.${ parentFieldName }.${ fieldName }`, undefined);

      const parent = this.getField(`spec.${ parentFieldName }`);

      this.setFieldIfNotEmpty(`spec.${ parentFieldName }`, parent);
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <form v-else class="tree-tabbed-form">
    <CruResource
      :validation-passed="true"
      :resource="value"
      :mode="mode"
      :errors="errors"
      :done-route="doneRoute"
      :apply-hooks="applyHooks"
      @finish="save"
      @error="e=>errors = e"
    >
      <div class="row">
        <div class="col span-12">
          <NameNsDescription
            :value="value"
            :extra-columns="[]"
            :mode="mode"
            description-key="metadata.annotations.description"
            @change="name=value.metadata.name"
          />
        </div>
      </div>
      <TreeTabbed>
        <template #nestedTabs>
          <LabelsTab
            :value="getField('metadata')"
            :mode="mode"
            tab-name="labels"
            :tab-label="t('verrazzano.common.tabs.metadata')"
            @input="setFieldIfNotEmpty('metadata', $event)"
          />
          <TreeTab name="general" :label="t('verrazzano.common.tabs.general')">
            <template #default>
              <div class="row">
                <div class="col span-6">
                  <LabeledSelect
                    :value="clusterNames"
                    :mode="mode"
                    :multiple="true"
                    :options="clusters"
                    option-label="name"
                    :reduce="cluster => cluster.name"
                    :placeholder="getNotSetPlaceholder(value, 'clusterNames')"
                    :label="t('verrazzano.common.fields.placement')"
                    @input="setPlacementClusters($event)"
                  />
                </div>
              </div>
            </template>
          </TreeTab>
          <NamespacesTab
            :value="getListField('spec.template.namespaces')"
            :mode="mode"
            tab-name="namespaces"
            @input="setFieldIfNotEmpty('spec.template.namespaces', $event)"
            @delete="emptySpecParentField('template', 'namespaces')"
          />
          <TreeTab name="security" :label="t('verrazzano.common.tabs.security')">
            <template #beside-header>
              <TabDeleteButton
                :element-name="t('verrazzano.common.tabs.security')"
                :mode="mode"
                @click="emptySpecParentField('template', 'security')"
              />
            </template>
            <template #nestedTabs>
              <SubjectsTab
                :value="getListField('spec.template.security.projectAdminSubjects')"
                :mode="mode"
                :tab-name="createTabName('security', 'admins')"
                :tab-label="t('verrazzano.common.tabs.projectAdminSubjects')"
                @input="setFieldIfNotEmpty('spec.template.security.projectAdminSubjects', $event)"
                @delete="emptySpecParentField('template.security', 'projectAdminSubjects')"
              />
              <SubjectsTab
                :value="getListField('spec.template.security.projectMonitorSubjects')"
                :mode="mode"
                :tab-name="createTabName('security', 'monitors')"
                :tab-label="t('verrazzano.common.tabs.projectMonitorSubjects')"
                @input="setFieldIfNotEmpty('spec.template.security.projectMonitorSubjects', $event)"
                @delete="emptySpecParentField('template.security', 'projectMonitorSubjects')"
              />
            </template>
          </TreeTab>
          <NetworkPoliciesTab
            :value="getListField('spec.template.networkPolicies')"
            :mode="mode"
            tab-name="networkPolicies"
            @input="setFieldIfNotEmpty('spec.template.networkPolicies', $event)"
            @delete="emptySpecParentField('template', 'networkPolicies')"
          />
        </template>
      </TreeTabbed>
    </CruResource>
  </form>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>
