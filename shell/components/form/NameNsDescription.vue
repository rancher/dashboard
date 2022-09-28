<script>
import Vue from 'vue';
import { mapGetters } from 'vuex';
import { get, set } from '@shell/utils/object';
import { sortBy } from '@shell/utils/sort';
import { NAMESPACE } from '@shell/config/types';
import { DESCRIPTION } from '@shell/config/labels-annotations';
import { _VIEW, _EDIT, _CREATE } from '@shell/config/query-params';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

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
  components: {
    LabeledInput,
    LabeledSelect
  },

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
    namespaceFilter: { type: Function, default: null },
    namespaceMapper: { type: Function, default: null },
    namespaceType:   {
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
    noDefaultNamespace: {
      type:    Boolean,
      default: false
    },
    namespacesOverride: {
      type:    Array,
      default: null,
    },
    descriptionLabel: {
      type:    String,
      default: 'nameNsDescription.description.label',
    },
    descriptionPlaceholder: {
      type:    String,
      default: 'nameNsDescription.description.placeholder',
    },
    descriptionDisabled: {
      type:    Boolean,
      default: false,
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
    },
    rules: {
      default: () => ({
        namespace:   [],
        name:        [],
        description: []
      }),
      type: Object,
    },

    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'name-ns-description'
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

      if (!namespace && !this.noDefaultNamespace) {
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

    const inStore = this.$store.getters['currentStore']();
    const nsSchema = this.$store.getters[`${ inStore }/schemaFor`](NAMESPACE);

    return {
      namespace,
      name,
      description,
      createNamespace: false,
      nsSchema
    };
  },

  computed: {
    ...mapGetters(['currentProduct', 'currentCluster']),
    namespaceReallyDisabled() {
      return (
        !!this.forceNamespace || this.namespaceDisabled || this.mode === _EDIT
      ); // namespace is never editable
    },

    nameReallyDisabled() {
      return this.nameDisabled || (this.mode === _EDIT && !this.nameEditable);
    },

    namespaces() {
      const currentStore = this.$store.getters['currentStore'](this.namespaceType);
      const namespaces = this.namespacesOverride || this.$store.getters[`${ currentStore }/all`](this.namespaceType);

      const filtered = namespaces.filter( this.namespaceFilter || ((namespace) => {
        let out;

        if (this.currentProduct?.hideSystemResources) {
          // Filter out the namespace
          // if it is a system namespace or if it is managed by
          // Fleet.
          out = !namespace.isSystem && !namespace.isFleetManaged;
        }

        if (this.mode === _CREATE) {
          out = out && !!namespace.links.update;
        }

        if (out) {
          return out;
        }

        // By default, include the namespace in the dropdown.
        return true;
      }));

      const withLabels = filtered.map(this.namespaceMapper || ((obj) => {
        return {
          label: obj.nameDisplay,
          value: obj.id,
        };
      }));

      const sortedByLabel = sortBy(withLabels, 'label');

      if (this.forceNamespace) {
        sortedByLabel.unshift({
          label: this.forceNamespace,
          value: this.forceNamespace,
        });
      }

      const out = [];

      if (this.canCreateNamespace) {
        out.push({
          label: this.t('namespace.createNamespace'),
          value: ''
        });
      }
      out.push({
        label:    'divider',
        disabled: true,
        kind:     'divider'
      },
      ...sortedByLabel);

      return out;
    },

    isView() {
      return this.mode === _VIEW;
    },

    colSpan() {
      if (!this.horizontal) {
        return `span-8`;
      }
      // Name and namespace take up two columns.
      let cols = (this.nameNsHidden ? 0 : 2) + (this.descriptionHidden ? 0 : 1) + this.extraColumns.length;

      cols = Math.max(2, cols); // If there's only one column, make it render half-width as if there were two
      const span = 12 / cols; // If there's 5, 7, or more columns this will break; don't do that.

      return `span-${ span }`;
    },

    canCreateNamespace() {
      // Check if user can push to namespaces... and as the ns is outside of a project restrict to admins and cluster owners
      return (this.nsSchema?.collectionMethods || []).includes('POST') && this.currentCluster.canUpdate;
    }
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

    selectNamespace(e) {
      if (!e || e.value === '') { // The blank value in the dropdown is labeled "Create a New Namespace"
        this.createNamespace = true;
        this.$parent.$emit('createNamespace', true);
        Vue.nextTick(() => this.$refs.namespace.focus());
      } else {
        this.createNamespace = false;
        this.$parent.$emit('createNamespace', false);
      }
    }
  },
};
</script>

<template>
  <div class="row mb-20">
    <div
      v-if="namespaced && !nameNsHidden && createNamespace"
      :data-testid="componentTestid + '-namespace-create'"
      class="col span-3"
    >
      <LabeledInput
        ref="namespace"
        v-model="namespace"
        :label="t('namespace.label')"
        :placeholder="t('namespace.selectOrCreate')"
        :disabled="namespaceReallyDisabled"
        :mode="mode"
        :min-height="30"
        :required="nameRequired"
        :rules="rules.namespace"
      />
      <button
        aria="Cancel create"
        @click="() => {
          createNamespace = false
          $parent.$emit('createNamespace', false)
        }"
      >
        <i
          v-tooltip="t('generic.cancel')"
          class="icon icon-lg icon-close align-value"
        />
      </button>
    </div>
    <div
      v-if="namespaced && !nameNsHidden && !createNamespace"
      :data-testid="componentTestid + '-namespace'"
      class="col span-3"
    >
      <LabeledSelect
        v-show="!createNamespace"
        v-model="namespace"
        :clearable="true"
        :options="namespaces"
        :disabled="namespaceReallyDisabled"
        :searchable="true"
        :mode="mode"
        :multiple="false"
        :label="t('namespace.label')"
        :placeholder="t('namespace.selectOrCreate')"
        :rules="rules.namespace"
        required
        @selecting="selectNamespace"
      />
    </div>

    <div
      v-if="!nameNsHidden"
      :data-testid="componentTestid + '-name'"
      class="col span-3"
    >
      <LabeledInput
        ref="name"
        key="name"
        v-model="name"
        :label="t(nameLabel)"
        :placeholder="t(namePlaceholder)"
        :disabled="nameReallyDisabled"
        :mode="mode"
        :min-height="30"
        :required="nameRequired"
        :rules="rules.name"
      />
    </div>

    <div
      v-show="!descriptionHidden"
      :data-testid="componentTestid + '-description'"
      :class="['col', extraColumns.length > 0 ? 'span-3' : 'span-6']"
    >
      <LabeledInput
        key="description"
        v-model="description"
        :mode="mode"
        :disabled="descriptionDisabled"
        :label="t(descriptionLabel)"
        :placeholder="t(descriptionPlaceholder)"
        :min-height="30"
        :rules="rules.description"
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
    <div v-if="showSpacer" class="spacer"></div>
  </div>
</template>

<style lang="scss" scoped>
button {
  all: unset;
  height: 0;
  position: relative;
  top: -35px;
  float: right;
  margin-right: 7px;

  cursor: pointer;

  .align-value {
    padding-top: 7px;
  }
}

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
