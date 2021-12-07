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

  computed: {
    protocolOptions() {
      return ['SSLv2', 'SSLv3', 'TLSv1', 'TLSv1.1', 'TLSv1.2', 'TLSv1.3'];
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
