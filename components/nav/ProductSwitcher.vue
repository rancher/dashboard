<script>
import { mapGetters, mapState } from 'vuex';
import findIndex from 'lodash/findIndex';
import { insertAt } from '@/utils/array';
import { sortBy } from '@/utils/sort';

export default {
  computed: {
    ...mapGetters(['isRancher', 'clusterId']),
    ...mapState('type-map', ['products']),

    value: {
      get() {
        return this.$store.getters['currentProduct'];
      },

      set(product) {
        // Try product-specific index first
        const opt = {
          name:   `c-cluster-${ product }`,
          params: { cluster: this.clusterId, product }
        };

        if ( !this.$router.getMatchedComponents(opt).length ) {
          opt.name = 'c-cluster-product';
        }

        this.$router.push(opt);
      }
    },

    options() {
      const t = this.$store.getters['i18n/t'];
      const entries = this.products.map((p) => {
        return {
          label:     t(`product.${ p.name }`),
          value:     p.name,
          removable: p.removable
        };
      });
      const out = sortBy(entries, ['removable', 'label']);

      const idx = findIndex(out, x => x.removable);

      if ( idx > 0 && (idx + 1 < out.length ) ) {
        insertAt(out, idx, {
          kind:     'divider',
          disabled: true
        });
      }

      return out;
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
      key="prduct"
      v-model="value"
      :clearable="false"
      :options="options"
      :reduce="opt=>opt.value"
      label="label"
    >
      <template v-slot:option="opt">
        <template v-if="opt.kind === 'divider'">
          <hr />
        </template>
        <template v-else>
          {{ opt.label }}
        </template>
      </template>
    </v-select>
    <button v-shortkey.once="['p']" class="hide" @shortkey="focus()" />
  </div>
</template>

<style lang="scss" scoped>
  .filter ::v-deep .v-select {
    max-width: 100%;
    display: inline-block;

    &.vs--disabled .vs__actions {
      display: none;
    }

    .vs__open-indicator {
      fill: white;
    }

    .vs__dropdown-toggle {
      height: var(--header-height);
      margin-left: 35px;
      background-color: transparent;
      border: 0;

      .vs__actions {
        margin-left: -10px;
      }
    }

    .vs__selected {
      margin: 2px;
      user-select: none;
      cursor: default;
      color: white;
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
