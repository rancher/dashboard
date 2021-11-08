<script>
import CreateEditView from '@/mixins/create-edit-view';
import LabeledInput from '@/components/form/LabeledInput';

export default {
  name: 'HarvesterHttpProxy',

  components: { LabeledInput },

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
  }
};
</script>

<template>
  <div class="row" @input="update">
    <div class="col span-12">
      <template>
        <LabeledInput
          v-model="parseDefaultValue.httpProxy"
          class="mb-20"
          :mode="mode"
          label="http-proxy"
        />

        <LabeledInput
          v-model="parseDefaultValue.httpsProxy"
          class="mb-20"
          :mode="mode"
          label="https-proxy"
        />

        <LabeledInput
          v-model="parseDefaultValue.noProxy"
          class="mb-20"
          :mode="mode"
          label="no-proxy"
        />
      </template>
    </div>
  </div>
</template>
