<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import UnitInput from '@shell/components/form/UnitInput';

export default {
  name: 'HarvesterOvercommitConfig',

  components: { UnitInput },

  mixins: [CreateEditView],

  data() {
    let parseDefaultValue = {};

    try {
      parseDefaultValue = JSON.parse(this.value.value);
    } catch (error) {
      parseDefaultValue = JSON.parse(this.value.default);
    }

    return {
      parseDefaultValue,
      errors: []
    };
  },

  created() {
    this.update();
  },

  methods: {
    update() {
      const value = JSON.stringify(this.parseDefaultValue);

      this.$set(this.value, 'value', value);
    }
  },

  watch: {
    value: {
      handler(neu) {
        const parseDefaultValue = JSON.parse(neu.value);

        this.$set(this, 'parseDefaultValue', parseDefaultValue);
      },
      deep: true
    }
  }
};
</script>

<template>
  <div class="row">
    <div class="col span-12">
      <template>
        <UnitInput
          v-model="parseDefaultValue.cpu"
          v-int-number
          label-key="harvester.generic.cpu"
          suffix="%"
          :delay="0"
          required
          :mode="mode"
          class="mb-20"
          @input="update"
        />

        <UnitInput
          v-model="parseDefaultValue.memory"
          v-int-number
          label-key="harvester.generic.memory"
          suffix="%"
          :delay="0"
          required
          :mode="mode"
          class="mb-20"
          @input="update"
        />

        <UnitInput
          v-model="parseDefaultValue.storage"
          v-int-number
          label-key="harvester.generic.storage"
          suffix="%"
          :delay="0"
          required
          :mode="mode"
          class="mb-20"
          @input="update"
        />
      </template>
    </div>
  </div>
</template>
