<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { _EDIT } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  name: 'HarvesterSslParameters',

  components: {
    LabeledInput,
    LabeledSelect,
  },

  props: {
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

    registerBeforeHook: {
      type:     Function,
      required: true,
    },
  },

  data() {
    let parsedDefaultValue = {};

    try {
      parsedDefaultValue = JSON.parse(this.value.value);
    } catch (error) {
      parsedDefaultValue = JSON.parse(this.value.default);
    }

    const protocols = parsedDefaultValue.protocols && (parsedDefaultValue.protocols || '').split(' ');

    return {
      parsedDefaultValue: {
        protocols,
        ciphers: parsedDefaultValue.ciphers,
      },
    };
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.willSave, 'willSave');
    }
  },

  computed: {
    protocolOptions() {
      return [{
        label: 'TLSv1.3',
        value: 'TLSv1.3',
      }, {
        label: 'TLSv1.2',
        value: 'TLSv1.2',
      }, {
        label: `TLSv1.1 (${ this.t('generic.deprecated') })`,
        value: 'TLSv1.1',
      }, {
        label: `TLSv1 (${ this.t('generic.deprecated') })`,
        value: 'TLSv1',
      }, {
        label: `SSLv3 (${ this.t('generic.deprecated') })`,
        value: 'SSLv3',
      }, {
        label: `SSLv2 (${ this.t('generic.deprecated') })`,
        value: 'SSLv2',
      }];
    },
  },

  methods: {
    update() {
      const out = {
        protocols: (this.parsedDefaultValue.protocols || []).join(' '),
        ciphers:   this.parsedDefaultValue.ciphers,
      };

      const value = JSON.stringify(out);

      this.$set(this.value, 'value', value);
    },

    willSave() {
      const errors = [];

      const ciphers = this.parsedDefaultValue.ciphers;
      const protocols = this.parsedDefaultValue.protocols || [];

      if (ciphers && protocols.length === 0) {
        errors.push(this.t('validation.required', { key: this.t('harvester.sslParameters.protocols.label') }, true));
      }

      if (!ciphers && protocols.length > 0) {
        errors.push(this.t('validation.required', { key: this.t('harvester.sslParameters.ciphers.label') }, true));
      }

      const regex = /^(:?[A-Z0-9]+(?:-[A-Z0-9]+)+)+$/gm;

      if (ciphers && (!ciphers.match(regex) || ciphers.startsWith(':'))) {
        errors.push(this.t('validation.invalid', { key: this.t('harvester.sslParameters.ciphers.label') }, true));
      }

      if (errors.length > 0) {
        return Promise.reject(errors);
      } else {
        return Promise.resolve();
      }
    },
  },

  watch: {
    'value.value': {
      handler(value) {
        if (value === this.value.default) {
          this.parsedDefaultValue.protocols = [];
          this.parsedDefaultValue.ciphers = '';
        }
      },
      deep: true,
    },
  }
};
</script>

<template>
  <div>
    <div class="row mt-10">
      <div class="col span-12">
        <LabeledSelect
          v-model="parsedDefaultValue.protocols"
          :mode="mode"
          label-key="harvester.sslParameters.protocols.label"
          :multiple="true"
          :options="protocolOptions"
          @input="update"
        />
      </div>
    </div>
    <div class="row mt-20">
      <div class="col span-12">
        <LabeledInput
          v-model="parsedDefaultValue.ciphers"
          :mode="mode"
          label-key="harvester.sslParameters.ciphers.label"
          @input="update"
        />
      </div>
    </div>
  </div>
</template>
