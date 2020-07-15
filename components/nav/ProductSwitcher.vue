<script>
import { mapGetters } from 'vuex';
import findIndex from 'lodash/findIndex';
import { insertAt, findBy } from '@/utils/array';
import { sortBy } from '@/utils/sort';
import { ucFirst } from '@/utils/string';

export default {
  computed: {
    ...mapGetters(['isRancher', 'clusterId']),
    ...mapGetters('type-map', ['activeProducts']),

    value: {
      get() {
        return this.$store.getters['productId'];
      },
    },

    options() {
      const t = this.$store.getters['i18n/t'];
      const entries = this.activeProducts.map((p) => {
        let label;
        const key = `product.${ p.name }`;

        if ( this.$store.getters['i18n/exists'](key) ) {
          label = t(key);
        } else {
          label = ucFirst(p.name);
        }

        const out = {
          label,
          value:     p.name,
          removable: p.removable,
        };

        if ( p.externalLink ) {
          out.kind = 'external';
          out.link = p.externalLink;
          out.disabled = true;
        } else {
          out.kind = 'internal';
        }

        return out;
      });

      const out = sortBy(entries, ['removable', 'label']);
      const idx = findIndex(out, x => x.removable);

      if ( idx > 0 && (idx + 1 < out.length ) ) {
        insertAt(out, idx, {
          label:    'The great divide',
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
    },

    change(product) {
      const entry = findBy(this.options, 'value', product);

      if ( entry?.link ) {
        let windowName = '_blank';

        // Non-removable external links (MCM) go to a named window
        if ( entry.removable === false ) {
          windowName = `R_${ product }`;
        }

        window.open(entry.link, windowName);

        return;
      }

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
};

</script>

<template>
  <div class="filter">
    <v-select
      ref="select"
      key="product"
      :value="value"
      :clearable="false"
      :selectable="option => !option.disabled"
      :options="options"
      :reduce="opt=>opt.value"
      label="label"
      @input="change"
    >
      <template v-slot:option="opt">
        <template v-if="opt.kind === 'divider'">
          <hr />
        </template>
        <template v-else-if="opt.kind === 'external'">
          <a :href="opt.link" target="_blank">{{ opt.label }} <i class="icon icon-external-link" /></a>
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
