<script>
import { mapGetters } from 'vuex';
import { get, set } from '@shell/utils/object';
import { sortBy } from '@shell/utils/sort';
import { NAMESPACE } from '@shell/config/types';
import { DESCRIPTION } from '@shell/config/labels-annotations';
import { _VIEW, _EDIT } from '@shell/config/query-params';
import LabeledInput from '@shell/components/form/LabeledInput';
import InputWithSelect from '@shell/components/form/InputWithSelect';

export function normalizeName(str) {
  return (str || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export default {
  components: { LabeledInput, InputWithSelect },

  props: {
    value: {
      type:     Object,
      required: true,
    },
    mode: {
      type:     String,
      required: true,
    },
    nameNsHidden: {
      type:    Boolean,
      default: false,
    },
    descriptionHidden: {
      type:    Boolean,
      default: false,
    },
    extraColumns: {
      type:    Array,
      default: () => [],
    },

    nameLabel: {
      type:    String,
      default: 'nameNsDescription.name.label',
    },
    nameEditable: {
      type:    Boolean,
      default: false,
    },
    namePlaceholder: {
      type:    String,
      default: 'nameNsDescription.name.placeholder',
    },
    nameDisabled: {
      type:    Boolean,
      default: false,
    },
    nameRequired: {
      type:    Boolean,
      default: true,
    },
    nameNormalized: {
      type:    Boolean,
      default: true,
    },
    namespaced: {
      type:    Boolean,
      default: true,
    },
    namespaceType: {
      type:    String,
      default: NAMESPACE,
    },
    namespaceLabel: {
      type:    String,
      default: 'nameNsDescription.namespace.label',
    },
    namespacePlaceholder: {
      type:    String,
      default: 'nameNsDescription.namespace.placeholder',
    },
    namespaceDisabled: {
      type:    Boolean,
      default: false,
    },
    namespaceNewAllowed: {
      type:    Boolean,
      default: false,
    },

    descriptionLabel: {
      type:    String,
      default: 'nameNsDescription.description.label',
    },
    descriptionPlaceholder: {
      type:    String,
      default: 'nameNsDescription.description.placeholder',
    },

    // Use specific fields on the value instead of the normal metadata locations
    nameKey: {
      type:    String,
      default: null,
    },
    namespaceKey: {
      type:    String,
      default: null,
    },
    descriptionKey: {
      type:    String,
      default: null,
    },
    forceNamespace: {
      type:    String,
      default: null,
    },
    showSpacer: {
      type:    Boolean,
      default: true
    },
    horizontal: {
      type:    Boolean,
      default: true,
    }
  },

  data() {
    const v = this.value;
    const metadata = v.metadata;
    let namespace, name, description;

    if (this.nameKey) {
      name = get(v, this.nameKey);
    } else {
      name = metadata.name;
    }

    if (this.namespaced) {
      if (this.forceNamespace) {
        namespace = this.forceNamespace;
        this.updateNamespace(namespace);
      } else if (this.namespaceKey) {
        namespace = get(v, this.namespaceKey);
      } else {
        namespace = metadata?.namespace;
      }

      if (!namespace) {
        namespace = this.$store.getters['defaultNamespace'];
        if (metadata) {
          metadata.namespace = namespace;
        }
      }
    }

    if (this.descriptionKey) {
      description = get(v, this.descriptionKey);
    } else {
      description = metadata?.annotations?.[DESCRIPTION];
    }

    return {
      namespace,
      name,
      description,
    };
  },

  computed: {
    ...mapGetters(['isVirtualCluster']),
    namespaceReallyDisabled() {
      return (
        !!this.forceNamespace || this.namespaceDisabled || this.mode === _EDIT
      ); // namespace is never editable
    },

    nameReallyDisabled() {
      return this.nameDisabled || (this.mode === _EDIT && !this.nameEditable);
    },

    namespaces() {
      const inStore = this.$store.getters['currentStore'](this.namespaceType);
      const choices = this.$store.getters[`${ inStore }/all`](this.namespaceType);

      const out = sortBy(
        choices.filter( (N) => {
          const isSettingSystemNamespace = this.$store.getters['systemNamespaces'].includes(N.metadata.name);

          return this.isVirtualCluster ? !N.isSystem && !N.isFleetManaged && !isSettingSystemNamespace : true;
        }).map((obj) => {
          return {
            label: obj.nameDisplay,
            value: obj.id,
          };
        }),
        'label'
      );

      if (this.forceNamespace) {
        out.unshift({
          label: this.forceNamespace,
          value: this.forceNamespace,
        });
      }

      return out;
    },

    isView() {
      return this.mode === _VIEW;
    },

    colSpan() {
      if (!this.horizontal) {
        return `span-8`;
      }

      let cols = (this.nameNsHidden ? 0 : 1) + (this.descriptionHidden ? 0 : 1) + this.extraColumns.length;

      cols = Math.max(2, cols); // If there's only one column, make it render half-width as if there were two

      const span = 12 / cols; // If there's 5, 7, or more columns this will break; don't do that.

      return `span-${ span }`;
    },
  },

  watch: {
    name(val) {
      if ( this.normalizeName ) {
        val = normalizeName(val);
      }

      if (this.nameKey) {
        set(this.value, this.nameKey, val);
      } else {
        this.$set(this.value.metadata, 'name', val);
      }
      this.$emit('change');
    },

    namespace(val) {
      this.updateNamespace(val);
      this.$emit('change');
    },

    description(val) {
      if (this.descriptionKey) {
        set(this.value, this.descriptionKey, val);
      } else {
        this.value.setAnnotation(DESCRIPTION, val);
      }
      this.$emit('change');
    },
  },

  mounted() {
    this.$nextTick(() => {
      if (this.$refs.name) {
        this.$refs.name.focus();
      }
    });
  },

  methods: {
    updateNamespace(val) {
      if (this.forceNamespace) {
        val = this.forceNamespace;
      }

      if (this.namespaced) {
        this.$emit('isNamespaceNew', this.namespaces && !this.namespaces.find(n => n.value === val));
      }

      if (this.namespaceKey) {
        set(this.value, this.namespaceKey, val);
      } else {
        this.value.metadata.namespace = val;
      }
    },

    changeNameAndNamespace(e) {
      this.name = (e.text || '').toLowerCase();
      this.namespace = e.selected;
    },
  },
};
</script>

<template>
  <div>
    <div class="name-ns-description" :class="{'flip-direction': !horizontal, row: true}">
      <div v-show="!nameNsHidden" :class="{ col: true, [colSpan]: true }">
        <slot :namespaces="namespaces" name="namespace">
          <InputWithSelect
            v-if="namespaced"
            ref="name"
            class="namespace-select"
            :mode="mode"
            :disabled="namespaceReallyDisabled"
            :text-label="t(nameLabel)"
            :text-placeholder="t(namePlaceholder)"
            :text-value="name"
            :text-required="nameRequired"
            :select-label="t(namespaceLabel)"
            :select-placeholder="t(namespacePlaceholder)"
            :select-value="namespace"
            :options="namespaces"
            :searchable="true"
            :taggable="namespaceNewAllowed"
            @input="changeNameAndNamespace($event)"
          />
          <LabeledInput
            v-else
            ref="name"
            key="name"
            v-model="name"
            :label="t(nameLabel)"
            :placeholder="t(namePlaceholder)"
            :disabled="nameReallyDisabled"
            :mode="mode"
            :min-height="30"
            :required="nameRequired"
          />
        </slot>
      </div>
      <div v-show="!descriptionHidden" :class="{ col: true, [colSpan]: true }">
        <LabeledInput
          key="description"
          v-model="description"
          :mode="mode"
          :label="t(descriptionLabel)"
          :placeholder="t(descriptionPlaceholder)"
          :min-height="30"
        />
      </div>
      <div
        v-for="slot in extraColumns"
        :key="slot"
        :class="{ col: true, [colSpan]: true }"
      >
        <slot :name="slot">
        </slot>
      </div>
    </div>
    <div v-if="showSpacer" class="spacer"></div>
  </div>
</template>

<style lang="scss" scoped>
.row {
  &.name-ns-description {
    max-height: $input-height;
  }
  .namespace-select ::v-deep {
    .labeled-select {
      min-width: 40%;
      .v-select.inline {
        &.vs--single {
          padding-bottom: 2px;
        }
      }
    }
  }

  &.flip-direction {
    flex-direction: column;

    &.name-ns-description {
      max-height: initial;
    }

    & > div > * {
      margin-bottom: 20px;
    }
  }
}
</style>
