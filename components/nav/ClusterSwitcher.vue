<script>
import { MANAGEMENT } from '@/config/types';
import { sortBy } from '@/utils/sort';
import { findBy } from '@/utils/array';
import { mapState } from 'vuex';

export default {
  computed: {
    ...mapState(['isMultiCluster']),

    value: {
      get() {
        const options = this.options;
        const existing = findBy(options, 'id', this.$store.getters['clusterId']);

        if ( existing ) {
          return existing;
        }

        return options[0];
      },

      set(neu) {
        this.$router.push({ name: 'c-cluster', params: { cluster: neu.id } });
      }
    },

    options() {
      const all = this.$store.getters['management/all'](MANAGEMENT.CLUSTER);

      const out = all.map((x) => {
        return {
          id:    x.id,
          label: x.nameDisplay,
          ready: x.isReady,
        };
      });

      return sortBy(out, ['ready:desc', 'label']);
    },
  },

  methods: {
    focus() {
      this.$refs.select.$refs.search.focus();
    }
  },
};

</script>

<template>
  <div class="filter">
    <v-select
      ref="select"
      key="cluster"
      v-model="value"
      :selectable="option => option.ready"
      :clearable="false"
      :options="options"
      label="label"
    >
      <template #selected-option="opt">
        <i class="icon icon-copy icon-lg pr-5" />
        {{ opt.label }}
      </template>

      <template #no-options="{ search, searching }">
        <template v-if="searching">
          No clusters found for <em>{{ search }}</em>.
        </template>
        <em v-else class="text-muted">Start typing to search for a cluster.</em>
      </template>

      <template #option="opt">
        <b v-if="opt === value">{{ opt.label }}</b>
        <nuxt-link v-else-if="opt.ready" class="cluster" :to="{name: 'c-cluster', params: { cluster: opt.id }}">
          {{ opt.label }}
        </nuxt-link>
        <span v-else class="text-muted">{{ opt.label }}</span>
      </template>
    </v-select>
    <button v-shortkey.once="['c']" class="hide" @shortkey="focus()" />
  </div>
</template>

<style lang="scss" scoped>
  .filter ::v-deep .v-select {
    max-width: 100%;
    display: inline-block;
    margin-top: 8px;
    border: 1px solid var(--header-btn-bg);
    color: var(--header-btn-text);
    background: rgba(0,0,0,.05);
    border-radius: var(--border-radius);

    &.vs--disabled .vs__actions {
      display: none;
    }

    .vs__actions:after {
      fill: white !important;
      color: white !important;
    }

    .vs__dropdown-toggle {
      height: calc(var(--header-height) - 19px);
      background-color: transparent;
      border: 0;

      .vs__actions {
        margin-left: -10px;
      }
    }

    .vs__selected {
      user-select: none;
      cursor: default;
      color: white;
      line-height: calc(var(--header-height) - 32px);
    }
  }

  .filter ::v-deep INPUT {
    width: auto;
    background-color: transparent;
  }

  .filter ::v-deep INPUT:hover {
    background-color: transparent;
  }

</style>
