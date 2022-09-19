<script>
// Added by Verrazzano
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import KeyValue from '@shell/components/form/KeyValue';
import PodMatchExpression from '@pkg/components/PodMatchExpression';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import debounce from 'lodash/debounce';
import { randomStr } from '@shell/utils/string';

export default {
  name:       'PodAffinityTerm',
  components: {
    ArrayListGrouped,
    KeyValue,
    PodMatchExpression
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
    },
    showMatchExpressionsTitle: {
      type:    Boolean,
      default: true
    },
    matchExpressionsTitle: {
      type:    String,
      default: null,
    },
    showMatchLabelsTitle: {
      type:    Boolean,
      default: true
    },
    matchLabelsTitle: {
      type:    String,
      default: null,
    },
  },
  data() {
    const { matchExpressions = [], matchLabels = {} } = this.value || {};

    matchExpressions.map((matchExpression) => {
      matchExpression._id = randomStr(4);

      return matchExpression;
    });

    return {
      matchExpressions,
      matchLabels,
      matchExprTitle: '',
      matchLblsTitle: '',
    };
  },
  computed: {
    showMatchExpressionRemoveButton() {
      return !this.isView && this.matchExpressions.length > 0;
    },

  },
  methods: {
    update() {
      const matchExpressions = [];
      const matchLabels = {};

      this.matchExpressions.forEach((matchExpression) => {
        const localExp = this.clone(matchExpression);

        delete localExp._id;

        matchExpressions.push(localExp);
      });
      Object.assign(matchLabels, this.matchLabels);

      this.setFieldIfNotEmpty('matchExpressions', matchExpressions);
      this.setFieldIfNotEmpty('matchLabels', matchLabels);
    },
    addMatchExpression() {
      this.matchExpressions.push({ _id: randomStr(4) });
      this.queueUpdate();
    },
    updateMatchExpression(neu) {
      this.$nextTick(() => {
        const existingRow = this.matchExpressions.find(row => row._id === neu._id);

        if (existingRow) {
          Object.assign(existingRow, neu);
        } else {
          this.matchExpressions.push(neu);
        }
        this.queueUpdate();
      });
    },
    removeMatchExpression(index) {
      this.matchExpressions.splice(index, 1);
      this.queueUpdate();
    },
  },
  created() {
    if (this.matchExpressionsTitle) {
      this.matchExprTitle = this.matchExpressionsTitle;
    } else {
      this.matchExprTitle = this.t('verrazzano.common.titles.podAffinityTerm.matchExpressions');
    }

    if (this.matchLabelsTitle) {
      this.matchLblsTitle = this.matchLabelsTitle;
    } else {
      this.matchLblsTitle = this.t('verrazzano.common.titles.podAffinityTerm.matchLabels');
    }
    this.queueUpdate = debounce(this.update, 500);
  }
};
</script>

<template>
  <div>
    <div>
      <h3 v-if="showMatchExpressionsTitle">
        {{ matchExprTitle }}
      </h3>
      <span v-else />
      <ArrayListGrouped
        v-model="matchExpressions"
        :mode="mode"
        :default-add-value="{ }"
        :add-label="t('verrazzano.common.buttons.addMatchExpression')"
        @add="addMatchExpression()"
      >
        <template #remove-button="removeProps">
          <button
            v-if="showMatchExpressionRemoveButton"
            type="button"
            class="btn role-link close btn-sm"
            @click="removeMatchExpression(removeProps.i)"
          >
            <i class="icon icon-2x icon-x" />
          </button>
          <span v-else />
        </template>
        <template #default="props">
          <div class="spacer-small" />
          <div>
            <PodMatchExpression
              v-model="props.row.value"
              :mode="mode"
              @input="updateMatchExpression($event)"
            />
          </div>
        </template>
      </ArrayListGrouped>
    </div>
    <div class="spacer" />
    <div class="">
      <h3 v-if="showMatchLabelsTitle">
        {{ matchLblsTitle }}
      </h3>
      <span v-else />
      <KeyValue
        v-model="matchLabels"
        :mode="mode"
        :read-allowed="false"
        :add-label="t('verrazzano.common.buttons.addMatchLabel')"
        @input="queueUpdate"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
