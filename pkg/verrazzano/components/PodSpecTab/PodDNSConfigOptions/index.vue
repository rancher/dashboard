<script>
// Added by Verrazzano
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import PodDNSConfigOption from '@pkg/components/PodSpecTab/PodDNSConfigOptions/PodDNSConfigOption';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { randomStr } from '@shell/utils/string';
import debounce from 'lodash/debounce';

export default {
  name:       'PodDNSConfigOptions',
  components: {
    ArrayListGrouped,
    PodDNSConfigOption,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      // parent object (e.g., pod spec)
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    },
    rootFieldName: {
      type:    String,
      default: 'options'
    },
    addButtonLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    const options = (this.value[this.rootFieldName] || []).map((option) => {
      const newOption = this.clone(option);

      newOption._id = randomStr(4);

      return newOption;
    });

    return {
      addButtonLabelText: this.addButtonLabel,
      options
    };
  },
  methods: {
    update() {
      const options = [];

      this.options.forEach((option) => {
        const newOption = this.clone(option);

        delete newOption._id;

        options.push(newOption);
      });

      this.setFieldIfNotEmpty(this.rootFieldName, options);
    },
    addOption() {
      this.options.push({ _id: randomStr(4) });
    },
    removeOption(index) {
      this.options.splice(index, 1);

      this.queueUpdate();
    }
  },
  created() {
    if (!this.addButtonLabelText) {
      this.addButtonLabelText = this.t('verrazzano.common.buttons.addPodDNSResolverOption');
    }

    this.queueUpdate = debounce(this.update, 500);
  },
};
</script>

<template>
  <div>
    <ArrayListGrouped
      v-model="value[rootFieldName]"
      :mode="mode"
      :default-add-value="{ }"
      :add-label="addButtonLabelText"
      @add="addOption()"
    >
      <template #remove-button="removeProps">
        <button
          v-if="showListRemoveButton(rootFieldName)"
          type="button"
          class="btn role-link close btn-sm"
          @click="removeOption(removeProps.i)"
        >
          <i class="icon icon-2x icon-x" />
        </button>
        <span v-else />
      </template>
      <template #default="props">
        <div class="spacer-small" />
        <PodDNSConfigOption
          v-model="props.row.value"
          :mode="mode"
        />
      </template>
    </ArrayListGrouped>
  </div>
</template>

<style scoped>

</style>
