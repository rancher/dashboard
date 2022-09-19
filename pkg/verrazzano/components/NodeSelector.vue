<script>
// Added by Verrazzano
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import NodeSelectorTerm from '@pkg/components/NodeSelectorTerm';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { randomStr } from '@shell/utils/string';
import debounce from 'lodash/debounce';

export default {
  name:       'NodeSelector',
  components: {
    ArrayListGrouped,
    NodeSelectorTerm,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    }
  },
  data() {
    const nodeSelectorTerms = (this.value.nodeSelectorTerms || []).map((term) => {
      const newTerm = this.clone(term);

      newTerm._id = randomStr(4);

      return newTerm;
    });

    return { nodeSelectorTerms };
  },
  computed: {
    showNodeSelectorTermRemove() {
      return !this.isView && this.nodeSelectorTerms.length > 0;
    },
  },
  methods: {
    update() {
      const nodeSelectorTerms = [];

      this.nodeSelectorTerms.forEach((term) => {
        const newTerm = this.clone(term);

        delete newTerm._id;

        nodeSelectorTerms.push(newTerm);
      });

      this.setFieldIfNotEmpty('nodeSelectorTerms', nodeSelectorTerms);
    },
    addNodeSelectorTerm() {
      this.nodeSelectorTerms.push({ _id: randomStr(4) });
    },
    removeNodeSelectorTerm(index) {
      this.nodeSelectorTerms.splice(index, 1);

      this.queueUpdate();
    },
  },
  created() {
    this.queueUpdate = debounce(this.update, 500);
  }
};
</script>

<template>
  <div>
    <ArrayListGrouped
      v-model="nodeSelectorTerms"
      :mode="mode"
      :default-add-value="{ }"
      :add-label="t('verrazzano.common.buttons.addNodeSelectorTerm')"
      @add="addNodeSelectorTerm()"
    >
      <template #remove-button="removeProps">
        <button
          v-if="showNodeSelectorTermRemove"
          type="button"
          class="btn role-link close btn-sm"
          @click="removeNodeSelectorTerm(removeProps.i)"
        >
          <i class="icon icon-2x icon-x" />
        </button>
        <span v-else />
      </template>
      <template #default="props">
        <div class="spacer-small" />
        <NodeSelectorTerm
          v-model="props.row.value"
          :mode="mode"
        />
      </template>
    </ArrayListGrouped>
  </div>
</template>

<style scoped>

</style>
