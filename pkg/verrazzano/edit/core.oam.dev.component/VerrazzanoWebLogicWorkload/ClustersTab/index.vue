<script>
// Added by Verrazzano
import AddNamedElement from '@pkg/components/AddNamedElement';
import ClusterTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/ClustersTab/ClusterTab';
import DynamicListHelper from '@pkg/mixins/dynamic-list-helper';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import WebLogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'ClustersTab',
  components: {
    AddNamedElement,
    ClusterTab,
    TabDeleteButton,
    TreeTab
  },
  mixins: [WebLogicWorkloadHelper, DynamicListHelper],
  props:  {
    value: {
      type:    Array,
      default: () => ([])
    },
    mode: {
      type:    String,
      default: 'create'
    },
    namespacedObject: {
      type:     Object,
      required: true
    },
    templateObject: {
      type:     Object,
      required: true
    },
    tabName: {
      type:     String,
      required: true
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
    };
  },
  methods: {
    getDynamicListTabName(child) {
      return this.createTabName(this.treeTabName, child?.spec?.clusterName);
    },
    addCluster(name) {
      const newClusterName = `${ this.domainName }-${ name }`;

      const newCluster = {
        apiVersion: this.verrazzanoClusterApiVersion,
        kind:       'Cluster',
        spec:       {
          metadata:    { name: newClusterName, namespace: this.namespace },
          clusterName: name
        }
      };

      this.dynamicListAddChild(newCluster);

      const clusterRefField = 'spec.clusters';
      const clusterRefs = this.get(this.templateObject, clusterRefField) || [];

      clusterRefs.push({ name: newClusterName });

      this.set(this.templateObject, clusterRefField, clusterRefs);
    },
  },
  computed: {
    domainName() {
      return this.get(this.templateObject, 'metadata.name') || '';
    },
    namespace() {
      return this.get(this.templateObject, 'metadata.namespace') || '';
    },
  },
  watch: {
    'templateObject.metadata.namespace'(neu, old) {
      const namespaceField = 'spec.metadata.namespace';

      for (const cluster of this.dynamicListChildren) {
        this.set(cluster, namespaceField, neu);
      }
      this.update();
    },
    'templateObject.metadata.name'(neu, old) {
      function updateDomainPrefix(name) {
        name = name.substring(name.indexOf('-') + 1);
        name = `${ neu }-${ name }`;

        return name;
      }

      const nameField = 'spec.metadata.name';

      for (const cluster of this.dynamicListChildren) {
        let name = this.get(cluster, nameField);

        if (name) {
          name = updateDomainPrefix(name);
          this.set(cluster, nameField, name);
        }
      }

      const clusterRefs = this.get(this.templateObject, 'spec.clusters') || [];

      for (const clusterRef of clusterRefs) {
        let name = clusterRef.name;

        if (name) {
          name = name.substring(name.indexOf('-') + 1);
          clusterRef.name = updateDomainPrefix(name);
        }
      }

      this.update();
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.weblogic.tabs.clusters');
    }
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #beside-header>
      <TabDeleteButton
        :element-name="treeTabLabel"
        :mode="mode"
        @click="dynamicListClearChildrenList"
      />
    </template>
    <template #default>
      <AddNamedElement
        :value="dynamicListChildren"
        :mode="mode"
        key-field-name="template.spec.clusterName"
        :add-type="t('verrazzano.weblogic.tabs.cluster')"
        @input="addCluster($event)"
      />
    </template>
    <template #nestedTabs>
      <ClusterTab
        v-for="(cluster, idx) in dynamicListChildren"
        :key="cluster._id"
        :value="cluster.spec"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :template-object="templateObject"
        :tab-name="getDynamicListTabName(cluster)"
        @input="dynamicListUpdate"
        @delete="dynamicListDeleteChildByIndex(idx)"
      />
    </template>
  </TreeTab>
</template>
