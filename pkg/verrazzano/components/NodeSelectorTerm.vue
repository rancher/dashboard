<script>
// Added by Verrazzano
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import NodeSelectorRequirement from '@pkg/components/NodeSelectorRequirement';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import debounce from 'lodash/debounce';
import { randomStr } from '@shell/utils/string';

export default {
  name:       'NodeSelectorTerm',
  components: {
    ArrayListGrouped,
    LabeledSelect,
    NodeSelectorRequirement
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
    let { matchExpressions = [], matchFields = [] } = this.value || {};

    matchExpressions = matchExpressions.map((nodeSelector) => {
      const neu = this.clone(nodeSelector);

      neu._id = randomStr(4);
      neu.type = 'matchExpressions';

      return neu;
    });
    matchFields = matchFields.map((nodeSelector) => {
      const neu = this.clone(nodeSelector);

      neu._id = randomStr(4);
      neu.type = 'matchFields';

      return neu;
    });

    const allTermTypes = [...matchExpressions, ...matchFields];

    return { allTermTypes };
  },
  computed: {
    typeOptions() {
      return [
        {
          value: 'matchExpressions',
          label: this.t('verrazzano.common.types.nodeSelectorTerm.matchExpression')
        },
        {
          value: 'matchFields',
          label: this.t('verrazzano.common.types.nodeSelectorTerm.matchField')
        },
      ];
    },
    showNodeSelectorRequirementRemove() {
      return !this.isView && this.allTermTypes.length > 0;
    },
  },
  methods: {
    newId() {
      return randomStr(4);
    },
    update() {
      const matchExpressions = [];
      const matchFields = [];

      this.allTermTypes.forEach((termType) => {
        const type = termType.type;
        const match = { ...termType };

        delete match.type;
        delete match._id;

        if (type === 'matchExpressions') {
          matchExpressions.push(match);
        } else {
          matchFields.push(match);
        }
      });
      this.setField('matchExpressions', matchExpressions);
      this.setField('matchFields', matchFields);
    },
    updateNodeSelectorRequirement(neu) {
      this.$nextTick(() => {
        const existingRow = this.allTermTypes.find(row => row._id === neu._id);

        if (existingRow) {
          Object.assign(existingRow, neu);
        } else {
          this.allTermTypes.push(neu);
        }
        this.queueUpdate();
      });
    },
    removeNodeSelectorRequirement(index) {
      this.allTermTypes.splice(index, 1);
      this.queueUpdate();
    },
    addNodeSelectorRequirement() {
      this.allTermTypes.push({
        _id:  this.newId(),
        type: 'matchExpressions'
      });
      this.queueUpdate();
    }
  },
  created() {
    this.queueUpdate = debounce(this.update, 500);
  }
};
</script>

<template>
  <div>
    <ArrayListGrouped
      v-model="allTermTypes"
      :mode="mode"
      :default-add-value="{ }"
      :add-label="t('verrazzano.common.buttons.addNodeSelectorRequirement')"
      @add="addNodeSelectorRequirement()"
    >
      <template #remove-button="removeProps">
        <button
          v-if="showNodeSelectorRequirementRemove"
          type="button"
          class="btn role-link close btn-sm"
          @click="removeNodeSelectorRequirement(removeProps.i)"
        >
          <i class="icon icon-2x icon-x" />
        </button>
        <span v-else />
      </template>
      <template #default="props">
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model="props.row.value.type"
              :label="t('verrazzano.common.fields.nodeSelectorRequirementType')"
              :mode="mode"
              required
              :options="typeOptions"
              option-key="value"
              option-label="label"
            />
          </div>
        </div>
        <NodeSelectorRequirement
          v-model="props.row.value"
          :mode="mode"
          @input="updateNodeSelectorRequirement($event)"
        />
      </template>
    </ArrayListGrouped>
  </div>
</template>

<style scoped>

</style>
