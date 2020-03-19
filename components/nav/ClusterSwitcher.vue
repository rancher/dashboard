<script>
import { MANAGEMENT } from '@/config/types';
import { sortBy } from '@/utils/sort';
import { findBy } from '@/utils/array';

export default {
  computed: {
    value: {
      get() {
        console.log('Get Value');
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
      console.log('Get Options');

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
  .filter {
    position: relative;
    z-index: 1; // Above the cow so you can click there too
  }

  .filter ::v-deep .v-select {
    max-width: 100%;
    display: inline-block;
  }

  .filter ::v-deep .v-select {
    .vs__dropdown-toggle {
      height: var(--header-height);
      margin-left: 35px;
      background-color: transparent;
      border: 0;
    }

    .vs__selected {
      margin: 2px;
      user-select: none;
      cursor: default;
      color: var(--body-text);
      line-height: calc(var(--header-height) - 10px);
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
