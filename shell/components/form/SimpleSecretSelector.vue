<script>
/**
 * I created this component because the regular secret
 * selector assumes secrets need to be in this format:
 *
 *  valueFrom:
      secretKeyRef:
        name: example-secret-name
        key: example-secret-key

   But for secrets for receivers in AlertmanagerConfigs,
   it needed to be in this format:

   name: example-secret-name
   key: example-secret-key

   FIXME: The solution to above would have been to have a configurable path to set/get name and key from.
   This would have avoided a lot of copy and paste
 */
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ResourceLabeledSelect from '@shell/components/form/ResourceLabeledSelect';
import { SECRET } from '@shell/config/types';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { TYPES } from '@shell/models/secret';
import { LABEL_SELECT_KINDS } from '@shell/types/components/labeledSelect';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';

const NONE = '__[[NONE]]__';

export default {
  emits: ['updateSecretName', 'updateSecretKey'],

  components: { LabeledSelect, ResourceLabeledSelect },

  props: {
    test:        { type: String, default: '' },
    initialName: {
      type:     String,
      required: true
    },
    initialKey: {
      type:     String,
      required: true
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
  },

  data(props) {
    return {
      secrets:            [],
      name:               props.initialName,
      key:                props.initialKey,
      none:               NONE,
      SECRET,
      allSecretsSettings: {
        mapResult: (secrets) => {
          const allSecretsInNamespace = secrets.filter((secret) => this.types.includes(secret._type) && secret.namespace === this.namespace);
          const mappedSecrets = this.mapSecrets(allSecretsInNamespace.sort((a, b) => a.name.localeCompare(b.name)));

          this.secrets = allSecretsInNamespace; // We need the key from the selected secret

          return mappedSecrets;
        }
      },
      paginateSecretsSetting: {
        requestSettings: this.paginatePageOptions,
        mapResult:       (secrets) => {
          const mappedSecrets = this.mapSecrets(secrets);

          this.secrets = secrets; // We need the key from the selected secret. When paginating we won't touch the store, so just pass back here

          return mappedSecrets;
        }
      }
    };
  },

  computed: {
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

    updateSecretName(e) {
      if (e.value === this.none) {
        // The key should appear blank if the secret name is cleared
        this.key = '';
      }
      if (e.value) {
        this.$emit('updateSecretName', e.value);
      }
    },
    updateSecretKey(e) {
      if (e.value) {
        this.$emit('updateSecretKey', e.value);
      }
    }
  }
};
</script>

<template>
  <div class="secret-selector show-key-selector">
    <div class="input-container">
      <ResourceLabeledSelect
        v-model:value="name"
        class="col span-6"
        :disabled="!isView && disabled"
        :loading="$fetchState.pending"
        :label="secretNameLabel"
        :mode="mode"
        :resource-type="SECRET"
        :paginated-resource-settings="paginateSecretsSetting"
        :all-resources-settings="allSecretsSettings"
        @selecting="updateSecretName"
      />
      <LabeledSelect
        v-model:value="key"
        class="col span-6"
        :disabled="isKeyDisabled"
        :options="keys"
        :label="keyNameLabel"
        :mode="mode"
        @selecting="updateSecretKey"
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
