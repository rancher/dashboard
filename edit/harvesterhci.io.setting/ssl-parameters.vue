<script>
import LabeledInput from '@/components/form/LabeledInput';
import { _EDIT } from '@/config/query-params';
import LabeledSelect from '@/components/form/LabeledSelect';

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
        label: 'SSLv3',
        value: 'SSLv3',
      }, {
        label: 'SSLv2',
        value: 'SSLv2',
      }, {
        label: 'TLSv1.2',
        value: 'TLSv1.2',
      }, {
        label: `TLSv1.1(${ this.t('generic.deprecated') })`,
        value: 'TLSv1.1',
      }, {
        label: `TLSv1(${ this.t('generic.deprecated') })`,
        value: 'TLSv1',
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

      const regex = /^(:?[A-Z0-9]+(?:-[A-Z0-9]+)+)+$/gm;
      const ciphers = this.parsedDefaultValue.ciphers;

      if (ciphers && !ciphers.match(regex)) {
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
