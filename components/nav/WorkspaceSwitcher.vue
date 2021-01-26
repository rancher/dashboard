<script>
import { WORKSPACE } from '@/store/prefs';
import { mapState } from 'vuex';
import Select from '@/components/form/Select';

export default {
  components: { Select },

  computed: {
    ...mapState(['allWorkspaces', 'workspace']),

    value: {
      get() {
        return this.workspace;
      },

      set(value) {
        this.$store.commit('updateWorkspace', { value });
        this.$store.dispatch('prefs/set', { key: WORKSPACE, value });
      },
    },

    options() {
      const out = this.allWorkspaces.map((obj) => {
        return {
          label: obj.nameDisplay,
          value: obj.id,
        };
      });

      return out;
    },
  },

  methods: {
    focus() {
      this.$refs.select.$refs.search.focus();
    },
  },
};
</script>

<template>
  <div class="filter">
    <Select
      ref="select"
      v-model="value"
      label="label"
      :append-to-body="false"
      :options="options"
      :clearable="false"
      :reduce="(opt) => opt.value"
    />
    <button v-shortkey.once="['w']" class="hide" @shortkey="focus()" />
  </div>
</template>

<style type="scss" scoped>
.filter {
  min-width: 220px;
  max-width: 100%;
  display: inline-block;
}

.filter.show-masked ::v-deep .unlabeled-select:not(.masked-dropdown) {
  position: absolute;
  left: 0;
  top: 0;
  height: 0;
  opacity: 0;
  visibility: hidden;
}

.filter:not(.show-masked) ::v-deep .unlabeled-select.masked-dropdown {
  position: absolute;
  left: 0;
  top: 0;
  height: 0;
  opacity: 0;
  visibility: hidden;
}

.filter ::v-deep .unlabeled-select.has-more .v-select:not(.vs--open) .vs__dropdown-toggle {
  overflow: hidden;
}

.filter ::v-deep .unlabeled-select.has-more .v-select.vs--open .vs__dropdown-toggle {
  height: max-content;
  background-color: var(--header-bg);
}

.filter ::v-deep .unlabeled-select {
  background-color: transparent;
}

.filter ::v-deep .unlabeled-select:not(.focused) {
  border: var(--outline-width) solid transparent;
}

.filter ::v-deep .unlabeled-select:not(.view):hover .vs__dropdown-menu {
  background: var(--dropdown-bg);
}

.filter ::v-deep .unlabeled-select .v-select.inline {
  margin: 0;
}

.filter ::v-deep .unlabeled-select .vs__search::placeholder {
  color: white;
}

.filter ::v-deep .unlabeled-select INPUT:hover {
  background-color: transparent;
}

.filter ::v-deep .unlabeled-select .vs__dropdown-toggle {
  background: rgba(0, 0, 0, 0.05);
  border-radius: var(--border-radius);
  border: 1px solid var(--header-btn-bg);
  color: var(--header-btn-text);
  height: 40px;
  max-width: 100%;
  padding-top: 0;
}

.filter ::v-deep .unlabeled-select .vs__deselect:after {
  color: white;
}

.filter ::v-deep .unlabeled-select .v-select .vs__actions:after {
  fill: white !important;
  color: white !important;
}

.filter ::v-deep .unlabeled-select INPUT[type='search'] {
  padding: 7px;
}
</style>
