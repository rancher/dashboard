<script>
import { mapGetters } from 'vuex';
import { insertAt, findBy } from '@/utils/array';
import { sortBy } from '@/utils/sort';
import { ucFirst } from '@/utils/string';
import { createPopper } from '@popperjs/core';
import $ from 'jquery';
import { CATALOG } from '@/config/types';

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
          inStore:   p.inStore || 'cluster',
          weight:    p.weight || 1,
        };

        if ( p.externalLink ) {
          out.kind = 'external';
          out.link = p.externalLink;
        } else if ( p.link ) {
          out.kind = 'internal';
          out.link = p.link;
        } else {
          out.kind = 'internal';
        }

        return out;
      });

      const out = sortBy(entries, ['inStore', 'removable', 'weight:desc', 'label']);
      let last;

      for ( let i = out.length - 1 ; i >= 0 ; i-- ) {
        const entry = out[i];

        if ( last && ( (last.removable !== entry.removable) || (last.inStore !== entry.inStore) ) ) {
          insertAt(out, i + 1, {
            label:    `The great divide ${ i }`,
            kind:     'divider',
            disabled: true
          });
        }

        last = out[i];
      }

      return out;
    },
  },

  methods: {
    focus() {
      this.$refs.select.$refs.search.focus();
    },

    shortcutsActive() {
      const forms = $('FORM');

      return forms.length === 0;
    },

    switchToApps() {
      if ( !this.shortcutsActive() ) {
        return;
      }

      this.change('apps', 'c-cluster-product-resource', { resource: CATALOG.APP });
    },

    switchToExplorer() {
      if ( !this.shortcutsActive() ) {
        return;
      }

      this.change('explorer');
    },

    switchToFleet() {
      if ( !this.shortcutsActive() ) {
        return;
      }

      this.change('fleet');
    },

    change(product, route = '', moreParams = {}) {
      const entry = findBy(this.options, 'value', product);

      if ( !entry ) {
        return;
      }

      if ( entry?.link ) {
        if ( entry.kind === 'external' ) {
          let windowName = '_blank';

          // Non-removable external links (MCM) go to a named window
          if ( entry.removable === false ) {
            windowName = `R_${ product }`;
          }

          window.open(entry.link, windowName);
          this.value = this.previous;

          return;
        } else {
          window.location.href = entry.link;
        }
      }

      this.previous = this.value;

      // Try product-specific index first
      const opt = {
        name:   route || `c-cluster-${ product }`,
        params: {
          cluster: this.clusterId,
          product,
          ...moreParams
        }
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
    <button v-shortkey.once="['f']" class="hide" @shortkey="switchToFleet()" />
    <button v-shortkey.once="['e']" class="hide" @shortkey="switchToExplorer()" />
    <button v-shortkey.once="['a']" class="hide" @shortkey="switchToApps($event)" />
  </div>
</template>

<style lang="scss" scoped>
  .filter ::v-deep .v-select {
    max-width: 100%;
    display: inline-block;

    &.vs--disabled .vs__actions {
      display: none;
    }

    .vs__actions:after {
      fill: white !important;
      color: white !important;
    }

    .vs__dropdown-toggle {
      height: var(--header-height);
      // margin-left: 35px;
      background-color: transparent;
      border: 0;
      position: relative;
      // left: 35px;
    }

    .vs__selected {
      user-select: none;
      cursor: default;
      color: white;
      line-height: calc(var(--header-height) - 14px);
      position: relative;
      left: 40px;
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
    max-height: 90vh;

    .vs__dropdown-option {
      padding: 10px;
      text-decoration: none;
      border-left: 5px solid transparent;

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
      // font-weight: bold;
      background: var(--nav-active);
      border-left: 5px solid var(--primary);

      .product-icon {
        color: var(--product-icon-active);
      }

      A, A:hover, A:focus {
        // color: var(--body-text);
      }
    }
  }
</style>
