<script>
import { mapGetters } from 'vuex';
import findIndex from 'lodash/findIndex';
import { insertAt, findBy } from '@/utils/array';
import { sortBy } from '@/utils/sort';
import { ucFirst } from '@/utils/string';
import { createPopper } from '@popperjs/core';

export default {
  data() {
    return { previous: null };
  },

  computed: {
    ...mapGetters(['clusterId']),
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
          icon:      `icon-${ p.icon || 'copy' }`,
          value:     p.name,
          removable: p.removable !== false,
        };

        if ( p.externalLink ) {
          out.kind = 'external';
          out.link = p.externalLink;
        } else {
          out.kind = 'internal';
        }

        return out;
      });

      const out = sortBy(entries, ['removable', 'weight:desc', 'label']);
      const idx = findIndex(out, x => x.removable);

      if ( idx > 0 ) {
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

    switchToExplorer() {
      this.change('explorer');
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
        this.value = this.previous;

        return;
      }

      this.previous = this.value;

      // Try product-specific index first
      const opt = {
        name:   `c-cluster-${ product }`,
        params: { cluster: this.clusterId, product }
      };

      if ( !this.$router.getMatchedComponents(opt).length ) {
        opt.name = 'c-cluster-product';
      }

      this.$router.push(opt);
    },

    withPopper(dropdownList, component, { width }) {
      dropdownList.className += ' product-menu';

      const popper = createPopper(component.$refs.toggle, dropdownList, {
        strategy:  'fixed',
        modifiers: [
          {
            name:    'toggleClass',
            enabled: true,
            phase:   'write',
            fn({ state }) {
              component.$el.setAttribute('x-placement', state.placement);
            },
          }]
      });

      return () => popper.destroy();
    },
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
      :calculate-position="withPopper"
      :append-to-body="true"

      label="label"
      @input="change"
    >
      <template v-slot:option="opt">
        <template v-if="opt.kind === 'divider'">
          <hr />
        </template>
        <template v-else>
          <i class="product-icon icon icon-lg icon-fw" :class="{[opt.icon]: true}" />
          {{ opt.label }}
          <i v-if="opt.kind === 'external'" class="icon icon-external-link ml-10" />
        </template>
      </template>
    </v-select>
    <button v-shortkey.once="['p']" class="hide" @shortkey="focus()" />
    <button v-shortkey.once="['e']" class="hide" @shortkey="switchToExplorer()" />
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

<style lang="scss">
  .product-menu {
    width: 300px;

    .vs__dropdown-option {
      padding: 10px;
      text-decoration: none;

      &.vs__dropdown-option--disabled {
        // The dividers
        padding: 0;
      }

      .product-icon {
        color: var(--product-icon);
        margin-right: 5px;
      }

      UL {
        margin: 0;
      }
    }

    .vs__dropdown-option--selected {
      color: var(--body-text);

      .product-icon {
        color: var(--product-icon-active);
      }

      A, A:hover, A:focus {
        color: var(--body-text);
      }
    }
  }
</style>
