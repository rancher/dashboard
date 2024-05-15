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
import { SECRET } from '@shell/config/types';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { TYPES } from '@shell/models/secret';
import { LABEL_SELECT_KINDS } from '@shell/types/components/labeledSelect';
import paginationUtils from '@shell/utils/pagination-utils';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import { labelSelectPaginationFunction } from '@shell/components/form/LabeledSelect/labeled-select.utils';

const NONE = '__[[NONE]]__';

export default {
  components: { LabeledSelect },

  async fetch() {
    if (!paginationUtils.isSteveCacheEnabled({ rootGetters: this.$store.getters })) {
      // Make sure secrets are in the store so that the secret
      // selectors in the receiver config forms will have secrets
      // to choose from.
      // TODO: RC test
      const allSecrets = await this.$store.dispatch('cluster/findAll', { type: SECRET });

      const allSecretsInNamespace = allSecrets.filter((secret) => this.types.includes(secret._type) && secret.namespace === this.namespace);

      this.secrets = allSecretsInNamespace;
    }
  },

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
      secrets: [],
      name:    props.initialName,
      key:     props.initialKey,
      none:    NONE,
      page:    null,
    };
  },

  computed: {
    secretNames() {
      return this.mapSecrets(this.secrets.sort((a, b) => a.name.localeCompare(b.name)));
    },

    keys() {
      const secret = (this.page || this.secrets).find((secret) => secret.name === this.name) || {};

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
     * @param [PaginateFnOptions] opts
     * @returns PaginateFnResponse
     */
    async paginateSecrets(opts) {
      const { filter } = opts;
      const filters = !!filter ? [PaginationParamFilter.createSingleField({ field: 'metadata.name', value: filter })] : [];

      filters.push(
        PaginationParamFilter.createSingleField({ field: 'metadata.namespace', value: this.namespace }),
        PaginationParamFilter.createSingleField({ field: 'metadata.fields.1', value: this.types.join(',') })
      );

      const {
        page,
        ...rest
      } = await labelSelectPaginationFunction({
        opts,
        filters,
        groupByNamespace: false,
        type:             SECRET,
        ctx:              { getters: this.$store.getters, dispatch: this.$store.dispatch },
        classify:         true,
        sort:             [{ asc: true, field: 'metadata.name' }],
      });

      this.page = page;

      return {
        ...rest,
        page: this.mapSecrets(this.page)
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
      <LabeledSelect
        v-model="name"
        class="col span-6"
        :disabled="!isView && disabled"
        :options="secretNames"
        :paginate="paginateSecrets"
        :label="secretNameLabel"
        :mode="mode"
        @selecting="updateSecretName"
      />
      <LabeledSelect
        v-model="key"
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
