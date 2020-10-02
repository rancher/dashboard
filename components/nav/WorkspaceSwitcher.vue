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
      }
    },

    options() {
      const out = this.allWorkspaces.map((obj) => {
        return {
          label: obj.nameDisplay,
          value: obj.id,
        };
      });

      return out;
    }
  },

  methods: {
    focus() {
      this.$refs.select.$refs.search.focus();
    },
  },
};

</script>

<style type="scss" scoped>
  .filter ::v-deep .v-select {
    max-width: 100%;
    display: inline-block;
  }

  .filter ::v-deep .v-select .vs__selected {
    margin: 4px;
    user-select: none;
    color: white;
    height: calc(var(--header-height) - 26px);
  }

  .filter ::v-deep .vs__dropdown-toggle {
    max-width: 100%;
    border: 1px solid var(--header-btn-bg);
    color: var(--header-btn-text);
    background: rgba(0, 0, 0, 0.05);
    border-radius: var(--border-radius);
    height: calc(var(--header-height) - 16px);
  }

  .filter ::v-deep .vs__deselect:after {
    color: white;
  }

  .filter ::v-deep .v-select .vs__actions:after {
    fill: white !important;
    color: white !important;
  }

  .filter ::v-deep .vs__search {
    width: 0;
    padding: 0;
    margin: 0;
    opacity: 0;
  }
</style>

<template>
  <div class="filter">
    <Select
      ref="select"
      v-model="value"
      label="label"
      :options="options"
      :clearable="false"
      :reduce="opt=>opt.value"
    />
    <button v-shortkey.once="['w']" class="hide" @shortkey="focus()" />
  </div>
</template>
