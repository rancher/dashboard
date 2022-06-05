<script>
import { _EDIT } from '@shell/config/query-params';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  name: 'HarvesterSupportBundleImage',

  components: { LabeledInput, LabeledSelect },

  props: {
    registerBeforeHook: {
      type:     Function,
      required: true,
    },

    mode: {
      type:    String,
      default: _EDIT,
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      },
    },
  },

  data() {
    let parseDefaultValue = {};

    try {
      parseDefaultValue = JSON.parse(this.value.value);
    } catch (error) {
      parseDefaultValue = JSON.parse(this.value.default);
    }

    return { parseDefaultValue };
  },

  created() {
    this.update();
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.willSave, 'willSave');
    }
  },

  computed: {
    imagePolicyOptions() {
      return [{
        label: this.t('generic.imagePullPolicy.always'),
        value: 'Always',
      }, {
        label: this.t('generic.imagePullPolicy.ifNotPresent'),
        value: 'IfNotPresent',
      }, {
        label: this.t('generic.imagePullPolicy.never'),
        value: 'Never'
      }];
    }
  },

  methods: {
    update() {
      const value = JSON.stringify(this.parseDefaultValue);

      this.$set(this.value, 'value', value);
    },

    willSave() {
      const errors = [];

      if (!this.parseDefaultValue.repository) {
        errors.push(this.t('validation.required', { key: this.t('harvester.setting.supportBundleImage.repo') }, true));
      }

      if (!this.parseDefaultValue.tag) {
        errors.push(this.t('validation.required', { key: this.t('harvester.setting.supportBundleImage.tag') }, true));
      }

      if (errors.length > 0) {
        return Promise.reject(errors);
      } else {
        return Promise.resolve();
      }
    },
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
  <div class="row" @input="update">
    <div class="col span-12">
      <template>
        <LabeledInput
          v-model="parseDefaultValue.repository"
          class="mb-20"
          :mode="mode"
          required
          label-key="harvester.setting.supportBundleImage.repo"
        />

        <LabeledInput
          v-model="parseDefaultValue.tag"
          class="mb-20"
          :mode="mode"
          required
          label-key="harvester.setting.supportBundleImage.tag"
        />

        <LabeledSelect
          v-model="parseDefaultValue.imagePullPolicy"
          class="mb-20"
          required
          label-key="harvester.setting.supportBundleImage.imagePullPolicy"
          :options="imagePolicyOptions"
          @input="update"
        />
      </template>
    </div>
  </div>
</template>
