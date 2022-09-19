<script>
// Added by Verrazzano
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import ContainerPort from '@pkg/components/ContainersTab/ContainerPortsTab/ContainerPort';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { randomStr } from '@shell/utils/string';
import debounce from 'lodash/debounce';

export default {
  name:       'ContainerPortsTab',
  components: {
    ArrayListGrouped,
    ContainerPort,
    TreeTab,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      // parent object (e.g., container spec)
      type:     Object,
      required: true,
    },
    mode: {
      type:    String,
      default: 'create'
    },
    tabName: {
      type:    String,
      default: ''
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    const ports = (this.value.ports || []).map((port) => {
      const newPort = this.clone(port);

      newPort._id = randomStr(4);

      return newPort;
    });

    return {
      treeTabName:  this.tabName || 'ports',
      treeTabLabel: this.tabLabel,
      ports,
    };
  },
  methods: {
    update() {
      const ports = [];

      this.ports.forEach((port) => {
        const newPort = this.clone(port);

        delete newPort._id;

        ports.push(newPort);
      });

      this.setFieldIfNotEmpty('ports', ports);
    },
    addPort() {
      this.ports.push({ _id: randomStr(4) });
    },
    removePort(index) {
      this.ports.splice(index, 1);
      this.queueUpdate();
    },
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.ports');
    }

    this.queueUpdate = debounce(this.update, 500);
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <ArrayListGrouped
      v-model="ports"
      :mode="mode"
      :default-add-value="{ }"
      :add-label="t('verrazzano.common.buttons.addPort')"
      @add="addPort()"
    >
      <template #remove-button="removeProps">
        <button
          v-if="showListRemoveButton('ports')"
          type="button"
          class="btn role-link close btn-sm"
          @click="removePort(removeProps.i)"
        >
          <i class="icon icon-2x icon-x" />
        </button>
        <span v-else />
      </template>
      <template #default="props">
        <div class="spacer-small" />
        <ContainerPort
          :value="props.row.value"
          :mode="mode"
          @input="queueUpdate"
        />
      </template>
    </ArrayListGrouped>
  </TreeTab>
</template>

<style scoped>

</style>
