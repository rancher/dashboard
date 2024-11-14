<script>
import { LAST_NAMESPACE, WORKSPACE } from '@shell/store/prefs';
import { mapState } from 'vuex';
import Select from '@shell/components/form/Select';
import { WORKSPACE_ANNOTATION } from '@shell/config/labels-annotations';

export default {
  name:       'WorkspaceSwitcher',
  components: { Select },

  computed: {
    ...mapState(['allWorkspaces', 'workspace', 'allNamespaces', 'defaultNamespace', 'getActiveNamespaces']),

    value: {
      get() {
        return this.workspace || this.namespace || this.options[0]?.value;
      },

      set(value) {
        if (value !== this.value) {
          this.$store.commit('updateWorkspace', { value, getters: this.$store.getters });
          this.$store.dispatch('prefs/set', { key: WORKSPACE, value });
        }
      },
    },

    options() {
      if (this.allWorkspaces.length) {
        const out = this.allWorkspaces.map((obj) => {
          return {
            label: obj.nameDisplay,
            value: obj.id,
          };
        });

        return out;
      }

      // If doesn't have workspaces (e.g. no permissions)
      // Then find the workspaces from the annotation.
      return this.allNamespaces.filter((item) => {
        return item.metadata.annotations[WORKSPACE_ANNOTATION] === WORKSPACE;
      }).map((obj) => {
        return {
          label: obj.nameDisplay,
          value: obj.id,
        };
      });
    },
  },

  watch: {
    options(curr, prev) {
      if (curr.length === 0) {
        this.value = '';
      }

      const currentExists = curr.find((item) => item.value === this.value);

      if (curr.length && !currentExists) {
        this.value = curr[0]?.value;
      }
    },
  },

  created() {
    // in fleet standard user with just the project owner and global git repo permissions
    // returns 'default'
    const initValue = !this.workspace ? this.$store.getters['prefs/get'](LAST_NAMESPACE) : '';

    this.value = (initValue === 'default' || initValue === '') && this.options.length ? this.options[0].value : initValue;
  },

  data() {
    return { namespace: this.$store.getters['prefs/get'](LAST_NAMESPACE) };
  },

  methods: {
    focus() {
      this.$refs.select.$refs.search.focus();
    },
  },
};
</script>

<template>
  <div
    class="filter"
    data-testid="workspace-switcher"
  >
    <Select
      ref="select"
      v-model:value="value"
      label="label"
      :options="options"
      :clearable="false"
      :reduce="(opt) => opt.value"
    />
    <!--button v-shortkey.once="['w']" class="hide" @shortkey="focus()" /-->
  </div>
</template>

<style lang="scss" scoped>
.filter {
  min-width: 220px;
  max-width: 100%;
  display: inline-block;
}

.filter.show-masked :deep() .unlabeled-select:not(.masked-dropdown) {
  position: absolute;
  left: 0;
  top: 0;
  height: 0;
  opacity: 0;
  visibility: hidden;
}

.filter:not(.show-masked) :deep() .unlabeled-select.masked-dropdown {
  position: absolute;
  left: 0;
  top: 0;
  height: 0;
  opacity: 0;
  visibility: hidden;
}

.filter :deep() .unlabeled-select.has-more .v-select:not(.vs--open) .vs__dropdown-toggle {
  overflow: hidden;
}

.filter :deep() .unlabeled-select.has-more .v-select.vs--open .vs__dropdown-toggle {
  height: max-content;
  background-color: var(--header-bg);
}

.filter :deep() .unlabeled-select {
  background-color: transparent;
  border: 0;
}

.filter :deep() .unlabeled-select:not(.focused) {
  min-height: 0;
}

.filter :deep() .unlabeled-select:not(.view):hover .vs__dropdown-menu {
  background: var(--dropdown-bg);
}

.filter :deep() .unlabeled-select .v-select.inline {
  margin: 0;
}

.filter :deep() .unlabeled-select .v-select .vs__selected {
  margin: $input-padding-sm;
  user-select: none;
  color: var(--header-btn-text);
}

.filter :deep() .unlabeled-select .vs__search::placeholder {
  color: var(--header-btn-text);
}

.filter :deep() .unlabeled-select INPUT:hover {
  background-color: transparent;
}

.filter :deep() .unlabeled-select .vs__dropdown-toggle {
  background: rgba(0, 0, 0, 0.05);
  border-radius: var(--border-radius);
  border: 1px solid var(--header-btn-bg);
  color: var(--header-btn-text);
  height: 40px;
  max-width: 100%;
  padding-top: 0;
}

.filter :deep() .unlabeled-select .vs__deselect:after {
  color: var(--header-btn-text);
}

.filter :deep() .unlabeled-select .v-select .vs__actions:after {
  fill: var(--header-btn-text) !important;
  color: var(--header-btn-text) !important;
}

.filter :deep() .unlabeled-select INPUT[type='search'] {
  padding: 7px;
}
</style>
