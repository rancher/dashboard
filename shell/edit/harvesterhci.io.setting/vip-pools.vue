<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/Select';
import ArrayList from '@shell/components/form/ArrayList';
import { NAMESPACE } from '@shell/config/types';
import { _EDIT } from '@shell/config/query-params';
import { uniq } from '@shell/utils/array';

const OPTION_GLOBAL = 'global';

export default {
  name: 'HarvesterEditVip',

  components: {
    LabeledInput,
    LabeledSelect,
    ArrayList,
  },

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
    let parsedDefaultValue = {};

    try {
      parsedDefaultValue = JSON.parse(this.value.value);
    } catch (error) {
      parsedDefaultValue = JSON.parse(this.value.default || '{}');
    }

    const vips = Object.keys(parsedDefaultValue).map((key) => {
      return {
        key,
        value: parsedDefaultValue[key],
      };
    }) || [];

    return {
      errors:          [],
      vips,
      defaultAddValue: {
        key:   '',
        value: '',
      },
    };
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.willSave, 'willSave');
    }
  },

  computed: {
    namespaces() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const namespaces = this.$store.getters[`${ inStore }/all`](NAMESPACE);

      const global = {
        label: OPTION_GLOBAL,
        value: OPTION_GLOBAL,
      };

      const out = namespaces.filter(o => !o.isSystem && !o.isFleetManaged).map((o) => {
        return {
          label: o.id,
          value: o.id,
        };
      });

      return [global, ...out];
    },

    selectedNamespaces() {
      return this.vips.map(v => v.key) || [];
    },

    filteredNamespaces() {
      return this.namespaces.filter(n => !this.selectedNamespaces.includes(n.value));
    },
  },

  methods: {
    update() {
      const map = {};

      this.vips.map((v) => {
        map[`${ v.key }`] = v.value;
      });

      const value = JSON.stringify(map);

      this.$set(this.value, 'value', value);
    },

    willSave() {
      let errors = [];

      this.vips.map((v) => {
        if (!v.key) {
          errors.push(this.t('validation.required', { key: this.t('harvester.vip.namespace.label') }, true));
        }

        if (!v.value) {
          errors.push(this.t('validation.required', { key: this.t('harvester.vip.cidr.label') }, true));
        } else {
          const isCidr = !!/^(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\/([1-9]|[1-2]\d|3[0-2])$/.test(v.value);

          if (!isCidr) {
            errors.push(this.t('harvester.vip.cidr.invalid', null, true));
          }
        }
      });

      errors = uniq(errors);

      if (errors.length > 0) {
        return Promise.reject(errors);
      } else {
        return Promise.resolve();
      }
    },
  },

  watch: {
    value: {
      handler(value) {
        let parsedDefaultValue = {};

        try {
          parsedDefaultValue = JSON.parse(value.value);
        } catch (error) {
          parsedDefaultValue = JSON.parse(this.value.default || '{}');
        }

        const vips = Object.keys(parsedDefaultValue).map((key) => {
          return {
            key,
            value: parsedDefaultValue[key],
          };
        }) || [];

        this.$set(this, 'vips', vips);
        this.update();
      },
      deep: true,
    }
  }
};
</script>

<template>
  <div
    class="vip-selector"
    :class="{[mode]: true}"
    @input="update"
  >
    <ArrayList
      v-model="vips"
      :show-header="true"
      :default-add-value="defaultAddValue"
      :mode="mode"
      :add-label="t('harvester.vip.add.label')"
      @input="update"
    >
      <template v-slot:column-headers>
        <div class="box">
          <div class="key">
            {{ t('harvester.vip.namespace.label') }}
            <span class="required">*</span>
          </div>
          <div class="value">
            {{ t('harvester.vip.cidr.label') }}
            <span class="required">*</span>
          </div>
          <div />
        </div>
      </template>
      <template v-slot:columns="scope">
        <div class="key">
          <LabeledSelect
            v-model="scope.row.value.key"
            :mode="mode"
            :options="filteredNamespaces"
            @input="update"
          />
        </div>
        <div class="value">
          <LabeledInput
            v-model="scope.row.value.value"
            :mode="mode"
            @input="update"
          />
        </div>
      </template>
    </ArrayList>
  </div>
</template>

<style lang="scss" scoped>
.vip-selector {
  &:not(.view) table {
    table-layout: initial;
  }

  ::v-deep .box {
    display: grid;
    grid-template-columns: 42% 42% 10%;
    column-gap: 1.75%;
    align-items: center;
    margin-bottom: 10px;

    .key,
    .value {
      height: 100%;
    }
  }

  .unlabeled-select {
    height: 100%;
  }

  .required {
    color: var(--error);
  }
}
</style>
