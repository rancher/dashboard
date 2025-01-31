<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ResourceLabeledSelect from '@shell/components/form/ResourceLabeledSelect';
import { SECRET } from '@shell/config/types';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { SECRET_TYPES as TYPES } from '@shell/config/secret';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import { LABEL_SELECT_KINDS } from '@shell/types/components/labeledSelect';

const NONE = '__[[NONE]]__';

export default {
  emits:      ['update:value'],
  components: { LabeledSelect, ResourceLabeledSelect },

  props: {
    value: {
      type:     [String, Object],
      required: false,
      default:  undefined
    },
    namespace: {
      type:     String,
      required: true
    },
    types: {
      type:    Array,
      default: () => Object.values(TYPES)
    },
    disabled: {
      type:    Boolean,
      default: false
    },
    mountKey: {
      type:    String,
      default: 'valueFrom'
    },
    nameKey: {
      type:    String,
      default: 'name'
    },
    keyKey: {
      type:    String,
      default: 'key'
    },
    showKeySelector: {
      type:    Boolean,
      default: false
    },
    secretNameLabel: {
      type:    String,
      default: 'Secret Name'
    },
    keyNameLabel: {
      type:    String,
      default: 'Key'
    },
    mode: {
      type:    String,
      default: _EDIT
    },
    inStore: {
      type:    String,
      default: 'cluster',
    }
  },

  data() {
    return {
      secrets:            null,
      SECRET,
      allSecretsSettings: {
        updateResources: (secrets) => {
          const allSecretsInNamespace = secrets.filter((secret) => this.types.includes(secret._type) && secret.namespace === this.namespace);
          const mappedSecrets = this.mapSecrets(allSecretsInNamespace.sort((a, b) => a.name.localeCompare(b.name)));

          this.secrets = allSecretsInNamespace; // We need the key from the selected secret

          return mappedSecrets;
        }
      },
      paginateSecretsSetting: {
        requestSettings: this.paginatePageOptions,
        updateResources: (secrets) => {
          const mappedSecrets = this.mapSecrets(secrets);

          this.secrets = secrets; // We need the key from the selected secret. When paginating we won't touch the store, so just pass back here

          return mappedSecrets;
        }
      }
    };
  },

  computed: {
    name: {
      get() {
        const name = this.showKeySelector ? this.value?.[this.mountKey]?.secretKeyRef?.[this.nameKey] : this.value;

        return name || NONE;
      },
      set(name) {
        const isNone = name === NONE;
        const correctedName = isNone ? undefined : name;

        if (this.showKeySelector) {
          this.$emit('update:value', { [this.mountKey]: { secretKeyRef: { [this.nameKey]: correctedName, [this.keyKey]: '' } } });
        } else {
          this.$emit('update:value', correctedName);
        }
      }
    },

    key: {
      get() {
        return this.value?.[this.mountKey]?.secretKeyRef?.[this.keyKey] || '';
      },
      set(key) {
        this.$emit('update:value', { [this.mountKey]: { secretKeyRef: { [this.nameKey]: this.name, [this.keyKey]: key } } });
      }
    },

    keys() {
      const secret = (this.secrets || []).find((secret) => secret.name === this.name) || {};

      return Object.keys(secret.data || {}).map((key) => ({
        label: key,
        value: key
      }));
    },

    isView() {
      return this.mode === _VIEW;
    },

    isKeyDisabled() {
      return !this.isView && (!this.name || this.name === NONE || this.disabled);
    }
  },

  methods: {
    /**
     * Provide a set of options for the LabelSelect ([none, ...{label, value}])
     */
    mapSecrets(secrets) {
      const mappedSecrets = secrets
        .reduce((res, s) => {
          if (s.kind === LABEL_SELECT_KINDS.NONE) {
            return res;
          }

          if (s.id) {
            res.push({ label: s.name, value: s.name });
          } else {
            res.push(s);
          }

          return res;
        }, []);

      return [
        {
          label: 'None', value: NONE, kind: LABEL_SELECT_KINDS.NONE
        },
        ...mappedSecrets
      ];
    },

    /**
     * @param [LabelSelectPaginationFunctionOptions] opts
     * @returns LabelSelectPaginationFunctionOptions
     */
    paginatePageOptions(opts) {
      const { opts: { filter } } = opts;

      const filters = !!filter ? [PaginationParamFilter.createSingleField({ field: 'metadata.name', value: filter })] : [];

      filters.push(
        PaginationParamFilter.createSingleField({ field: 'metadata.namespace', value: this.namespace }),
        PaginationParamFilter.createSingleField({ field: 'metadata.fields.1', value: this.types.join(',') })
      );

      return {
        ...opts,
        filters,
        groupByNamespace: false,
        classify:         true,
        sort:             [{ asc: true, field: 'metadata.name' }],
      };
    },
  }

};
</script>

<template>
  <div
    class="secret-selector"
    :class="{'show-key-selector': showKeySelector}"
  >
    <div class="input-container">
      <!-- key by namespace to ensure label select current page is recreated on ns change -->
      <ResourceLabeledSelect
        v-model:value="name"
        :disabled="!isView && disabled"
        :label="secretNameLabel"
        :mode="mode"
        :resource-type="SECRET"
        :in-store="inStore"
        :paginated-resource-settings="paginateSecretsSetting"
        :all-resources-settings="allSecretsSettings"
      />
      <LabeledSelect
        v-if="showKeySelector"
        v-model:value="key"
        class="col span-6"
        :disabled="isKeyDisabled"
        :options="keys"
        :label="keyNameLabel"
        :mode="mode"
      />
    </div>
  </div>
</template>

<style lang="scss">
.secret-selector {
  width: 100%;
  label {
    display: block;
  }

  & .labeled-select {
    min-height: $input-height;
  }

  & .vs__selected-options {
    padding: 8px 0 7px 0;
  }

  & label {
    display: inline-block;
  }

  &.show-key-selector {
    .input-container > * {
      display: inline-block;
      width: 50%;

      &.labeled-select.focused {
        z-index: 10;
      }

      &:first-child {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        margin-right: 0;
      }

      &:last-child {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        border-left: none;
        float: right;
      }
    }
  }
}
</style>
